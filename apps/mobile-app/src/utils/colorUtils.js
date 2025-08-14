/**
 * Color Conversion Utilities
 * Provides functions for converting between different color formats
 * and calculating color properties for UI theming
 */

// Color mapping from ColorPicker presets
const COLOR_NAME_MAP = {
  red: '#FF4444',
  blue: '#4444FF',
  orange: '#FF8800',
  green: '#44BB44',
  purple: '#8844FF',
  yellow: '#FFD700',
  pink: '#FF44BB',
  white: '#FFFFFF',
  black: '#333333',
  clear: '#E0E0E0',
  'neon-green': '#39FF14',
  glow: '#CCFFCC',
  teal: '#008080',
  lime: '#32CD32',
  maroon: '#800000',
  navy: '#000080',
  silver: '#C0C0C0',
  translucent: '#FFFFFF80',
  gray: '#888888',
  grey: '#888888',
};

/**
 * Validates if a string is a valid hex color
 * @param {string} hex - The hex color string to validate
 * @returns {boolean} - True if valid hex color
 */
export const isValidHexColor = (hex) => {
  if (!hex || typeof hex !== 'string') {
    return false;
  }

  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(hex);
};

/**
 * Converts hex color to RGB object
 * @param {string} hex - Hex color string (e.g., '#FF0000' or '#F00')
 * @returns {Object|null} - RGB object {r, g, b} or null if invalid
 */
export const hexToRgb = (hex) => {
  if (!isValidHexColor(hex)) {
    return null;
  }

  // Remove the hash symbol
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Convert to RGB
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  return { r, g, b };
};

/**
 * Converts RGB values to hex string
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} - Hex color string
 */
export const rgbToHex = (r, g, b) => {
  // Clamp values to valid range
  const clampedR = Math.max(0, Math.min(255, Math.round(r)));
  const clampedG = Math.max(0, Math.min(255, Math.round(g)));
  const clampedB = Math.max(0, Math.min(255, Math.round(b)));

  // Convert to hex with padding
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();

  return `#${toHex(clampedR)}${toHex(clampedG)}${toHex(clampedB)}`;
};

/**
 * Converts hex color to HSL object
 * @param {string} hex - Hex color string
 * @returns {Object|null} - HSL object {h, s, l} or null if invalid
 */
export const hexToHsl = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }

  const { r, g, b } = rgb;

  // Normalize RGB values to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);

  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0; // achromatic
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

/**
 * Converts HSL values to hex string
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - Hex color string
 */
export const hslToHex = (h, s, l) => {
  // Normalize values
  const hNorm = ((h % 360) + 360) % 360; // Ensure positive
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hNorm >= 0 && hNorm < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hNorm >= 60 && hNorm < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hNorm >= 120 && hNorm < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hNorm >= 180 && hNorm < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hNorm >= 240 && hNorm < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (hNorm >= 300 && hNorm < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const rValue = Math.round((r + m) * 255);
  const gValue = Math.round((g + m) * 255);
  const bValue = Math.round((b + m) * 255);

  return rgbToHex(rValue, gValue, bValue);
};

/**
 * Calculates the perceived brightness of a color
 * @param {string} hex - Hex color string
 * @returns {number} - Brightness value (0-255)
 */
export const getColorBrightness = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 128; // Default medium brightness
  }

  const { r, g, b } = rgb;

  // Use luminance formula (weighted RGB)
  return r * 0.299 + g * 0.587 + b * 0.114;
};

/**
 * Determines the best contrasting text color for a given background
 * @param {string} hex - Background hex color
 * @returns {string} - '#000000' for dark text or '#FFFFFF' for light text
 */
export const getContrastColor = (hex) => {
  const brightness = getColorBrightness(hex);
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

/**
 * Normalizes any color value to a consistent hex format
 * @param {string} colorValue - Color name, hex, or other format
 * @returns {string} - Normalized hex color
 */
export const normalizeColorValue = (colorValue) => {
  if (!colorValue || typeof colorValue !== 'string') {
    return '#808080'; // Default gray
  }

  // Check if it's already a valid hex color
  if (isValidHexColor(colorValue)) {
    // Convert 3-digit hex to 6-digit
    if (colorValue.length === 4) {
      const shortHex = colorValue.slice(1);
      return `#${shortHex
        .split('')
        .map((char) => char + char)
        .join('')
        .toUpperCase()}`;
    }
    return colorValue.toUpperCase();
  }

  // Check if it's a named color from our mapping
  const lowerColorValue = colorValue.toLowerCase().trim();
  if (COLOR_NAME_MAP[lowerColorValue]) {
    return COLOR_NAME_MAP[lowerColorValue];
  }

  // Fallback to gray for unrecognized colors
  return '#808080';
};
