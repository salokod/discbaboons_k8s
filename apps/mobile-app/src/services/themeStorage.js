/**
 * Theme Storage Service
 * Provides storage for theme preferences using React Native AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage key for theme preference
const THEME_STORAGE_KEY = 'discbaboons_theme_preference';

/**
 * Store theme preference in AsyncStorage
 * @param {string} theme - Theme name to store
 * @returns {Promise<boolean>} True if theme was stored successfully
 * @throws {Error} If theme is invalid or storage fails
 */
export async function storeTheme(theme) {
  // Validate input
  if (theme === undefined || theme === null) {
    throw new Error('Theme is required');
  }

  if (typeof theme !== 'string') {
    throw new Error('Theme must be a string');
  }

  if (theme.trim() === '') {
    throw new Error('Theme cannot be empty');
  }

  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch (error) {
    throw new Error('Failed to store theme preference');
  }
}

/**
 * Retrieve theme preference from AsyncStorage
 * @returns {Promise<string|null>} Theme name or null if not found
 */
export async function getStoredTheme() {
  try {
    const theme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return theme;
  } catch (error) {
    // Return null on error (graceful degradation)
    return null;
  }
}

/**
 * Clear theme preference from AsyncStorage
 * @returns {Promise<boolean>} True if theme was cleared successfully
 */
export async function clearTheme() {
  try {
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    return true;
  } catch (error) {
    // Return false on error (graceful degradation)
    return false;
  }
}

/**
 * Store theme preference with enhanced error handling and fallback
 * Ensures theme is available in memory even if storage fails
 * @param {string} theme - Theme name to store
 * @returns {Promise<Object>} Result object with success status, theme, and message
 */
export async function storeThemeWithFallback(theme) {
  // Validate input first
  if (theme === undefined || theme === null) {
    return {
      success: false,
      theme: null,
      message: 'Invalid theme provided',
      error: 'Theme is required',
    };
  }

  if (typeof theme !== 'string') {
    return {
      success: false,
      theme: null,
      message: 'Invalid theme provided',
      error: 'Theme must be a string',
    };
  }

  if (theme.trim() === '') {
    return {
      success: false,
      theme: null,
      message: 'Invalid theme provided',
      error: 'Theme cannot be empty',
    };
  }

  // Try to store in AsyncStorage
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    return {
      success: true,
      theme,
      message: 'Theme stored successfully',
    };
  } catch (error) {
    // Storage failed, but theme is still available in memory
    return {
      success: false,
      theme, // Return theme so it can be used in memory
      message: 'Theme changed in memory only - storage failed',
      error: error.message,
    };
  }
}

/**
 * Retrieve theme preference with graceful fallback handling
 * @param {string} fallbackTheme - Theme to use if storage fails or no theme is stored
 * @returns {Promise<Object>} Result object with success status, theme, source, and message
 */
export async function getThemeWithGracefulFallback(fallbackTheme) {
  // Validate fallback theme
  const defaultTheme = 'system';
  let validFallback = fallbackTheme;
  let fallbackError = null;

  if (!fallbackTheme || typeof fallbackTheme !== 'string' || fallbackTheme.trim() === '') {
    validFallback = defaultTheme;
    fallbackError = 'Fallback theme cannot be empty';
  }

  // Try to retrieve from AsyncStorage
  try {
    const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme !== null) {
      return {
        success: true,
        theme: storedTheme,
        source: 'storage',
        message: 'Theme retrieved from storage',
      };
    }

    // No stored theme, use fallback
    if (fallbackError) {
      return {
        success: false,
        theme: validFallback,
        source: 'default',
        message: 'Invalid fallback provided, using system default',
        error: fallbackError,
      };
    }

    return {
      success: true,
      theme: validFallback,
      source: 'fallback',
      message: 'No stored theme found, using fallback',
    };
  } catch (error) {
    // Storage access failed, use fallback
    return {
      success: false,
      theme: validFallback,
      source: 'fallback',
      message: 'Using fallback theme due to storage error',
      error: error.message,
    };
  }
}
