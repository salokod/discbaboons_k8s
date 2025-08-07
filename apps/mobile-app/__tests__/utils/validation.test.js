/**
 * Validation Utils Tests
 * Tests shared validation utilities
 */

const {
  isValidEmail,
  isEmailAddress,
  isValidHexString,
  isValidUsername,
  isValidPassword,
} = require('../../src/utils/validation');

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+label@example.org',
        'john.doe123@company.com',
        'test_user@domain.net',
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user.example.com',
        'user@@domain.com',
        'user@domain@com',
        '',
        null,
        undefined,
        123,
        'user @example.com', // space
        'user@domain', // no TLD
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases that caused security vulnerability', () => {
      // These were incorrectly identified as emails by includes('@') logic
      const malformedInputs = [
        'user@',
        '@domain',
        'user@@domain',
        '@',
        '@@',
        'user@domain@',
      ];

      malformedInputs.forEach((input) => {
        expect(isValidEmail(input)).toBe(false);
      });
    });

    it('should trim whitespace before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
      expect(isValidEmail('  user@  ')).toBe(false);
      expect(isValidEmail('  @domain.com  ')).toBe(false);
    });
  });

  describe('isEmailAddress', () => {
    it('should be an alias for isValidEmail', () => {
      expect(isEmailAddress('user@example.com')).toBe(true);
      expect(isEmailAddress('invalid@')).toBe(false);
    });
  });

  describe('isValidHexString', () => {
    it('should accept valid hexadecimal strings', () => {
      const validHexStrings = [
        'ABC123',
        'DEF456',
        '123ABC',
        '000FFF',
        'aabbcc',
        'AABBCC',
        '123456',
        'ABCDEF',
      ];

      validHexStrings.forEach((hex) => {
        expect(isValidHexString(hex)).toBe(true);
      });
    });

    it('should reject invalid hexadecimal strings', () => {
      const invalidHexStrings = [
        'GHIJK1', // Contains non-hex characters
        'ABC12G', // Contains non-hex character G
        'ABC1@3', // Contains special character
        'ABC12', // Too short
        'ABC1234', // Too long
        '',
        null,
        undefined,
        123,
        'XYZ123',
      ];

      invalidHexStrings.forEach((hex) => {
        expect(isValidHexString(hex)).toBe(false);
      });
    });

    it('should support custom length validation', () => {
      expect(isValidHexString('AB', 2)).toBe(true);
      expect(isValidHexString('ABCD', 4)).toBe(true);
      expect(isValidHexString('ABCDEF12', 8)).toBe(true);

      expect(isValidHexString('ABC', 2)).toBe(false); // Too long
      expect(isValidHexString('AB', 4)).toBe(false); // Too short
    });
  });

  describe('isValidUsername', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'john',
        'user123',
        'TestUser',
        'user1234567890123456', // 20 chars
        'abcd', // 4 chars
      ];

      validUsernames.forEach((username) => {
        expect(isValidUsername(username)).toBe(true);
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab', // Too short
        'a', // Too short
        'user1234567890123456789012345', // Too long
        'user@name', // Contains @
        'user.name', // Contains dot
        'user-name', // Contains dash
        'user name', // Contains space
        '',
        null,
        undefined,
        123,
      ];

      invalidUsernames.forEach((username) => {
        expect(isValidUsername(username)).toBe(false);
      });
    });

    it('should trim whitespace', () => {
      expect(isValidUsername('  john  ')).toBe(true);
      expect(isValidUsername('  ab  ')).toBe(false); // Still too short after trim
    });
  });

  describe('isValidPassword', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'password', // 8 chars
        'mypassword123',
        'a'.repeat(32), // 32 chars (max length)
        'Password123!',
      ];

      validPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(true);
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        'short', // 7 chars (too short)
        'a'.repeat(33), // 33 chars (too long)
        '',
        null,
        undefined,
        123,
      ];

      invalidPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(false);
      });
    });
  });
});
