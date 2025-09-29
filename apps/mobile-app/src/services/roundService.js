/**
 * Round Service
 * Handles API calls for round management operations
 */

import { API_BASE_URL } from '../config/environment';
import { getTokens } from './tokenStorage';

/**
 * Validate round name format before sending to API
 * @param {string} name - Round name to validate
 * @throws {Error} Validation error if round name is invalid
 */
function validateRoundName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Round name is required');
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error('Round name cannot be empty');
  }

  if (trimmedName.length > 100) {
    throw new Error('Round name must be no more than 100 characters');
  }
}

/**
 * Validate course ID format
 * @param {string} courseId - Course ID to validate
 * @throws {Error} Validation error if course ID is invalid
 */
function validateCourseId(courseId) {
  if (!courseId || typeof courseId !== 'string') {
    throw new Error('Course ID is required');
  }

  const trimmedId = courseId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Course ID is required');
  }
}

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
 * Create a new round
 * @param {Object} roundData - Round data (courseId, name, etc.)
 * @returns {Promise<Object>} Created round data
 * @throws {Error} Create round failed error with message
 */
export async function createRound(roundData) {
  // Validate inputs before making API call
  if (!roundData || typeof roundData !== 'object') {
    throw new Error('Round data is required');
  }

  const { courseId, name } = roundData;
  validateCourseId(courseId);
  validateRoundName(name);

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Prepare payload for API
    const payload = {
      courseId,
      name: name.trim(),
      // Optional fields can be added later
      startingHole: roundData.startingHole || 1,
      isPrivate: roundData.isPrivate || false,
      skinsEnabled: roundData.skinsEnabled || false,
      skinsValue: roundData.skinsValue || null,
    };

    const response = await fetch(`${API_BASE_URL}/api/rounds`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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
        // Backend validation errors
        throw new Error(data.message || 'Invalid round data provided');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many requests. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Handle direct response object (backend returns round object directly)
    if (!data || !data.id) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get user's rounds with pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<{rounds: Array, pagination: Object}>} User's rounds and pagination info
 * @throws {Error} Request failed error with message
 */
export async function getRounds(params = {}) {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Build query parameters (API supports limit, offset, status)
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());
    if (params.status) queryParams.set('status', params.status.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/rounds${queryString ? `?${queryString}` : ''}`;

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
      if (response.status === 400) {
        // Backend validation errors for query parameters
        throw new Error(data.message || 'Invalid request parameters');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many requests. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format - backend doesn't include 'success' field
    if (!data || !Array.isArray(data.rounds)) {
      throw new Error('Invalid response from server');
    }

    // Backend returns pagination fields at root level, not in a pagination object
    return {
      rounds: data.rounds,
      pagination: {
        total: data.total || data.rounds.length,
        limit: data.limit || 20,
        offset: data.offset || 0,
        hasMore: data.hasMore || false,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get a single round by ID with details
 * @param {string} roundId - Round ID to retrieve
 * @returns {Promise<Object>} Round data with players and pars
 * @throws {Error} Get round failed error with message
 */
export async function getRoundDetails(roundId) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}`, {
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
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid round ID format');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Handle both wrapped and direct response formats
    // Backend can return either { success: true, round: {...} } or direct round object
    let roundData;
    if (data && data.success && data.round) {
      // Wrapped format
      roundData = data.round;
    } else if (data && data.id) {
      // Direct format - backend returns round object directly
      roundData = data;
    } else {
      throw new Error('Invalid response from server');
    }

    // Validate essential fields
    if (!roundData.id) {
      throw new Error('Invalid round data from server');
    }

    // Ensure players is always an array (even if empty)
    if (!roundData.players) {
      roundData.players = [];
    }

    // Ensure pars is always an object (even if empty)
    if (!roundData.pars) {
      roundData.pars = {};
    }

    return roundData;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Add players (friends and guests) to a round
 * @param {string} roundId - Round ID
 * @param {Object} players - Players to add
 * @returns {Promise<Object>} Response result
 * @throws {Error} API error or network error
 */
export async function addPlayersToRound(roundId, players) {
  if (!roundId || !roundId.trim()) {
    throw new Error('Round ID is required');
  }

  if (!players || !Array.isArray(players) || players.length === 0) {
    throw new Error('At least one player is required');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}/players`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ players }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to add players: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection and try again');
    }
    throw error;
  }
}
