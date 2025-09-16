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

export const friendService = {
  getFriends,
};
