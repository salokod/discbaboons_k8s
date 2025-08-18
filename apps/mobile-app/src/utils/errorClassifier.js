/**
 * Error Classification Helper
 * Classifies errors by type and determines severity and retry behavior
 * Builds on existing bagService.js error patterns
 */

import { ERROR_TYPES, ERROR_SEVERITY } from './errorTypes';

/**
 * Classify an error based on its properties and message
 * @param {Error|null|undefined} error - Error to classify
 * @returns {string} Error type from ERROR_TYPES
 */
export function classifyError(error) {
  // Handle null/undefined errors
  if (!error) {
    return ERROR_TYPES.UNKNOWN;
  }

  const message = error.message || '';
  const { status } = error;

  // Classify by HTTP status code first (most reliable)
  if (status) {
    if (status === 401) {
      return ERROR_TYPES.AUTH;
    }
    if (status === 403) {
      return ERROR_TYPES.PERMISSION;
    }
    if (status === 429) {
      return ERROR_TYPES.RATE_LIMIT;
    }
    if (status === 400 || status === 404 || status === 409) {
      return ERROR_TYPES.VALIDATION;
    }
    if (status >= 500) {
      return ERROR_TYPES.SERVER;
    }
  }

  // Classify by error name (for timeout/abort errors)
  if (error.name === 'AbortError') {
    return ERROR_TYPES.NETWORK;
  }

  // Classify by message patterns (following bagService.js patterns)
  const lowerMessage = message.toLowerCase();

  // Network-related messages
  if (
    lowerMessage.includes('failed to fetch')
    || lowerMessage.includes('unable to connect')
    || lowerMessage.includes('check your internet')
    || lowerMessage.includes('network error')
    || lowerMessage.includes('request timeout')
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // Authentication messages
  if (
    lowerMessage.includes('authentication required')
    || lowerMessage.includes('please log in again')
    || lowerMessage.includes('token expired')
    || lowerMessage.includes('unauthorized')
  ) {
    return ERROR_TYPES.AUTH;
  }

  // Permission messages
  if (
    lowerMessage.includes('access denied')
    || lowerMessage.includes('not found or access denied')
    || lowerMessage.includes('forbidden')
  ) {
    return ERROR_TYPES.PERMISSION;
  }

  // Rate limit messages (check before server errors to avoid conflicts)
  if (
    lowerMessage.includes('too many requests')
    || lowerMessage.includes('rate limit')
    || lowerMessage.includes('try again later')
  ) {
    return ERROR_TYPES.RATE_LIMIT;
  }

  // Server error messages
  if (
    lowerMessage.includes('something went wrong')
    || lowerMessage.includes('please try again')
    || lowerMessage.includes('internal server error')
    || lowerMessage.includes('server error')
  ) {
    return ERROR_TYPES.SERVER;
  }

  // Validation messages (checking specific validation patterns from bagService)
  if (
    lowerMessage.includes('is required')
    || lowerMessage.includes('invalid')
    || lowerMessage.includes('not found')
    || lowerMessage.includes('already have')
    || lowerMessage.includes('must be')
  ) {
    return ERROR_TYPES.VALIDATION;
  }

  // Default to unknown for unrecognized patterns
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Get severity level for an error type
 * @param {string} errorType - Error type from ERROR_TYPES
 * @returns {string} Severity level from ERROR_SEVERITY
 */
export function getErrorSeverity(errorType) {
  switch (errorType) {
    case ERROR_TYPES.AUTH:
    case ERROR_TYPES.PERMISSION:
      return ERROR_SEVERITY.CRITICAL;

    case ERROR_TYPES.VALIDATION:
    case ERROR_TYPES.RATE_LIMIT:
      return ERROR_SEVERITY.WARNING;

    case ERROR_TYPES.NETWORK:
    case ERROR_TYPES.SERVER:
    case ERROR_TYPES.UNKNOWN:
    default:
      return ERROR_SEVERITY.ERROR;
  }
}

/**
 * Determine if an error type should be retried
 * @param {string} errorType - Error type from ERROR_TYPES
 * @returns {boolean} True if the error should be retried
 */
export function isRetryableError(errorType) {
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
    case ERROR_TYPES.SERVER:
    case ERROR_TYPES.RATE_LIMIT:
      return true;

    case ERROR_TYPES.AUTH:
    case ERROR_TYPES.PERMISSION:
    case ERROR_TYPES.VALIDATION:
    case ERROR_TYPES.UNKNOWN:
    default:
      return false;
  }
}
