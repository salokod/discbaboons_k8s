/**
 * Error Classification Helper Tests
 * Tests for error classification function that determines error type and severity
 */

import {
  classifyError,
  getErrorSeverity,
  isRetryableError,
} from '../../src/utils/errorClassifier';
import { ERROR_TYPES, ERROR_SEVERITY } from '../../src/utils/errorTypes';

describe('errorClassifier', () => {
  describe('classifyError', () => {
    test('should export classifyError function', () => {
      expect(classifyError).toBeDefined();
      expect(typeof classifyError).toBe('function');
    });

    describe('network errors', () => {
      test('should classify timeout errors as NETWORK', () => {
        const error = new Error('Request timeout');
        error.name = 'AbortError';
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.NETWORK);
      });

      test('should classify fetch errors as NETWORK', () => {
        const error = new Error('Failed to fetch');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.NETWORK);
      });

      test('should classify connection errors as NETWORK', () => {
        const error = new Error('Unable to connect. Please check your internet.');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.NETWORK);
      });
    });

    describe('authentication errors', () => {
      test('should classify 401 status as AUTH', () => {
        const error = new Error('Authentication required. Please log in again.');
        error.status = 401;
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.AUTH);
      });

      test('should classify authentication messages as AUTH', () => {
        const error = new Error('Authentication required. Please log in again.');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.AUTH);
      });
    });

    describe('permission errors', () => {
      test('should classify 403 status as PERMISSION', () => {
        const error = new Error('Access denied');
        error.status = 403;
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.PERMISSION);
      });

      test('should classify permission messages as PERMISSION', () => {
        const error = new Error('Bag not found or access denied');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.PERMISSION);
      });
    });

    describe('server errors', () => {
      test('should classify 500 status as SERVER', () => {
        const error = new Error('Internal Server Error');
        error.status = 500;
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.SERVER);
      });

      test('should classify 502 status as SERVER', () => {
        const error = new Error('Bad Gateway');
        error.status = 502;
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.SERVER);
      });

      test('should classify server error messages as SERVER', () => {
        const error = new Error('Something went wrong. Please try again.');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.SERVER);
      });
    });

    describe('validation errors', () => {
      test('should classify 400 status as VALIDATION', () => {
        const error = new Error('Invalid request parameters');
        error.status = 400;
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.VALIDATION);
      });

      test('should classify 404 status as VALIDATION', () => {
        const error = new Error('Bag not found');
        error.status = 404;
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.VALIDATION);
      });

      test('should classify validation messages as VALIDATION', () => {
        const error = new Error('Bag name is required');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.VALIDATION);
      });
    });

    describe('rate limit errors', () => {
      test('should classify 429 status as RATE_LIMIT', () => {
        const error = new Error('Too many requests');
        error.status = 429;
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.RATE_LIMIT);
      });

      test('should classify rate limit messages as RATE_LIMIT', () => {
        const error = new Error('Too many requests. Please try again later.');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.RATE_LIMIT);
      });
    });

    describe('unknown errors', () => {
      test('should classify unrecognized errors as UNKNOWN', () => {
        const error = new Error('Mysterious error');
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.UNKNOWN);
      });

      test('should handle null/undefined errors', () => {
        expect(classifyError(null)).toBe(ERROR_TYPES.UNKNOWN);
        expect(classifyError(undefined)).toBe(ERROR_TYPES.UNKNOWN);
      });

      test('should handle errors without message', () => {
        const error = new Error();
        const result = classifyError(error);
        expect(result).toBe(ERROR_TYPES.UNKNOWN);
      });
    });
  });

  describe('getErrorSeverity', () => {
    test('should export getErrorSeverity function', () => {
      expect(getErrorSeverity).toBeDefined();
      expect(typeof getErrorSeverity).toBe('function');
    });

    test('should return CRITICAL for AUTH errors', () => {
      const result = getErrorSeverity(ERROR_TYPES.AUTH);
      expect(result).toBe(ERROR_SEVERITY.CRITICAL);
    });

    test('should return CRITICAL for PERMISSION errors', () => {
      const result = getErrorSeverity(ERROR_TYPES.PERMISSION);
      expect(result).toBe(ERROR_SEVERITY.CRITICAL);
    });

    test('should return ERROR for NETWORK errors', () => {
      const result = getErrorSeverity(ERROR_TYPES.NETWORK);
      expect(result).toBe(ERROR_SEVERITY.ERROR);
    });

    test('should return ERROR for SERVER errors', () => {
      const result = getErrorSeverity(ERROR_TYPES.SERVER);
      expect(result).toBe(ERROR_SEVERITY.ERROR);
    });

    test('should return WARNING for VALIDATION errors', () => {
      const result = getErrorSeverity(ERROR_TYPES.VALIDATION);
      expect(result).toBe(ERROR_SEVERITY.WARNING);
    });

    test('should return WARNING for RATE_LIMIT errors', () => {
      const result = getErrorSeverity(ERROR_TYPES.RATE_LIMIT);
      expect(result).toBe(ERROR_SEVERITY.WARNING);
    });

    test('should return ERROR for UNKNOWN errors', () => {
      const result = getErrorSeverity(ERROR_TYPES.UNKNOWN);
      expect(result).toBe(ERROR_SEVERITY.ERROR);
    });

    test('should handle invalid error types', () => {
      const result = getErrorSeverity('INVALID_TYPE');
      expect(result).toBe(ERROR_SEVERITY.ERROR);
    });
  });

  describe('isRetryableError', () => {
    test('should export isRetryableError function', () => {
      expect(isRetryableError).toBeDefined();
      expect(typeof isRetryableError).toBe('function');
    });

    test('should return true for NETWORK errors', () => {
      const result = isRetryableError(ERROR_TYPES.NETWORK);
      expect(result).toBe(true);
    });

    test('should return true for SERVER errors', () => {
      const result = isRetryableError(ERROR_TYPES.SERVER);
      expect(result).toBe(true);
    });

    test('should return true for RATE_LIMIT errors', () => {
      const result = isRetryableError(ERROR_TYPES.RATE_LIMIT);
      expect(result).toBe(true);
    });

    test('should return false for AUTH errors', () => {
      const result = isRetryableError(ERROR_TYPES.AUTH);
      expect(result).toBe(false);
    });

    test('should return false for PERMISSION errors', () => {
      const result = isRetryableError(ERROR_TYPES.PERMISSION);
      expect(result).toBe(false);
    });

    test('should return false for VALIDATION errors', () => {
      const result = isRetryableError(ERROR_TYPES.VALIDATION);
      expect(result).toBe(false);
    });

    test('should return false for UNKNOWN errors', () => {
      const result = isRetryableError(ERROR_TYPES.UNKNOWN);
      expect(result).toBe(false);
    });

    test('should handle invalid error types', () => {
      const result = isRetryableError('INVALID_TYPE');
      expect(result).toBe(false);
    });
  });

  describe('integration with existing bagService errors', () => {
    test('should classify typical bagService network error', () => {
      const error = new Error('Unable to connect. Please check your internet.');
      const errorType = classifyError(error);
      const severity = getErrorSeverity(errorType);
      const retryable = isRetryableError(errorType);

      expect(errorType).toBe(ERROR_TYPES.NETWORK);
      expect(severity).toBe(ERROR_SEVERITY.ERROR);
      expect(retryable).toBe(true);
    });

    test('should classify typical bagService auth error', () => {
      const error = new Error('Authentication required. Please log in again.');
      error.status = 401;
      const errorType = classifyError(error);
      const severity = getErrorSeverity(errorType);
      const retryable = isRetryableError(errorType);

      expect(errorType).toBe(ERROR_TYPES.AUTH);
      expect(severity).toBe(ERROR_SEVERITY.CRITICAL);
      expect(retryable).toBe(false);
    });

    test('should classify typical bagService server error', () => {
      const error = new Error('Something went wrong. Please try again.');
      error.status = 500;
      const errorType = classifyError(error);
      const severity = getErrorSeverity(errorType);
      const retryable = isRetryableError(errorType);

      expect(errorType).toBe(ERROR_TYPES.SERVER);
      expect(severity).toBe(ERROR_SEVERITY.ERROR);
      expect(retryable).toBe(true);
    });
  });
});
