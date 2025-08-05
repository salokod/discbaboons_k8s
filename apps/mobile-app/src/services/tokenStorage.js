/**
 * Token Storage Service
 * Provides secure storage for JWT tokens using react-native-keychain
 */

import * as Keychain from 'react-native-keychain';

// Keychain service identifier for our tokens
const KEYCHAIN_SERVICE = 'discbaboons_auth_tokens';

/**
 * Store JWT tokens securely in keychain
 * @param {Object} tokens - Object containing accessToken and refreshToken
 * @param {string} tokens.accessToken - JWT access token
 * @param {string} tokens.refreshToken - JWT refresh token
 * @returns {Promise<boolean>} True if tokens were stored successfully
 * @throws {Error} If tokens are invalid or storage fails
 */
export async function storeTokens(tokens) {
  // Validate input
  if (!tokens || typeof tokens !== 'object') {
    throw new Error('Tokens object is required');
  }

  if (!tokens.accessToken) {
    throw new Error('Access token is required');
  }

  if (!tokens.refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    const success = await Keychain.setInternetCredentials(
      KEYCHAIN_SERVICE,
      'user', // Username (not used, but required by keychain API)
      JSON.stringify(tokens),
      {
        accessControl: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );

    return success;
  } catch (error) {
    throw new Error('Failed to store tokens securely');
  }
}

/**
 * Retrieve JWT tokens from keychain
 * @returns {Promise<Object|null>} Tokens object or null if not found
 */
export async function getTokens() {
  try {
    const credentials = await Keychain.getInternetCredentials(KEYCHAIN_SERVICE);

    if (!credentials) {
      return null;
    }

    // Parse the stored tokens JSON
    try {
      const tokens = JSON.parse(credentials.password);
      return tokens;
    } catch (parseError) {
      // Invalid JSON, return null
      return null;
    }
  } catch (error) {
    // Keychain error, return null (graceful degradation)
    return null;
  }
}

/**
 * Clear JWT tokens from keychain
 * @returns {Promise<boolean>} True if tokens were cleared successfully
 */
export async function clearTokens() {
  try {
    const success = await Keychain.resetInternetCredentials(KEYCHAIN_SERVICE);
    return success;
  } catch (error) {
    // Return false on error (graceful degradation)
    return false;
  }
}

/**
 * Check if tokens are stored in keychain
 * @returns {Promise<boolean>} True if tokens exist in keychain
 */
export async function hasStoredTokens() {
  try {
    const hasCredentials = await Keychain.hasInternetCredentials(KEYCHAIN_SERVICE);
    return hasCredentials;
  } catch (error) {
    // Return false on error (graceful degradation)
    return false;
  }
}
