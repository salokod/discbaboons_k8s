/**
 * Error Types and Configuration Constants
 * Provides error classification and retry configuration for bulk operations
 */

/**
 * Error types for classification
 * Used to categorize different types of errors for appropriate handling
 */
export const ERROR_TYPES = Object.freeze({
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  PERMISSION: 'PERMISSION',
  SERVER: 'SERVER',
  VALIDATION: 'VALIDATION',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN',
});

/**
 * Error severity levels
 * Used to determine appropriate user messaging and retry behavior
 */
export const ERROR_SEVERITY = Object.freeze({
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
});

/**
 * Default retry configuration
 * Used for automatic retry attempts with exponential backoff
 */
export const RETRY_CONFIG = Object.freeze({
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
});

/**
 * Default timeout for network operations
 * Matches existing bagService.js timeout pattern
 */
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
