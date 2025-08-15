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
