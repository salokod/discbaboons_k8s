/**
 * Friend Service
 * Handles API calls for friend management and social features
 */

import { API_BASE_URL } from '../config/environment';
import { getTokens } from './tokenStorage';

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
 * Get friends list with pagination and bag statistics
 * @param {Object} options - Query options
 * @param {number} options.limit - Results per page (default: 20)
 * @param {number} options.offset - Results to skip (default: 0)
 * @returns {Promise<Object>} Friends list with pagination metadata
 * @throws {Error} API error or network error
 */
async function getFriends(options = {}) {
  const { limit = 20, offset = 0 } = options;

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const url = new URL(`${API_BASE_URL}/api/friends`);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data.message || 'Authentication failed');
      }
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid request parameters');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to load friends list');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.friends || !data.pagination) {
      throw new Error('Invalid response from server');
    }

    return {
      friends: data.friends,
      pagination: data.pagination,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get friend requests (incoming, outgoing, or all)
 * @param {string} type - Request type: 'incoming', 'outgoing', or 'all'
 * @returns {Promise<Object>} Friend requests list
 * @throws {Error} API error or network error
 */
async function getRequests(type = 'all') {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const url = new URL(`${API_BASE_URL}/api/friends/requests`);
    url.searchParams.append('type', type);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data.message || 'Authentication failed');
      }
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid request parameters');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to load friend requests');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.requests) {
      throw new Error('Invalid response from server');
    }

    return {
      requests: data.requests,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Send a friend request to a user
 * @param {number} recipientId - Target user ID
 * @returns {Promise<Object>} Request result
 * @throws {Error} API error or network error
 */
async function sendRequest(recipientId) {
  if (!recipientId || typeof recipientId !== 'number') {
    throw new Error('Recipient ID is required and must be a number');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const requestPayload = { recipientId };
    const requestUrl = `${API_BASE_URL}/api/friends/request`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data.message || 'Authentication failed');
      }
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid request parameters');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to send friend request');
    }

    // Validate response format matches API documentation
    if (!data.success) {
      throw new Error('Invalid response from server');
    }
    return {
      request: data.request,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Search for users by username
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 * @throws {Error} API error or network error
 */
async function searchUsers(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required and must be a string');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const url = new URL(`${API_BASE_URL}/api/profile/search`);
    url.searchParams.append('username', query);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data.message || 'Authentication failed');
      }
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid search query');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to search users');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.profiles) {
      throw new Error('Invalid response from server');
    }

    // Map profiles to users for compatibility
    return {
      users: data.profiles.map((profile) => ({
        ...profile,
        id: profile.user_id, // Transform user_id to id for FlatList compatibility
      })),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Respond to a friend request
 * @param {number} requestId - Request ID
 * @param {string} action - 'accept' or 'deny'
 * @returns {Promise<Object>} Response result
 * @throws {Error} API error or network error
 */
async function respondToRequest(requestId, action) {
  if (!requestId || typeof requestId !== 'number') {
    throw new Error('Request ID is required and must be a number');
  }

  if (!action || !['accept', 'deny'].includes(action)) {
    throw new Error('Action must be either "accept" or "deny"');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/friends/respond`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requestId, action }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data.message || 'Authentication failed');
      }
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid request parameters');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to respond to friend request');
    }

    // Validate response format matches API documentation
    if (!data.success) {
      throw new Error('Invalid response from server');
    }

    // For accept actions, return the new friendship
    // For deny actions, return success confirmation
    if (action === 'accept' && data.friendship) {
      return {
        friendship: data.friendship,
      };
    }

    return {
      success: true,
      action,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const friendService = {
  getFriends,
  getRequests,
  sendRequest,
  respondToRequest,
  searchUsers,
};
