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
