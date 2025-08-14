/**
 * AddDiscToBagScreen Flight Number Validation Tests
 * Tests flight number validation logic
 */

describe('AddDiscToBagScreen Flight Number Validation', () => {
  // Mock the validation function from AddDiscToBagScreen
  const validateFlightNumber = (value, field) => {
    if (!value) return true; // Empty is allowed (uses disc master)

    const num = parseInt(value, 10);
    if (Number.isNaN(num) || value.toString().includes('.')) return false;

    switch (field) {
      case 'speed': return num >= 1 && num <= 15;
      case 'glide': return num >= 1 && num <= 7;
      case 'turn': return num >= -5 && num <= 2;
      case 'fade': return num >= 0 && num <= 5;
      default: return true;
    }
  };

  describe('Speed validation', () => {
    it('should accept valid speed values (1-15)', () => {
      expect(validateFlightNumber('1', 'speed')).toBe(true);
      expect(validateFlightNumber('5', 'speed')).toBe(true);
      expect(validateFlightNumber('12', 'speed')).toBe(true);
      expect(validateFlightNumber('15', 'speed')).toBe(true);
    });

    it('should reject invalid speed values', () => {
      expect(validateFlightNumber('0', 'speed')).toBe(false);
      expect(validateFlightNumber('16', 'speed')).toBe(false);
      expect(validateFlightNumber('-1', 'speed')).toBe(false);
    });

    it('should accept empty speed values', () => {
      expect(validateFlightNumber('', 'speed')).toBe(true);
      expect(validateFlightNumber(null, 'speed')).toBe(true);
      expect(validateFlightNumber(undefined, 'speed')).toBe(true);
    });

    it('should reject non-numeric speed values', () => {
      expect(validateFlightNumber('abc', 'speed')).toBe(false);
      expect(validateFlightNumber('1.5', 'speed')).toBe(false);
    });
  });

  describe('Glide validation', () => {
    it('should accept valid glide values (1-7)', () => {
      expect(validateFlightNumber('1', 'glide')).toBe(true);
      expect(validateFlightNumber('4', 'glide')).toBe(true);
      expect(validateFlightNumber('7', 'glide')).toBe(true);
    });

    it('should reject invalid glide values', () => {
      expect(validateFlightNumber('0', 'glide')).toBe(false);
      expect(validateFlightNumber('8', 'glide')).toBe(false);
      expect(validateFlightNumber('-1', 'glide')).toBe(false);
    });

    it('should handle Baobab disc case (glide: 0)', () => {
      // The frontend should correct glide: 0 to glide: 1
      expect(validateFlightNumber('0', 'glide')).toBe(false);
      expect(validateFlightNumber('1', 'glide')).toBe(true);
    });
  });

  describe('Turn validation', () => {
    it('should accept valid turn values (-5 to 2)', () => {
      expect(validateFlightNumber('-5', 'turn')).toBe(true);
      expect(validateFlightNumber('-1', 'turn')).toBe(true);
      expect(validateFlightNumber('0', 'turn')).toBe(true);
      expect(validateFlightNumber('2', 'turn')).toBe(true);
    });

    it('should reject invalid turn values', () => {
      expect(validateFlightNumber('-6', 'turn')).toBe(false);
      expect(validateFlightNumber('3', 'turn')).toBe(false);
      expect(validateFlightNumber('5', 'turn')).toBe(false);
    });
  });

  describe('Fade validation', () => {
    it('should accept valid fade values (0-5)', () => {
      expect(validateFlightNumber('0', 'fade')).toBe(true);
      expect(validateFlightNumber('2', 'fade')).toBe(true);
      expect(validateFlightNumber('5', 'fade')).toBe(true);
    });

    it('should reject invalid fade values', () => {
      expect(validateFlightNumber('-1', 'fade')).toBe(false);
      expect(validateFlightNumber('6', 'fade')).toBe(false);
      expect(validateFlightNumber('10', 'fade')).toBe(false);
    });
  });

  describe('Flight number correction logic', () => {
    // Test the logic that corrects invalid flight numbers
    const correctFlightNumber = (value, field) => {
      if (!value) return value; // Keep empty values

      const num = parseInt(value, 10);
      if (Number.isNaN(num)) return value; // Keep non-numeric as-is for validation to catch

      switch (field) {
        case 'speed':
          if (num < 1) return 1;
          if (num > 15) return 15;
          return num;
        case 'glide':
          if (num < 1) return 1;
          if (num > 7) return 7;
          return num;
        case 'turn':
          if (num < -5) return -5;
          if (num > 2) return 2;
          return num;
        case 'fade':
          if (num < 0) return 0;
          if (num > 5) return 5;
          return num;
        default: return num;
      }
    };

    it('should correct invalid flight numbers to valid ranges', () => {
      // Speed corrections
      expect(correctFlightNumber('0', 'speed')).toBe(1);
      expect(correctFlightNumber('16', 'speed')).toBe(15);

      // Glide corrections (fixes Baobab case)
      expect(correctFlightNumber('0', 'glide')).toBe(1);
      expect(correctFlightNumber('8', 'glide')).toBe(7);

      // Turn corrections
      expect(correctFlightNumber('-6', 'turn')).toBe(-5);
      expect(correctFlightNumber('3', 'turn')).toBe(2);

      // Fade corrections
      expect(correctFlightNumber('-1', 'fade')).toBe(0);
      expect(correctFlightNumber('6', 'fade')).toBe(5);
    });

    it('should leave valid flight numbers unchanged', () => {
      expect(correctFlightNumber('5', 'speed')).toBe(5);
      expect(correctFlightNumber('4', 'glide')).toBe(4);
      expect(correctFlightNumber('-1', 'turn')).toBe(-1);
      expect(correctFlightNumber('3', 'fade')).toBe(3);
    });
  });
});
