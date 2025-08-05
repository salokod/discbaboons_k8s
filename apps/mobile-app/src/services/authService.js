/**
 * Authentication Service
 * Handles API calls for login, registration, and token management
 */

import { API_BASE_URL } from '../config/environment';

/**
 * Login user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<{user: Object, tokens: Object}>} User data and tokens
 * @throws {Error} Login failed error with message
 */
export async function login(username, password) {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        password,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on API documentation
      if (response.status === 401) {
        throw new Error(data.message || 'Invalid username or password');
      }
      if (response.status === 400) {
        throw new Error(data.message || 'Please check your username and password');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format matches API documentation
    if (!data.success || !data.user || !data.tokens) {
      throw new Error('Invalid response from server');
    }

    return {
      user: data.user,
      tokens: data.tokens,
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Handle network errors and timeouts
 * @param {Error} error - Network error
 * @returns {string} User-friendly error message
 */
export function handleNetworkError(error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Unable to connect. Please check your internet.';
  }
  if (error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  }
  return error.message || 'Something went wrong. Please try again.';
}
