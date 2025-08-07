/**
 * Authentication Service
 * Handles API calls for login, registration, and token management
 */

import { API_BASE_URL } from '../config/environment';

/**
 * Validate username format before sending to API
 * @param {string} username - Username to validate
 * @throws {Error} Validation error if username is invalid
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required');
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length === 0) {
    throw new Error('Username cannot be empty');
  }

  if (trimmedUsername.length < 4) {
    throw new Error('Username must be at least 4 characters');
  }

  if (trimmedUsername.length > 20) {
    throw new Error('Username must be no more than 20 characters');
  }

  // Check for valid characters (alphanumeric only)
  if (!/^[a-zA-Z0-9]+$/.test(trimmedUsername)) {
    throw new Error('Username can only contain letters and numbers');
  }
}

/**
 * Validate password format before sending to API
 * @param {string} password - Password to validate
 * @throws {Error} Validation error if password is invalid
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (password.length > 32) {
    throw new Error('Password must be no more than 32 characters');
  }
}

/**
 * Login user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<{user: Object, tokens: Object}>} User data and tokens
 * @throws {Error} Login failed error with message
 */
export async function login(username, password) {
  // Validate inputs before making API call
  validateUsername(username);
  validatePassword(password);
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
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Backend returns "Invalid username or password" for security
        throw new Error(data.message || 'Invalid username or password');
      }
      if (response.status === 400) {
        // Backend ValidationError messages (Username/Password required)
        throw new Error(data.message || 'Please check your username and password');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
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
 * Register user with username, email and password
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, user: Object}>} Registration result
 * @throws {Error} Registration failed error with message
 */
export async function register(username, email, password) {
  // Validate inputs before making API call
  validateUsername(username);
  validatePassword(password);

  if (!email || typeof email !== 'string') {
    throw new Error('Email is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 409) {
        // Backend returns conflict for existing username/email
        throw new Error(data.message || 'Username or email already exists');
      }
      if (response.status === 400) {
        // Backend ValidationError messages
        throw new Error(data.message || 'Please check your registration details');
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

    return {
      success: data.success,
      user: data.user,
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Handle network errors and timeouts with enhanced messaging
 * @param {Error} error - Network error
 * @returns {string} User-friendly error message
 */
export function handleNetworkError(error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Unable to connect to server. Please check your internet connection and try again.';
  }
  if (error.name === 'AbortError') {
    return 'Request timed out after 30 seconds. Please check your connection and try again.';
  }
  if (error.message && error.message.includes('Network request failed')) {
    return 'Network error occurred. Please check your internet connection.';
  }
  return error.message || 'Something went wrong. Please try again later.';
}

/**
 * Send password reset request to the backend
 * @param {string} usernameOrEmail - Username or email for password reset
 * @returns {Promise<object>} Success response from API
 * @throws {Error} Network or validation errors
 */
export async function forgotPassword(usernameOrEmail) {
  // Basic validation
  if (!usernameOrEmail || typeof usernameOrEmail !== 'string' || !usernameOrEmail.trim()) {
    throw new Error('Username or email is required');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  // Detect if input is email or username
  const isEmail = usernameOrEmail.trim().includes('@');
  const requestBody = isEmail
    ? { email: usernameOrEmail.trim() }
    : { username: usernameOrEmail.trim() };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(data.message || 'Username or email is required');
      }
      if (response.status === 404) {
        throw new Error(data.message || 'User not found');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to process request. Please try again.');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Resend password reset verification code
 */
export async function resendPasswordResetCode(usernameOrEmail) {
  if (!usernameOrEmail || typeof usernameOrEmail !== 'string' || !usernameOrEmail.trim()) {
    throw new Error('Username or email is required');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  // Detect if input is email or username
  const isEmail = usernameOrEmail.trim().includes('@');
  const requestBody = isEmail
    ? { email: usernameOrEmail.trim() }
    : { username: usernameOrEmail.trim() };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid request');
      }
      if (response.status === 429) {
        throw new Error(data.message || 'Too many requests. Please wait before resending.');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to resend code. Please try again.');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Reset password with verification code
 */
export async function resetPassword(verificationCode, newPassword, usernameOrEmail) {
  if (!verificationCode || typeof verificationCode !== 'string' || verificationCode.trim().length !== 6) {
    throw new Error('Valid 6-digit verification code is required');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  if (!usernameOrEmail || typeof usernameOrEmail !== 'string' || !usernameOrEmail.trim()) {
    throw new Error('Username or email is required');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000);

  // Detect if input is email or username and prepare request body
  const isEmail = usernameOrEmail.trim().includes('@');
  const requestBody = {
    resetCode: verificationCode.trim(),
    newPassword,
    ...(isEmail
      ? { email: usernameOrEmail.trim() }
      : { username: usernameOrEmail.trim() }),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(data.message || 'Invalid verification code or password');
      }
      if (response.status === 401) {
        throw new Error(data.message || 'Invalid or expired verification code');
      }
      if (response.status === 429) {
        throw new Error(data.message || 'Too many attempts. Please try again later.');
      }
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again.');
      }
      throw new Error(data.message || 'Unable to reset password. Please try again.');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
