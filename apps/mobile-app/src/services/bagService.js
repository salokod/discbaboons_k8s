/**
 * Bag Service
 * Handles API calls for bag management operations
 */

import { API_BASE_URL } from '../config/environment';
import { getTokens } from './tokenStorage';

/**
 * Validate bag name format before sending to API
 * @param {string} name - Bag name to validate
 * @throws {Error} Validation error if bag name is invalid
 */
function validateBagName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Bag name is required');
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error('Bag name cannot be empty');
  }

  if (trimmedName.length > 50) {
    throw new Error('Bag name must be no more than 50 characters');
  }
}

/**
 * Validate bag privacy setting
 * @param {string} privacy - Privacy setting to validate
 * @throws {Error} Validation error if privacy setting is invalid
 */
function validatePrivacy(privacy) {
  const validPrivacyOptions = ['private', 'friends', 'public'];
  if (!validPrivacyOptions.includes(privacy)) {
    throw new Error('Privacy must be private, friends, or public');
  }
}

/**
 * Convert privacy string to API boolean flags
 * @param {string} privacy - Privacy setting ('private', 'friends', 'public')
 * @returns {Object} Object with is_public and is_friends_visible booleans
 */
function convertPrivacyToFlags(privacy) {
  switch (privacy) {
    case 'public':
      return { is_public: true, is_friends_visible: false };
    case 'friends':
      return { is_public: false, is_friends_visible: true };
    case 'private':
    default:
      return { is_public: false, is_friends_visible: false };
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
 * Get user's bags with pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<{bags: Array, pagination: Object}>} User's bags and pagination info
 * @throws {Error} Request failed error with message
 */
export async function getBags(params = {}) {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Build query parameters (API supports limit, offset, include_lost)
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());
    if (params.include_lost) queryParams.set('include_lost', params.include_lost.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/bags${queryString ? `?${queryString}` : ''}`;

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

    // Validate response format matches API documentation
    if (!data.success || !Array.isArray(data.bags)) {
      throw new Error('Invalid response from server');
    }

    return {
      bags: data.bags,
      pagination: data.pagination || {
        total: data.bags.length,
        limit: 20,
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
 * Create a new bag
 * @param {Object} bagData - Bag data (name, description, privacy)
 * @returns {Promise<Object>} Created bag data
 * @throws {Error} Create bag failed error with message
 */
export async function createBag(bagData) {
  // Validate inputs before making API call
  if (!bagData || typeof bagData !== 'object') {
    throw new Error('Bag data is required');
  }

  const { name, description, privacy } = bagData;
  validateBagName(name);
  validatePrivacy(privacy);

  // Description is optional but validate if provided
  if (description && typeof description !== 'string') {
    throw new Error('Description must be a string');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Convert privacy string to API boolean flags
    const privacyFlags = convertPrivacyToFlags(privacy);

    const response = await fetch(`${API_BASE_URL}/api/bags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || '',
        ...privacyFlags,
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
        // Backend validation errors
        throw new Error(data.message || 'Please check your bag information');
      }
      if (response.status === 409) {
        // Backend returns conflict for duplicate bag name
        throw new Error(data.message || 'You already have a bag with this name');
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

    // Validate response format matches API documentation
    if (!data.success || !data.bag) {
      throw new Error('Invalid response from server');
    }

    return data.bag;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Update existing bag
 * @param {string} bagId - Bag ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated bag data
 * @throws {Error} Update bag failed error with message
 */
export async function updateBag(bagId, updates) {
  // Validate inputs before making API call
  if (!bagId || typeof bagId !== 'string') {
    throw new Error('Bag ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates are required');
  }

  const { name, description, privacy } = updates;

  // Validate name if provided
  if (name !== undefined) {
    validateBagName(name);
  }

  // Validate privacy if provided
  if (privacy !== undefined) {
    validatePrivacy(privacy);
  }

  // Validate description if provided
  if (description !== undefined && typeof description !== 'string') {
    throw new Error('Description must be a string');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Build update payload with only provided fields
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description.trim();
    if (privacy !== undefined) {
      const privacyFlags = convertPrivacyToFlags(privacy);
      Object.assign(updatePayload, privacyFlags);
    }

    const response = await fetch(`${API_BASE_URL}/api/bags/${bagId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload),
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
        throw new Error(data.message || 'Please check your bag information');
      }
      if (response.status === 404) {
        // Bag not found
        throw new Error(data.message || 'Bag not found');
      }
      if (response.status === 409) {
        // Backend returns conflict for duplicate bag name
        throw new Error(data.message || 'You already have a bag with this name');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.bag) {
      throw new Error('Invalid response from server');
    }

    return data.bag;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get a single bag by ID
 * @param {string} bagId - Bag ID to retrieve
 * @param {Object} options - Query options (include_lost)
 * @returns {Promise<Object>} Bag data with contents
 * @throws {Error} Get bag failed error with message
 */
export async function getBag(bagId, options = {}) {
  // Validate inputs before making API call
  if (!bagId || typeof bagId !== 'string') {
    throw new Error('Bag ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Build query string from options
    const queryParams = new URLSearchParams();
    if (options.include_lost) {
      queryParams.append('include_lost', 'true');
    }
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/bags/${bagId}${queryString ? `?${queryString}` : ''}`;

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
        // Backend validation errors
        throw new Error(data.message || 'Invalid bag ID format');
      }
      if (response.status === 404) {
        // Bag not found
        throw new Error(data.message || 'Bag not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // API actually returns {success: true, bag: {...}} format
    if (!data || !data.success || !data.bag) {
      throw new Error('Invalid response from server');
    }

    const bagData = data.bag;

    // Validate essential fields
    if (!bagData.id) {
      throw new Error('Invalid bag data from server');
    }

    // Ensure bag_contents is always an array (even if empty)
    if (!bagData.bag_contents) {
      bagData.bag_contents = [];
    }

    return bagData;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Add a disc to a bag
 * @param {string} bagId - Bag ID to add disc to
 * @param {Object} discData - Disc data including disc_id and optional custom properties
 * @returns {Promise<Object>} Added bag content data
 * @throws {Error} Add disc failed error with message
 */
export async function addDiscToBag(bagId, discData) {
  // Validate inputs before making API call
  if (!bagId || typeof bagId !== 'string') {
    throw new Error('Bag ID is required');
  }

  if (!discData || typeof discData !== 'object') {
    throw new Error('Disc data is required');
  }

  if (!discData.disc_id || typeof discData.disc_id !== 'string') {
    throw new Error('Disc ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/bags/${bagId}/discs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(discData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Enhanced error logging for debugging (development only)
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Add disc API error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          url: `${API_BASE_URL}/api/bags/${bagId}/discs`,
        });
      }

      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid disc data');
      }
      if (response.status === 403) {
        // Authorization error
        throw new Error(data.message || 'Bag not found or access denied');
      }
      if (response.status === 404) {
        // Disc not found
        throw new Error(data.message || 'Disc not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // API returns success wrapper: { success: true, bag_content: {...} }
    if (!data || !data.success || !data.bag_content) {
      throw new Error('Invalid response from server');
    }

    const bagContent = data.bag_content;

    // Validate essential fields of the bag content
    if (!bagContent.id || !bagContent.disc_id) {
      throw new Error('Invalid bag content data from server');
    }

    return bagContent;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Mark a disc as lost or found
 * @param {string} contentId - Bag content ID to mark as lost/found
 * @param {boolean} isLost - True to mark as lost, false to mark as found
 * @param {string} notes - Optional notes about where/how disc was lost
 * @returns {Promise<Object>} Updated disc data
 * @throws {Error} Mark disc lost failed error with message
 */
export async function markDiscAsLost(contentId, isLost = true, notes = '') {
  // Validate inputs before making API call
  if (!contentId || typeof contentId !== 'string') {
    throw new Error('Content ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const body = {
      is_lost: isLost,
    };

    if (isLost && notes) {
      body.lost_notes = notes;
    }

    const response = await fetch(`${API_BASE_URL}/api/bags/discs/${contentId}/lost`, {
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
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid request');
      }
      if (response.status === 404) {
        // Disc not found
        throw new Error(data.message || 'Disc not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.bag_content) {
      throw new Error('Invalid response from server');
    }

    return data.bag_content;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Delete a bag
 * @param {string} bagId - Bag ID to delete
 * @returns {Promise<Object>} Success response
 * @throws {Error} Delete bag failed error with message
 */
export async function deleteBag(bagId) {
  // Validate inputs before making API call
  if (!bagId || typeof bagId !== 'string') {
    throw new Error('Bag ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/bags/${bagId}`, {
      method: 'DELETE',
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
      if (response.status === 404) {
        // Bag not found
        throw new Error(data.message || 'Bag not found');
      }
      if (response.status === 409) {
        // Backend returns conflict if bag has discs or other dependencies
        throw new Error(data.message || 'Cannot delete bag that contains discs');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Remove a disc from a bag
 * @param {string} contentId - Bag content ID to remove
 * @returns {Promise<Object>} Success response
 * @throws {Error} Remove disc failed error with message
 */
export async function removeDiscFromBag(contentId) {
  // Validate inputs before making API call
  if (!contentId || typeof contentId !== 'string') {
    throw new Error('Content ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/bags/discs/${contentId}`, {
      method: 'DELETE',
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
      if (response.status === 404) {
        // Disc not found
        throw new Error(data.message || 'Disc not found in bag');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Update disc properties in a bag
 * @param {string} bagId - Bag ID containing the disc
 * @param {string} contentId - Bag content ID to update
 * @param {Object} updates - Updates object with fields to change
 * @returns {Promise<Object>} Updated disc data
 * @throws {Error} Update disc failed error with message
 */
export async function updateDiscInBag(bagId, contentId, updates) {
  // Validate inputs before making API call
  if (!bagId || typeof bagId !== 'string') {
    throw new Error('Bag ID is required');
  }

  if (!contentId || typeof contentId !== 'string') {
    throw new Error('Content ID is required');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/bags/${bagId}/discs/${contentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
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
        throw new Error(data.message || 'Invalid update data');
      }
      if (response.status === 404) {
        // Disc not found
        throw new Error(data.message || 'Disc not found in bag');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.bag_content) {
      throw new Error('Invalid response from server');
    }

    return data.bag_content;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Move discs between bags
 * @param {string} sourceBagId - Source bag ID to move discs from
 * @param {string} targetBagId - Target bag ID to move discs to
 * @param {Array} contentIds - Array of bag content IDs to move
 * @returns {Promise<Object>} Success response with moved count
 * @throws {Error} Move discs failed error with message
 */
export async function moveDiscBetweenBags(sourceBagId, targetBagId, contentIds) {
  // Validate inputs before making API call
  if (!sourceBagId || typeof sourceBagId !== 'string') {
    throw new Error('Source bag ID is required');
  }

  if (!targetBagId || typeof targetBagId !== 'string') {
    throw new Error('Target bag ID is required');
  }

  if (!contentIds || !Array.isArray(contentIds)) {
    throw new Error('Content IDs are required');
  }

  if (contentIds.length === 0) {
    throw new Error('At least one content ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/bags/discs/move`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        sourceBagId,
        targetBagId,
        contentIds,
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
        // Backend validation errors
        throw new Error(data.message || 'Invalid move request');
      }
      if (response.status === 404) {
        // Bag or disc not found
        throw new Error(data.message || 'Bag or disc not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Mark multiple discs as lost or found (bulk mark lost)
 * @param {Array} contentIds - Array of bag content IDs to mark as lost/found
 * @param {boolean} isLost - True to mark as lost, false to mark as found
 * @param {string} notes - Optional notes about where/how discs were lost
 * @returns {Promise<Object>} Success response with marked count
 * @throws {Error} Bulk mark lost failed error with message
 */
export async function bulkMarkDiscsAsLost(contentIds, isLost = true, notes = '') {
  // Validate inputs before making API call
  if (!contentIds || !Array.isArray(contentIds)) {
    throw new Error('Content IDs are required');
  }

  if (contentIds.length === 0) {
    throw new Error('At least one content ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/bags/discs/bulk-mark-lost`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        contentIds,
        isLost,
        notes,
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
        // Backend validation errors
        throw new Error(data.message || 'Invalid mark lost request');
      }
      if (response.status === 404) {
        // Disc not found
        throw new Error(data.message || 'One or more discs not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}
