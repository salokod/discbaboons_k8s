/**
 * Color Conversion Utilities Tests
 */

import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  getColorBrightness,
  getContrastColor,
  isValidHexColor,
  normalizeColorValue,
} from '../../src/utils/colorUtils';

describe('Color Conversion Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert valid 6-digit hex to RGB', () => {
      const result = hexToRgb('#FF0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert valid 3-digit hex to RGB', () => {
      const result = hexToRgb('#F00');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle lowercase hex colors', () => {
      const result = hexToRgb('#ff0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should return null for invalid hex colors', () => {
      expect(hexToRgb('not-a-color')).toBeNull();
      expect(hexToRgb('#ZZZ')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB values to hex', () => {
      const result = rgbToHex(255, 0, 0);
      expect(result).toBe('#FF0000');
    });

    it('should handle single digit values with padding', () => {
      const result = rgbToHex(15, 0, 255);
      expect(result).toBe('#0F00FF');
    });

    it('should clamp values to valid RGB range', () => {
      const result = rgbToHex(300, -10, 500);
      expect(result).toBe('#FF00FF');
    });
  });

  describe('hexToHsl', () => {
    it('should convert hex to HSL', () => {
      const result = hexToHsl('#FF0000');
      expect(result).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('should handle white color conversion', () => {
      const result = hexToHsl('#FFFFFF');
      expect(result).toEqual({ h: 0, s: 0, l: 100 });
    });

    it('should handle black color conversion', () => {
      const result = hexToHsl('#000000');
      expect(result).toEqual({ h: 0, s: 0, l: 0 });
    });
  });

  describe('hslToHex', () => {
    it('should convert HSL to hex', () => {
      const result = hslToHex(0, 100, 50);
      expect(result).toBe('#FF0000');
    });

    it('should handle white color conversion', () => {
      const result = hslToHex(0, 0, 100);
      expect(result).toBe('#FFFFFF');
    });

    it('should handle black color conversion', () => {
      const result = hslToHex(0, 0, 0);
      expect(result).toBe('#000000');
    });
  });

  describe('getColorBrightness', () => {
    it('should calculate brightness for white', () => {
      const brightness = getColorBrightness('#FFFFFF');
      expect(brightness).toBe(255);
    });

    it('should calculate brightness for black', () => {
      const brightness = getColorBrightness('#000000');
      expect(brightness).toBe(0);
    });

    it('should calculate brightness for red', () => {
      const brightness = getColorBrightness('#FF0000');
      expect(brightness).toBeCloseTo(76.245, 2);
    });
  });

  describe('getContrastColor', () => {
    it('should return black text for light backgrounds', () => {
      const contrastColor = getContrastColor('#FFFFFF');
      expect(contrastColor).toBe('#000000');
    });

    it('should return white text for dark backgrounds', () => {
      const contrastColor = getContrastColor('#000000');
      expect(contrastColor).toBe('#FFFFFF');
    });

    it('should return appropriate contrast for medium colors', () => {
      const contrastColor = getContrastColor('#808080');
      expect(['#000000', '#FFFFFF']).toContain(contrastColor);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#F00')).toBe(true);
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#AbC123')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('FF0000')).toBe(false); // Missing #
      expect(isValidHexColor('#GG0000')).toBe(false); // Invalid characters
      expect(isValidHexColor('#FF00')).toBe(false); // Wrong length
      expect(isValidHexColor('')).toBe(false); // Empty string
      expect(isValidHexColor(null)).toBe(false); // Null
    });
  });

  describe('normalizeColorValue', () => {
    it('should normalize named colors to hex', () => {
      const result = normalizeColorValue('red');
      expect(result).toBe('#FF4444'); // Based on ColorPicker preset
    });

    it('should pass through valid hex colors unchanged', () => {
      const result = normalizeColorValue('#FF0000');
      expect(result).toBe('#FF0000');
    });

    it('should normalize 3-digit hex to 6-digit', () => {
      const result = normalizeColorValue('#F00');
      expect(result).toBe('#FF0000');
    });

    it('should return fallback for invalid colors', () => {
      const result = normalizeColorValue('invalid-color');
      expect(result).toBe('#808080'); // Default gray fallback
    });

    it('should handle empty or null values', () => {
      expect(normalizeColorValue('')).toBe('#808080');
      expect(normalizeColorValue(null)).toBe('#808080');
      expect(normalizeColorValue(undefined)).toBe('#808080');
    });
  });
});
