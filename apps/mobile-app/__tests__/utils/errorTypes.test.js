/**
 * Error Types Constants Tests
 * Tests for error classification constants and retry configuration
 */

import {
  ERROR_TYPES,
  ERROR_SEVERITY,
  RETRY_CONFIG,
  DEFAULT_TIMEOUT,
} from '../../src/utils/errorTypes';

describe('errorTypes constants', () => {
  describe('ERROR_TYPES', () => {
    test('should export ERROR_TYPES object', () => {
      expect(ERROR_TYPES).toBeDefined();
      expect(typeof ERROR_TYPES).toBe('object');
    });

    test('should define all required error types', () => {
      expect(ERROR_TYPES.NETWORK).toBe('NETWORK');
      expect(ERROR_TYPES.AUTH).toBe('AUTH');
      expect(ERROR_TYPES.PERMISSION).toBe('PERMISSION');
      expect(ERROR_TYPES.SERVER).toBe('SERVER');
      expect(ERROR_TYPES.VALIDATION).toBe('VALIDATION');
      expect(ERROR_TYPES.RATE_LIMIT).toBe('RATE_LIMIT');
      expect(ERROR_TYPES.UNKNOWN).toBe('UNKNOWN');
    });

    test('should have all values as uppercase strings', () => {
      Object.values(ERROR_TYPES).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value).toBe(value.toUpperCase());
      });
    });
  });

  describe('ERROR_SEVERITY', () => {
    test('should export ERROR_SEVERITY object', () => {
      expect(ERROR_SEVERITY).toBeDefined();
      expect(typeof ERROR_SEVERITY).toBe('object');
    });

    test('should define all required severity levels', () => {
      expect(ERROR_SEVERITY.WARNING).toBe('WARNING');
      expect(ERROR_SEVERITY.ERROR).toBe('ERROR');
      expect(ERROR_SEVERITY.CRITICAL).toBe('CRITICAL');
    });

    test('should have all values as uppercase strings', () => {
      Object.values(ERROR_SEVERITY).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value).toBe(value.toUpperCase());
      });
    });
  });

  describe('RETRY_CONFIG', () => {
    test('should export RETRY_CONFIG object', () => {
      expect(RETRY_CONFIG).toBeDefined();
      expect(typeof RETRY_CONFIG).toBe('object');
    });

    test('should define all required retry configuration properties', () => {
      expect(RETRY_CONFIG.maxAttempts).toBe(3);
      expect(RETRY_CONFIG.baseDelay).toBe(1000);
      expect(RETRY_CONFIG.maxDelay).toBe(10000);
      expect(RETRY_CONFIG.backoffFactor).toBe(2);
    });

    test('should have valid numeric values for retry configuration', () => {
      expect(typeof RETRY_CONFIG.maxAttempts).toBe('number');
      expect(typeof RETRY_CONFIG.baseDelay).toBe('number');
      expect(typeof RETRY_CONFIG.maxDelay).toBe('number');
      expect(typeof RETRY_CONFIG.backoffFactor).toBe('number');

      expect(RETRY_CONFIG.maxAttempts).toBeGreaterThan(0);
      expect(RETRY_CONFIG.baseDelay).toBeGreaterThan(0);
      expect(RETRY_CONFIG.maxDelay).toBeGreaterThanOrEqual(RETRY_CONFIG.baseDelay);
      expect(RETRY_CONFIG.backoffFactor).toBeGreaterThan(1);
    });
  });

  describe('DEFAULT_TIMEOUT', () => {
    test('should export DEFAULT_TIMEOUT constant', () => {
      expect(DEFAULT_TIMEOUT).toBeDefined();
      expect(typeof DEFAULT_TIMEOUT).toBe('number');
      expect(DEFAULT_TIMEOUT).toBe(30000);
    });
  });

  describe('constant immutability', () => {
    test('should not allow modification of ERROR_TYPES', () => {
      const originalValue = ERROR_TYPES.NETWORK;
      ERROR_TYPES.NETWORK = 'MODIFIED';
      expect(ERROR_TYPES.NETWORK).toBe(originalValue);
      expect(Object.isFrozen(ERROR_TYPES)).toBe(true);
    });

    test('should not allow modification of ERROR_SEVERITY', () => {
      const originalValue = ERROR_SEVERITY.ERROR;
      ERROR_SEVERITY.ERROR = 'MODIFIED';
      expect(ERROR_SEVERITY.ERROR).toBe(originalValue);
      expect(Object.isFrozen(ERROR_SEVERITY)).toBe(true);
    });

    test('should not allow modification of RETRY_CONFIG', () => {
      const originalValue = RETRY_CONFIG.maxAttempts;
      RETRY_CONFIG.maxAttempts = 999;
      expect(RETRY_CONFIG.maxAttempts).toBe(originalValue);
      expect(Object.isFrozen(RETRY_CONFIG)).toBe(true);
    });
  });
});
