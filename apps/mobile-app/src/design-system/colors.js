/**
 * Design System - Colors
 *
 * DEPRECATED: This file exports light theme colors for backward compatibility.
 * For theme-aware colors, use the useThemeColors hook or themes directly.
 *
 * @deprecated Use themes.js and useThemeColors hook instead
 */

import { themes, THEME_NAMES } from './themes';

// Export light theme colors as default for backward compatibility
export const colors = themes[THEME_NAMES.LIGHT];
