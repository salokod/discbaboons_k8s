/**
 * Retry Mechanism Utilities
 * Provides retry logic with exponential backoff for error recovery
 * Integrates with error classification for smart retry decisions
 */

import { RETRY_CONFIG } from './errorTypes';
import { classifyError, isRetryableError } from './errorClassifier';

/**
 * Calculate exponential backoff delay for retry attempts
 * @param {number} attempt - Current attempt number (1-based)
 * @param {Object} config - Optional retry configuration override
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoffDelay(attempt, config = RETRY_CONFIG) {
  const { baseDelay, maxDelay, backoffFactor } = config;

  // Ensure attempt is at least 1
  const safeAttempt = Math.max(1, attempt);

  // Calculate exponential backoff: baseDelay * (backoffFactor ^ (attempt - 1))
  const exponentialDelay = baseDelay * (backoffFactor ** (safeAttempt - 1));

  // Cap at maxDelay to prevent extremely long waits
  return Math.min(exponentialDelay, maxDelay);
}

/**
 * Determine if an error should be retried based on type and attempt count
 * @param {Error} error - Error to evaluate
 * @param {number} attempt - Current attempt number
 * @param {Object} config - Optional retry configuration override
 * @returns {boolean} True if the error should be retried
 */
export function shouldRetryError(error, attempt, config = RETRY_CONFIG) {
  const { maxAttempts } = config;

  // Don't retry if we've exceeded max attempts
  if (attempt > maxAttempts) {
    return false;
  }

  // Use error classifier to determine if error type is retryable
  const errorType = classifyError(error);
  return isRetryableError(errorType);
}

/**
 * Create a retry-enabled wrapper function around an async operation
 * @param {Function} asyncFn - Async function to wrap with retry logic
 * @param {Object} config - Optional retry configuration override
 * @returns {Function} Retry-enabled version of the function
 */
export function createRetryFunction(asyncFn, config = RETRY_CONFIG) {
  return async function retryWrapper(...args) {
    let lastError;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
      try {
        // Call the original function
        // eslint-disable-next-line no-await-in-loop
        const result = await asyncFn.apply(this, args);
        return result;
      } catch (error) {
        lastError = error;

        // Check if we should retry this error
        if (!shouldRetryError(error, attempt, config)) {
          throw error;
        }

        // If this is the last attempt, don't delay - just break
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay and wait before retrying
        const delay = calculateBackoffDelay(attempt, config);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }

    // All attempts failed, throw the last error
    throw lastError;
  };
}
