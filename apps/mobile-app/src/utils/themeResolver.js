/**
 * Theme Resolver Utility
 * Resolves "system" theme preference to actual theme
 */

/**
 * Resolves theme preference to actual theme name
 * @param {string} themePreference - The user's theme preference
 *   ('light', 'dark', 'blackout', 'system')
 * @param {string} systemTheme - The system's current theme ('light' or 'dark')
 * @returns {string} The resolved theme name
 */
export const resolveTheme = (themePreference, systemTheme) => {
  if (themePreference === 'system') {
    return systemTheme || 'light';
  }
  return themePreference;
};
