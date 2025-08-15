/**
 * System Theme Detection Service
 * Provides utilities for detecting and responding to system theme changes
 */

import { Appearance } from 'react-native';
import { THEME_NAMES } from '../design-system/themes';

/**
 * Get the current system color scheme
 * @returns {string} - 'light' or 'dark'
 */
export function getSystemColorScheme() {
  try {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? THEME_NAMES.DARK : THEME_NAMES.LIGHT;
  } catch (error) {
    // Fallback to light theme if detection fails
    return THEME_NAMES.LIGHT;
  }
}

/**
 * Add a listener for system color scheme changes
 * @param {Function} listener - Callback function to handle scheme changes
 * @returns {Function} - Cleanup function to remove the listener
 */
export function addSystemThemeChangeListener(listener) {
  try {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const themeToUse = colorScheme === 'dark' ? THEME_NAMES.DARK : THEME_NAMES.LIGHT;
      listener(themeToUse);
    });

    // Return cleanup function
    return () => {
      subscription?.remove();
    };
  } catch (error) {
    // Return a no-op cleanup function if listener setup fails
    return () => {};
  }
}

/**
 * Check if system theme detection is supported
 * @returns {boolean} - true if system theme detection is available
 */
export function isSystemThemeSupported() {
  try {
    return typeof Appearance.getColorScheme === 'function';
  } catch (error) {
    return false;
  }
}
