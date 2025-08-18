/**
 * Accessibility Utils Tests
 * Test-driven development for accessibility utility functions
 */

import {
  formatForScreenReader,
  calculateColorContrast,
  getContrastRatio,
  isValidTouchTarget,
  createAriaLabel,
  optimizeScreenReaderText,
  formatListForScreenReader,
  formatNumberForScreenReader,
} from '../../src/utils/accessibilityUtils';

describe('Accessibility Utils', () => {
  describe('should export utility functions', () => {
    it('should export formatForScreenReader function', () => {
      expect(typeof formatForScreenReader).toBe('function');
    });

    it('should export calculateColorContrast function', () => {
      expect(typeof calculateColorContrast).toBe('function');
    });

    it('should export getContrastRatio function', () => {
      expect(typeof getContrastRatio).toBe('function');
    });

    it('should export isValidTouchTarget function', () => {
      expect(typeof isValidTouchTarget).toBe('function');
    });

    it('should export createAriaLabel function', () => {
      expect(typeof createAriaLabel).toBe('function');
    });

    it('should export optimizeScreenReaderText function', () => {
      expect(typeof optimizeScreenReaderText).toBe('function');
    });

    it('should export formatListForScreenReader function', () => {
      expect(typeof formatListForScreenReader).toBe('function');
    });

    it('should export formatNumberForScreenReader function', () => {
      expect(typeof formatNumberForScreenReader).toBe('function');
    });
  });

  describe('formatForScreenReader', () => {
    it('should format basic text with proper pauses', () => {
      const input = 'Disc Brand Model';
      const result = formatForScreenReader(input);
      expect(result).toBe('Disc, Brand, Model');
    });

    it('should handle special characters and numbers', () => {
      const input = 'Speed: 7 | Glide: 5';
      const result = formatForScreenReader(input);
      expect(result).toBe('Speed, 7, Glide, 5');
    });

    it('should remove excessive punctuation', () => {
      const input = 'Brand!!! Model???';
      const result = formatForScreenReader(input);
      expect(result).toBe('Brand, Model');
    });

    it('should handle empty or null input', () => {
      expect(formatForScreenReader('')).toBe('');
      expect(formatForScreenReader(null)).toBe('');
      expect(formatForScreenReader(undefined)).toBe('');
    });

    it('should normalize whitespace', () => {
      const input = 'Brand    Model\n\nFlight   Numbers';
      const result = formatForScreenReader(input);
      expect(result).toBe('Brand, Model, Flight, Numbers');
    });
  });

  describe('calculateColorContrast', () => {
    it('should calculate contrast ratio for black and white', () => {
      const ratio = calculateColorContrast('#000000', '#ffffff');
      expect(ratio).toBe(21); // Perfect contrast
    });

    it('should calculate contrast ratio for same colors', () => {
      const ratio = calculateColorContrast('#ff0000', '#ff0000');
      expect(ratio).toBe(1); // No contrast
    });

    it('should handle hex colors with and without #', () => {
      const ratio1 = calculateColorContrast('#000000', '#ffffff');
      const ratio2 = calculateColorContrast('000000', 'ffffff');
      expect(ratio1).toBe(ratio2);
    });

    it('should handle 3-digit hex colors', () => {
      const ratio = calculateColorContrast('#000', '#fff');
      expect(ratio).toBe(21);
    });

    it('should return valid ratio for typical colors', () => {
      const ratio = calculateColorContrast('#0066cc', '#ffffff');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThanOrEqual(21);
    });
  });

  describe('getContrastRatio', () => {
    it('should determine if contrast meets AA standards', () => {
      const highContrast = getContrastRatio('#000000', '#ffffff');
      expect(highContrast.ratio).toBe(21);
      expect(highContrast.meetsAA).toBe(true);
      expect(highContrast.meetsAAA).toBe(true);
    });

    it('should determine if contrast fails standards', () => {
      const lowContrast = getContrastRatio('#cccccc', '#ffffff');
      expect(lowContrast.ratio).toBeLessThan(4.5);
      expect(lowContrast.meetsAA).toBe(false);
      expect(lowContrast.meetsAAA).toBe(false);
    });

    it('should include grade in response', () => {
      const result = getContrastRatio('#000000', '#ffffff');
      expect(result.grade).toBeDefined();
      expect(typeof result.grade).toBe('string');
    });
  });

  describe('isValidTouchTarget', () => {
    it('should validate minimum touch target size (44dp)', () => {
      expect(isValidTouchTarget(44, 44)).toBe(true);
      expect(isValidTouchTarget(50, 50)).toBe(true);
      expect(isValidTouchTarget(40, 40)).toBe(false);
    });

    it('should handle rectangular targets', () => {
      expect(isValidTouchTarget(60, 30)).toBe(false); // Too narrow
      expect(isValidTouchTarget(30, 60)).toBe(false); // Too short
      expect(isValidTouchTarget(50, 44)).toBe(true); // Minimum width/height
    });

    it('should provide feedback in result object', () => {
      const result = isValidTouchTarget(40, 40, true);
      expect(result.isValid).toBe(false);
      expect(result.suggestedWidth).toBeGreaterThanOrEqual(44);
      expect(result.suggestedHeight).toBeGreaterThanOrEqual(44);
    });

    it('should return boolean when detailed is false', () => {
      const result = isValidTouchTarget(50, 50, false);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('createAriaLabel', () => {
    it('should create descriptive aria labels for disc components', () => {
      const discData = {
        brand: 'Innova',
        model: 'Champion Roc',
        speed: 5,
        glide: 4,
        turn: 0,
        fade: 3,
      };
      const label = createAriaLabel(discData, 'disc');
      expect(label).toContain('Innova');
      expect(label).toContain('Champion Roc');
      expect(label).toContain('speed 5');
    });

    it('should create labels for button actions', () => {
      const actionData = {
        action: 'move',
        target: 'My Bag',
        itemName: 'Champion Roc',
      };
      const label = createAriaLabel(actionData, 'button');
      expect(label).toContain('move');
      expect(label).toContain('Champion Roc');
      expect(label).toContain('My Bag');
    });

    it('should handle missing data gracefully', () => {
      const label = createAriaLabel({}, 'disc');
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should support custom templates', () => {
      const data = { count: 5 };
      // eslint-disable-next-line no-template-curly-in-string
      const template = 'Selected ${count} items';
      const label = createAriaLabel(data, 'custom', template);
      expect(label).toBe('Selected 5 items');
    });
  });

  describe('optimizeScreenReaderText', () => {
    it('should expand abbreviations', () => {
      const text = 'Dr. Smith added 3 discs';
      const result = optimizeScreenReaderText(text);
      expect(result).toContain('Doctor');
    });

    it('should spell out single letters', () => {
      const text = 'Flight number A7';
      const result = optimizeScreenReaderText(text);
      expect(result).toContain('A seven');
    });

    it('should handle disc golf terminology', () => {
      const text = 'PDGA approved disc';
      const result = optimizeScreenReaderText(text);
      expect(result).toContain('Professional Disc Golf Association');
    });

    it('should maintain readability for complex text', () => {
      const text = 'This disc has a speed of 12 & glide of 5';
      const result = optimizeScreenReaderText(text);
      expect(result).not.toContain('&');
      expect(result).toContain('and');
    });
  });

  describe('formatListForScreenReader', () => {
    it('should format simple lists with proper separators', () => {
      const items = ['Innova', 'Discraft', 'Dynamic Discs'];
      const result = formatListForScreenReader(items);
      expect(result).toBe('Innova, Discraft, and Dynamic Discs');
    });

    it('should handle two items', () => {
      const items = ['Speed', 'Glide'];
      const result = formatListForScreenReader(items);
      expect(result).toBe('Speed and Glide');
    });

    it('should handle single item', () => {
      const items = ['Innova'];
      const result = formatListForScreenReader(items);
      expect(result).toBe('Innova');
    });

    it('should handle empty list', () => {
      const result = formatListForScreenReader([]);
      expect(result).toBe('');
    });

    it('should support custom separators', () => {
      const items = ['Red', 'Blue', 'Green'];
      const result = formatListForScreenReader(items, 'or');
      expect(result).toBe('Red, Blue, or Green');
    });
  });

  describe('formatNumberForScreenReader', () => {
    it('should spell out single digits', () => {
      expect(formatNumberForScreenReader(5)).toBe('five');
      expect(formatNumberForScreenReader(0)).toBe('zero');
    });

    it('should handle flight numbers appropriately', () => {
      expect(formatNumberForScreenReader(12)).toBe('twelve');
      expect(formatNumberForScreenReader(-1)).toBe('negative one');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumberForScreenReader(2.5)).toBe('two point five');
    });

    it('should handle large numbers', () => {
      expect(formatNumberForScreenReader(100)).toBe('one hundred');
      expect(formatNumberForScreenReader(1000)).toBe('one thousand');
    });

    it('should provide context for disc measurements', () => {
      const result = formatNumberForScreenReader(5, 'speed');
      expect(result).toContain('five');
      expect(result).toContain('speed');
    });
  });
});
