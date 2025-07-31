// Comprehensive validation utilities to prevent 500 errors
import { validate as validateUUID } from 'uuid';

/**
 * Validates user ID format (integer or UUID string)
 * @param {any} userId - The user ID to validate
 * @returns {number|string} - Validated user ID
 * @throws {ValidationError} - If user ID is invalid
 */
export function validateUserId(userId) {
  if (!userId && userId !== 0) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if it's a valid integer
  const intUserId = parseInt(userId, 10);
  if (!Number.isNaN(intUserId) && intUserId > 0 && String(intUserId) === String(userId)) {
    return intUserId;
  }

  // Check if it's a valid UUID
  if (typeof userId === 'string' && validateUUID(userId)) {
    return userId;
  }

  const error = new Error('User ID must be a positive integer or valid UUID');
  error.name = 'ValidationError';
  throw error;
}

/**
 * Validates JWT decoded payload structure
 * @param {any} decodedPayload - The decoded JWT payload
 * @returns {object} - Validated payload
 * @throws {ValidationError} - If payload structure is invalid
 */
export function validateJWTPayload(decodedPayload) {
  if (!decodedPayload || typeof decodedPayload !== 'object') {
    const error = new Error('Invalid JWT payload structure');
    error.name = 'ValidationError';
    throw error;
  }

  if (!decodedPayload.userId && decodedPayload.userId !== 0) {
    const error = new Error('JWT payload missing userId');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate the userId format
  try {
    const validatedUserId = validateUserId(decodedPayload.userId);
    return {
      ...decodedPayload,
      userId: validatedUserId,
    };
  } catch (validationError) {
    const error = new Error('JWT payload contains invalid userId format');
    error.name = 'ValidationError';
    throw error;
  }
}

/**
 * Validates pagination parameters
 * @param {object} query - Query parameters object
 * @returns {object} - Validated pagination parameters
 */
export function validatePaginationParams(query = {}) {
  const result = {};

  // Validate limit
  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      const error = new Error('Limit must be a positive integer');
      error.name = 'ValidationError';
      throw error;
    }
    if (parsedLimit > 100) {
      const error = new Error('Limit cannot exceed 100');
      error.name = 'ValidationError';
      throw error;
    }
    result.limit = parsedLimit;
  }

  // Validate offset
  if (query.offset !== undefined) {
    const parsedOffset = parseInt(query.offset, 10);
    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      const error = new Error('Offset must be a non-negative integer');
      error.name = 'ValidationError';
      throw error;
    }
    result.offset = parsedOffset;
  }

  return result;
}

/**
 * Validates query parameters for friends endpoints
 * @param {object} query - Query parameters object
 * @returns {object} - Validated query parameters
 */
export function validateFriendsQueryParams(query = {}) {
  const validatedParams = {};

  // Validate pagination parameters
  const paginationParams = validatePaginationParams(query);
  Object.assign(validatedParams, paginationParams);

  // Validate any additional query parameters specific to friends
  const allowedParams = ['limit', 'offset'];
  const unknownParams = Object.keys(query).filter((param) => !allowedParams.includes(param));

  if (unknownParams.length > 0) {
    const error = new Error(`Unknown query parameters: ${unknownParams.join(', ')}`);
    error.name = 'ValidationError';
    throw error;
  }

  return validatedParams;
}

/**
 * Validates database query parameters to prevent SQL injection
 * @param {array} params - Array of query parameters
 * @returns {array} - Validated parameters
 */
export function validateQueryParams(params = []) {
  if (!Array.isArray(params)) {
    const error = new Error('Query parameters must be an array');
    error.name = 'ValidationError';
    throw error;
  }

  // Check for dangerous parameter types
  for (let i = 0; i < params.length; i += 1) {
    const param = params[i];

    // Allow null, undefined, strings, numbers, booleans, and Dates
    if (param !== null && param !== undefined) {
      const paramType = typeof param;
      const isValidType = ['string', 'number', 'boolean'].includes(paramType)
                         || param instanceof Date
                         || Buffer.isBuffer(param);

      if (!isValidType) {
        const error = new Error(`Invalid parameter type at index ${i}: ${paramType}`);
        error.name = 'ValidationError';
        throw error;
      }

      // Additional string length validation to prevent extremely long strings
      if (paramType === 'string' && param.length > 10000) {
        const error = new Error(`Parameter at index ${i} exceeds maximum length of 10000 characters`);
        error.name = 'ValidationError';
        throw error;
      }
    }
  }

  return params;
}

/**
 * Creates a standardized validation error response
 * @param {string} message - Error message
 * @param {string} field - Field that failed validation (optional)
 * @returns {object} - Standardized error object
 */
export function createValidationError(message, field = null) {
  const error = new Error(message);
  error.name = 'ValidationError';
  if (field) {
    error.field = field;
  }
  return error;
}

/**
 * Validates that a value is a safe integer for database operations
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {number} - Validated integer
 */
export function validateSafeInteger(value, fieldName = 'value') {
  if (value === null || value === undefined) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }

  const intValue = parseInt(value, 10);
  if (Number.isNaN(intValue)) {
    throw createValidationError(`${fieldName} must be a valid integer`, fieldName);
  }

  if (!Number.isSafeInteger(intValue)) {
    throw createValidationError(`${fieldName} must be a safe integer`, fieldName);
  }

  return intValue;
}

/**
 * Validates UUID format
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {string} - Validated UUID
 */
export function validateUUIDFormat(value, fieldName = 'value') {
  if (!value) {
    throw createValidationError(`${fieldName} is required`, fieldName);
  }

  if (typeof value !== 'string') {
    throw createValidationError(`${fieldName} must be a string`, fieldName);
  }

  if (!validateUUID(value)) {
    throw createValidationError(`${fieldName} must be a valid UUID`, fieldName);
  }

  return value;
}
