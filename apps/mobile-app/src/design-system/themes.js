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

export const themes = {
  [THEME_NAMES.LIGHT]: {
    ...brandColors,
    ...semanticColors,
    background: '#FAFBFC', // Very soft, warm off-white background
    surface: '#FFFFFF', // Pure white for cards/inputs
    text: '#212121',
    textLight: '#757575',
    textOnPrimary: '#FFFFFF', // White text on primary buttons
    border: '#E0E0E0',
    // Standard colors
    white: '#FFFFFF',
    black: '#000000',
  },
  [THEME_NAMES.DARK]: {
    ...brandColors,
    ...semanticColors,
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textLight: '#B0B0B0',
    textOnPrimary: '#FFFFFF', // White text on primary buttons
    border: '#424242',
    // Standard colors
    white: '#FFFFFF',
    black: '#000000',
  },
  [THEME_NAMES.BLACKOUT]: {
    ...brandColors,
    background: '#000000',
    surface: '#000000',
    text: '#FFFFFF',
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
