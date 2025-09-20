/**
 * Profile Service
 * Handles profile-related API calls using existing backend endpoints
 */

import { getTokens } from './tokenStorage';
import { API_BASE_URL } from '../config/environment';

/**
 * Get current user's profile
 * Uses existing GET /api/profile endpoint
 */
export async function getProfile() {
  const tokens = await getTokens();
  if (!tokens || !tokens.accessToken) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Return the error data so the component can access the actual API error message
    return { success: false, message: data.message || 'Failed to get profile' };
  }

  return data;
}

/**
 * Update current user's profile
 * Uses existing PUT /api/profile endpoint
 */
export async function updateProfile(profileData) {
  const tokens = await getTokens();
  if (!tokens || !tokens.accessToken) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.accessToken}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    // Return the error data so the component can access the actual API error message
    return { success: false, message: data.message || 'Failed to update profile' };
  }

  return data;
}

/**
 * Search for users by username or email
 * Uses existing GET /api/profile/search endpoint
 */
export async function searchUsers(query, options = {}) {
  if (!query || query.trim() === '') {
    throw new Error('Search query is required');
  }

  const { limit = 20, offset = 0 } = options;

  const tokens = await getTokens();
  if (!tokens || !tokens.accessToken) {
    throw new Error('No authentication token available');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const url = new URL(`${API_BASE_URL}/api/profile/search`);
    url.searchParams.append('query', query.trim());
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(data.message || 'Authentication failed');
      }
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid search parameters');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to search users');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.users || !data.pagination) {
      throw new Error('Invalid response from server');
    }

    return {
      users: data.users,
      pagination: data.pagination,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
