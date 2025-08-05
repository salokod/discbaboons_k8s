/**
 * Token Refresh Service
 * Handles automatic token refresh and expiration management
 */

import { API_BASE_URL } from '../config/environment';
import { storeTokens, clearTokens } from './tokenStorage';

// Global timer reference for cleanup
let refreshTimer = null;

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Valid refresh token
 * @returns {Promise<Object>} New tokens object
 * @throws {Error} If refresh fails
 */
export async function refreshAccessToken(refreshToken) {
  // Validate input
  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
    throw new Error('Refresh token is required');
  }

  // Create timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      // Handle backend error responses
      if (response.status === 400) {
        // ValidationError - invalid/expired refresh token
        // Clear stored tokens since refresh token is invalid
        await clearTokens();
        throw new Error(data.message || 'Invalid or expired refresh token');
      }

      throw new Error(data.message || 'Failed to refresh token');
    }

    // Validate response format (matches backend auth.refresh.service.js)
    if (!data.success || !data.accessToken || !data.refreshToken) {
      throw new Error('Invalid refresh response from server');
    }

    // Create tokens object for storage
    const newTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };

    // Store new tokens securely
    await storeTokens(newTokens);

    return newTokens;
  } catch (error) {
    clearTimeout(timeoutId);

    // Network errors
    if (error.name === 'AbortError') {
      throw new Error('Token refresh timed out');
    }

    if (error.message.includes('fetch')) {
      throw new Error('Network error during token refresh');
    }

    // Re-throw other errors (validation, server errors)
    if (error.message.startsWith('Failed to refresh token:')) {
      throw error;
    }

    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}

/**
 * Check if JWT token is expired or will expire soon
 * @param {string} token - JWT token to check
 * @param {number} bufferSeconds - Seconds before expiration to consider "expired" (default: 120)
 * @returns {boolean} True if token is expired or will expire within buffer time
 */
export function isTokenExpired(token, bufferSeconds = 120) {
  if (!token || typeof token !== 'string') {
    return true;
  }

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }

    // Decode payload (base64)
    const payload = JSON.parse(atob(parts[1]));

    if (!payload.exp) {
      return true;
    }

    // Check if token expires within buffer time
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = payload.exp;

    return (expirationTime - currentTime) <= bufferSeconds;
  } catch (error) {
    // Invalid token format
    return true;
  }
}

/**
 * Set up automatic token refresh timer
 * @param {string} accessToken - Current access token
 * @param {Function} refreshCallback - Function to call when refresh is needed
 * @returns {number} Timer ID for cleanup
 */
export function setupTokenRefreshTimer(accessToken, refreshCallback) {
  // Clear any existing timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  if (!accessToken || typeof refreshCallback !== 'function') {
    return null;
  }

  try {
    // Parse token to get expiration
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      // Invalid token, refresh immediately
      refreshCallback();
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) {
      // No expiration, refresh immediately
      refreshCallback();
      return null;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = payload.exp;
    const timeUntilExpiration = expirationTime - currentTime;

    // Refresh 2 minutes (120 seconds) before expiration
    const refreshBuffer = 120;
    const timeUntilRefresh = timeUntilExpiration - refreshBuffer;

    if (timeUntilRefresh <= 0) {
      // Token expires soon, refresh immediately
      refreshCallback();
      return null;
    }

    // Set timer to refresh before expiration
    refreshTimer = setTimeout(refreshCallback, timeUntilRefresh * 1000);
    return refreshTimer;
  } catch (error) {
    // Error parsing token, refresh immediately
    refreshCallback();
    return null;
  }
}

/**
 * Clear the token refresh timer
 * @param {number} timerId - Timer ID to clear (optional, uses global if not provided)
 */
export function clearTokenRefreshTimer(timerId) {
  if (timerId) {
    clearTimeout(timerId);
  }

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}
