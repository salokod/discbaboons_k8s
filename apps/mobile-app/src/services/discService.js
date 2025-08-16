/**
 * Disc Service
 * Handles API calls for disc database operations (master, pending, submission)
 */

import { API_BASE_URL } from '../config/environment';
import { getTokens, storeTokens } from './tokenStorage';
import { refreshAccessToken } from './tokenRefresh';

/**
 * Get authentication headers with access token
 * @returns {Promise<Object>} Headers object with Authorization
 * @throws {Error} If no access token is available
 */
async function getAuthHeaders() {
  const tokens = await getTokens();
  if (!tokens || !tokens.accessToken) {
    throw new Error('Authentication required. Please log in again.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokens.accessToken}`,
  };
}

/**
 * Make authenticated request with automatic token refresh on 401
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Response object
 * @throws {Error} Request failed error
 */
async function makeAuthenticatedRequest(url, options = {}) {
  // First attempt with current token
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // If 401, try to refresh token and retry once
  if (response.status === 401) {
    try {
      const tokens = await getTokens();
      if (tokens?.refreshToken) {
        // Attempt token refresh
        const newTokens = await refreshAccessToken(tokens.refreshToken);
        await storeTokens(newTokens);

        // Retry request with new token
        const newHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newTokens.accessToken}`,
        };

        return fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers,
          },
        });
      }
    } catch (refreshError) {
      // Refresh failed, return original 401 response
    }
  }

  return response;
}

/**
 * Validate flight number (speed, glide, turn, fade)
 * @param {number} value - Flight number value
 * @param {string} field - Field name for error messages
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @throws {Error} Validation error if value is invalid
 */
function validateFlightNumber(value, field, min, max) {
  if (typeof value !== 'number') {
    throw new Error(`${field} must be a number`);
  }

  if (value < min || value > max) {
    throw new Error(`${field} must be between ${min} and ${max}`);
  }
}

/**
 * Validate disc data before submission
 * @param {Object} discData - Disc data to validate
 * @throws {Error} Validation error if data is invalid
 */
function validateDiscData(discData) {
  if (!discData || typeof discData !== 'object') {
    throw new Error('Disc data is required');
  }

  const {
    brand, model, speed, glide, turn, fade,
  } = discData;

  // Required fields
  if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
    throw new Error('Brand is required');
  }

  if (!model || typeof model !== 'string' || model.trim().length === 0) {
    throw new Error('Model is required');
  }

  // Flight number validation
  validateFlightNumber(speed, 'Speed', 1, 15);
  validateFlightNumber(glide, 'Glide', 1, 7);
  validateFlightNumber(turn, 'Turn', -5, 2);
  validateFlightNumber(fade, 'Fade', 0, 5);
}

/**
 * Search master disc database with filtering
 * @param {Object} filters - Search filters
 * @returns {Promise<{discs: Array, pagination: Object}>} Search results with pagination
 * @throws {Error} Request failed error with message
 */
export async function searchDiscs(filters = {}) {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Build query parameters from filters
    const queryParams = new URLSearchParams();

    // Basic filters
    if (filters.brand) queryParams.set('brand', filters.brand);
    if (filters.model) queryParams.set('model', filters.model);

    // Flight number filters (supports ranges like "8-10" or single values)
    if (filters.speed) queryParams.set('speed', filters.speed.toString());
    if (filters.glide) queryParams.set('glide', filters.glide.toString());
    if (filters.turn) queryParams.set('turn', filters.turn.toString());
    if (filters.fade) queryParams.set('fade', filters.fade.toString());

    // Pagination
    if (filters.limit) queryParams.set('limit', filters.limit.toString());
    if (filters.offset !== undefined) queryParams.set('offset', filters.offset.toString());

    // Approval status (defaults to true in API)
    if (filters.approved !== undefined) queryParams.set('approved', filters.approved.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/discs/master${queryString ? `?${queryString}` : ''}`;

    const response = await makeAuthenticatedRequest(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors for filters
        throw new Error(data.message || 'Invalid filter parameters');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many disc searches. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !Array.isArray(data.discs)) {
      throw new Error('Invalid response from server');
    }

    return {
      discs: data.discs,
      pagination: data.pagination || {
        total: data.discs.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Submit new disc to master database (creates pending disc)
 * @param {Object} discData - Disc data (brand, model, speed, glide, turn, fade)
 * @returns {Promise<Object>} Created disc data (with approved: false)
 * @throws {Error} Submit failed error with message
 */
export async function submitDisc(discData) {
  // Validate disc data before making API call
  validateDiscData(discData);

  const {
    brand, model, speed, glide, turn, fade,
  } = discData;

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/discs/master`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        brand: brand.trim(),
        model: model.trim(),
        speed,
        glide,
        turn,
        fade,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors (includes duplicate detection)
        throw new Error(data.message || 'Please check your disc information');
      }
      if (response.status === 413) {
        // Payload too large
        throw new Error(data.message || 'Request too large');
      }
      if (response.status === 429) {
        // Rate limiting (10 submissions per hour)
        throw new Error(data.message || 'Too many disc submissions. Please try again in an hour.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.disc) {
      throw new Error('Invalid response from server');
    }

    return data.disc;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get pending discs awaiting approval (admin only)
 * @param {Object} filters - Search filters (same as searchDiscs)
 * @returns {Promise<{discs: Array, pagination: Object}>} Pending discs with pagination
 * @throws {Error} Request failed error with message
 */
export async function getPendingDiscs(filters = {}) {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Build query parameters from filters (same as searchDiscs)
    const queryParams = new URLSearchParams();

    if (filters.brand) queryParams.set('brand', filters.brand);
    if (filters.model) queryParams.set('model', filters.model);
    if (filters.speed) queryParams.set('speed', filters.speed.toString());
    if (filters.glide) queryParams.set('glide', filters.glide.toString());
    if (filters.turn) queryParams.set('turn', filters.turn.toString());
    if (filters.fade) queryParams.set('fade', filters.fade.toString());
    if (filters.limit) queryParams.set('limit', filters.limit.toString());
    if (filters.offset !== undefined) queryParams.set('offset', filters.offset.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/discs/pending${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        // Admin access required
        throw new Error(data.message || 'Admin access required');
      }
      if (response.status === 400) {
        // Backend validation errors for filters
        throw new Error(data.message || 'Invalid filter parameters');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many admin requests. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !Array.isArray(data.discs)) {
      throw new Error('Invalid response from server');
    }

    return {
      discs: data.discs,
      pagination: data.pagination || {
        total: data.discs.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Approve pending disc (admin only)
 * @param {string} discId - Disc ID to approve
 * @returns {Promise<Object>} Approved disc data (with approved: true)
 * @throws {Error} Approval failed error with message
 */
export async function approveDisc(discId) {
  // Validate disc ID
  if (!discId || typeof discId !== 'string') {
    throw new Error('Disc ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/discs/${discId}/approve`, {
      method: 'PATCH',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        // Admin access required
        throw new Error(data.message || 'Admin access required');
      }
      if (response.status === 404) {
        // Disc not found
        throw new Error(data.message || 'Disc not found');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many admin operations. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.disc) {
      throw new Error('Invalid response from server');
    }

    return data.disc;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Deny pending disc (admin only)
 * @param {string} discId - Disc ID to deny
 * @param {string} reason - Optional reason for denial
 * @returns {Promise<Object>} Denied disc data
 * @throws {Error} Denial failed error with message
 */
export async function denyDisc(discId, reason) {
  // Validate disc ID
  if (!discId || typeof discId !== 'string') {
    throw new Error('Disc ID is required');
  }

  // Validate reason if provided
  if (reason && typeof reason !== 'string') {
    throw new Error('Reason must be a string');
  }

  // Validate reason length if provided
  if (reason && reason.length > 500) {
    throw new Error('Reason must be 500 characters or less');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Prepare request body
    const body = reason ? { reason } : {};

    const response = await fetch(`${API_BASE_URL}/api/discs/${discId}/deny`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        // Admin access required
        throw new Error(data.message || 'Admin access required');
      }
      if (response.status === 404) {
        // Disc not found
        throw new Error(data.message || 'Disc not found');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many admin operations. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.disc) {
      throw new Error('Invalid response from server');
    }

    return data.disc;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}
