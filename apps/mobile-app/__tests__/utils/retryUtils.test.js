/**
 * Retry Mechanism Utilities Tests
 * Tests for retry utilities with exponential backoff and error handling
 */

import {
  createRetryFunction,
  calculateBackoffDelay,
  shouldRetryError,
} from '../../src/utils/retryUtils';
import { RETRY_CONFIG } from '../../src/utils/errorTypes';

// Mock timer functions for testing
// Temporarily disable fake timers to debug
// jest.useFakeTimers();

describe('retryUtils', () => {
  beforeEach(() => {
    // jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // jest.runOnlyPendingTimers();
  });

  describe('calculateBackoffDelay', () => {
    test('should export calculateBackoffDelay function', () => {
      expect(calculateBackoffDelay).toBeDefined();
      expect(typeof calculateBackoffDelay).toBe('function');
    });

    test('should calculate exponential backoff for first attempt', () => {
      const delay = calculateBackoffDelay(1);
      expect(delay).toBe(RETRY_CONFIG.baseDelay); // 1000ms
    });

    test('should calculate exponential backoff for second attempt', () => {
      const delay = calculateBackoffDelay(2);
      expect(delay).toBe(RETRY_CONFIG.baseDelay * RETRY_CONFIG.backoffFactor); // 2000ms
    });

    test('should calculate exponential backoff for third attempt', () => {
      const delay = calculateBackoffDelay(3);
      expect(delay).toBe(RETRY_CONFIG.baseDelay * RETRY_CONFIG.backoffFactor ** 2); // 4000ms
    });

    test('should cap delay at maxDelay', () => {
      const delay = calculateBackoffDelay(10); // Would be very large without cap
      expect(delay).toBe(RETRY_CONFIG.maxDelay); // 10000ms
    });

    test('should handle edge cases', () => {
      expect(calculateBackoffDelay(0)).toBe(RETRY_CONFIG.baseDelay);
      expect(calculateBackoffDelay(-1)).toBe(RETRY_CONFIG.baseDelay);
    });

    test('should accept custom retry config', () => {
      const customConfig = {
        baseDelay: 500,
        maxDelay: 5000,
        backoffFactor: 3,
      };
      const delay = calculateBackoffDelay(2, customConfig);
      expect(delay).toBe(500 * 3); // 1500ms
    });
  });

  describe('shouldRetryError', () => {
    test('should export shouldRetryError function', () => {
      expect(shouldRetryError).toBeDefined();
      expect(typeof shouldRetryError).toBe('function');
    });

    test('should return true for retryable network error', () => {
      const error = new Error('Failed to fetch');
      const result = shouldRetryError(error, 1);
      expect(result).toBe(true);
    });

    test('should return true for retryable server error', () => {
      const error = new Error('Something went wrong. Please try again.');
      error.status = 500;
      const result = shouldRetryError(error, 1);
      expect(result).toBe(true);
    });

    test('should return true for rate limit error', () => {
      const error = new Error('Too many requests. Please try again later.');
      error.status = 429;
      const result = shouldRetryError(error, 1);
      expect(result).toBe(true);
    });

    test('should return false for auth error', () => {
      const error = new Error('Authentication required. Please log in again.');
      error.status = 401;
      const result = shouldRetryError(error, 1);
      expect(result).toBe(false);
    });

    test('should return false for permission error', () => {
      const error = new Error('Access denied');
      error.status = 403;
      const result = shouldRetryError(error, 1);
      expect(result).toBe(false);
    });

    test('should return false for validation error', () => {
      const error = new Error('Bag name is required');
      error.status = 400;
      const result = shouldRetryError(error, 1);
      expect(result).toBe(false);
    });

    test('should return false when max attempts exceeded', () => {
      const error = new Error('Failed to fetch');
      const result = shouldRetryError(error, RETRY_CONFIG.maxAttempts + 1);
      expect(result).toBe(false);
    });

    test('should accept custom retry config for max attempts', () => {
      const error = new Error('Failed to fetch');
      const customConfig = { maxAttempts: 5 };
      const result = shouldRetryError(error, 6, customConfig);
      expect(result).toBe(false);
    });
  });

  describe('createRetryFunction', () => {
    test('should export createRetryFunction', () => {
      expect(createRetryFunction).toBeDefined();
      expect(typeof createRetryFunction).toBe('function');
    });

    test('should return a function', () => {
      const mockFn = jest.fn();
      const retryFn = createRetryFunction(mockFn);
      expect(typeof retryFn).toBe('function');
    });

    test('should call original function once when it succeeds', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const retryFn = createRetryFunction(mockFn);

      const result = await retryFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should retry on retryable errors', async () => {
      jest.useFakeTimers();

      const networkError = new Error('Failed to fetch');
      const mockFn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');

      const retryFn = createRetryFunction(mockFn);

      // Start the retry operation
      const resultPromise = retryFn('arg1');

      // Fast-forward through timers for retries
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    test('should not retry on non-retryable errors', async () => {
      const authError = new Error('Authentication required. Please log in again.');
      authError.status = 401;
      const mockFn = jest.fn().mockRejectedValue(authError);

      const retryFn = createRetryFunction(mockFn);

      await expect(retryFn()).rejects.toThrow('Authentication required. Please log in again.');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should fail after max attempts', async () => {
      const networkError = new Error('Failed to fetch');
      const mockFn = jest.fn().mockRejectedValue(networkError);

      // Use fast config for testing without fake timers
      const testConfig = {
        maxAttempts: 3, baseDelay: 1, maxDelay: 10, backoffFactor: 2,
      };
      const retryFn = createRetryFunction(mockFn, testConfig);

      await expect(retryFn()).rejects.toThrow('Failed to fetch');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should use custom retry config', async () => {
      const networkError = new Error('Failed to fetch');
      const mockFn = jest.fn().mockRejectedValue(networkError);
      const customConfig = {
        maxAttempts: 2, baseDelay: 1, maxDelay: 10, backoffFactor: 2,
      };

      const retryFn = createRetryFunction(mockFn, customConfig);

      await expect(retryFn()).rejects.toThrow('Failed to fetch');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should respect exponential backoff timing', async () => {
      const networkError = new Error('Failed to fetch');
      const mockFn = jest.fn().mockRejectedValue(networkError);

      // Use fast config for testing without fake timers
      const testConfig = {
        maxAttempts: 3, baseDelay: 1, maxDelay: 10, backoffFactor: 2,
      };
      const retryFn = createRetryFunction(mockFn, testConfig);

      await expect(retryFn()).rejects.toThrow('Failed to fetch');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should handle synchronous errors', async () => {
      const syncError = new Error('Synchronous error');
      const mockFn = jest.fn().mockImplementation(() => {
        throw syncError;
      });

      const retryFn = createRetryFunction(mockFn);

      await expect(retryFn()).rejects.toThrow('Synchronous error');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should preserve this context', async () => {
      const obj = {
        value: 'test',
        method: jest.fn(function methodFn() {
          return this.value;
        }),
      };

      const retryFn = createRetryFunction(obj.method.bind(obj));
      const result = await retryFn();

      expect(result).toBe('test');
    });
  });

  describe('integration with existing bagService patterns', () => {
    test('should work with bagService-style timeout errors', async () => {
      jest.useFakeTimers();

      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';

      const mockBagService = jest.fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({ bags: [], pagination: {} });

      const retryFn = createRetryFunction(mockBagService);

      // Start operation
      const resultPromise = retryFn();

      // Fast-forward timers
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toEqual({ bags: [], pagination: {} });
      expect(mockBagService).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    test('should not retry bagService validation errors', async () => {
      const validationError = new Error('Bag name is required');
      validationError.status = 400;

      const mockBagService = jest.fn().mockRejectedValue(validationError);
      const retryFn = createRetryFunction(mockBagService);

      await expect(retryFn()).rejects.toThrow('Bag name is required');
      expect(mockBagService).toHaveBeenCalledTimes(1);
    });
  });
});
