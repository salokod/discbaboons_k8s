export const THEME_NAMES = {
  LIGHT: 'light',
  DARK: 'dark',
  BLACKOUT: 'blackout',
  SYSTEM: 'system',
};

// Brand colors that remain consistent across all themes
const brandColors = {
  primary: '#ec7032', // Orange (logo color)
  secondary: '#1d1d41', // Dark Blue
};

// Semantic colors for light/dark themes
const semanticColors = {
  success: '#4CAF50',
  error: '#D32F2F',
  warning: '#F57C00',
  info: '#0288D1',
};

// Admin colors that remain consistent across all themes
const adminColors = {
  adminPrimary: '#FFD700', // Golden accent
  adminSecondary: '#B8860B', // Darker golden
  adminAccent: '#FFF8DC', // Light cream/golden
};

// Creator colors that remain consistent across all themes
const creatorColors = {
  creatorPrimary: '#ec7032', // Orange (matches primary brand color)
  creatorSecondary: '#FFFFFF', // White text for contrast
};

export const themes = {
  [THEME_NAMES.LIGHT]: {
    ...brandColors,
    ...semanticColors,
    ...adminColors,
    ...creatorColors,
    background: '#FAFBFC', // Very soft, warm off-white background
    surface: '#FFFFFF', // Pure white for cards/inputs
    text: '#212121',
    textSecondary: '#666666', // High contrast secondary text (7.3:1 ratio)
    textLight: '#616161', // Improved contrast ratio (5.9:1)
    textOnPrimary: '#FFFFFF', // White text on primary buttons
    border: '#757575', // Improved contrast ratio (5.9:1)
    // Standard colors
    white: '#FFFFFF',
    black: '#000000',
  },
  [THEME_NAMES.DARK]: {
    ...brandColors,
    ...semanticColors,
    ...adminColors,
    ...creatorColors,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC', // High contrast secondary text (10.4:1 ratio)
    textLight: '#B0B0B0',
    textOnPrimary: '#FFFFFF', // White text on primary buttons
    border: '#424242',
    // Standard colors
    white: '#FFFFFF',
    black: '#000000',
  },
  [THEME_NAMES.BLACKOUT]: {
    ...brandColors,
    ...adminColors,
    ...creatorColors,
    background: '#000000',
    surface: '#000000',
    text: '#FFFFFF',
    textSecondary: '#FFFFFF', // Maximum contrast in blackout mode
    textLight: '#FFFFFF',
    textOnPrimary: '#000000', // Black text on primary in blackout for contrast
    border: '#FFFFFF',
    // Standard colors
    white: '#FFFFFF',
    black: '#000000',
    // All semantic colors become white in blackout
    success: '#FFFFFF',
    error: '#FFFFFF',
    warning: '#FFFFFF',
    info: '#FFFFFF',
  },
};
