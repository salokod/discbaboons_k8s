import { describe, it, expect } from 'vitest';
import {
  validateUserId,
  validateJWTPayload,
  validatePaginationParams,
  validateFriendsQueryParams,
  validateQueryParams,
  validateSafeInteger,
  validateUUIDFormat,
  createValidationError,
} from '../../../lib/validation.js';

describe('validation utilities', () => {
  describe('validateUserId', () => {
    it('should accept valid positive integers', () => {
      expect(validateUserId(123)).toBe(123);
      expect(validateUserId('456')).toBe(456);
      expect(validateUserId(1)).toBe(1);
    });

    it('should accept valid UUID strings', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateUserId(uuid)).toBe(uuid);
    });

    it('should reject null or undefined', () => {
      expect(() => validateUserId(null)).toThrow('User ID is required');
      expect(() => validateUserId(undefined)).toThrow('User ID is required');
    });

    it('should reject zero or negative integers', () => {
      expect(() => validateUserId(0)).toThrow('User ID must be a positive integer or valid UUID');
      expect(() => validateUserId(-1)).toThrow('User ID must be a positive integer or valid UUID');
    });

    it('should reject invalid UUID strings', () => {
      expect(() => validateUserId('invalid-uuid')).toThrow('User ID must be a positive integer or valid UUID');
      expect(() => validateUserId('123-456-789')).toThrow('User ID must be a positive integer or valid UUID');
    });

    it('should reject non-integer strings', () => {
      expect(() => validateUserId('abc')).toThrow('User ID must be a positive integer or valid UUID');
      expect(() => validateUserId('12.34')).toThrow('User ID must be a positive integer or valid UUID');
    });
  });

  describe('validateJWTPayload', () => {
    it('should accept valid JWT payload with integer userId', () => {
      const payload = { userId: 123, email: 'test@example.com' };
      const result = validateJWTPayload(payload);
      expect(result.userId).toBe(123);
      expect(result.email).toBe('test@example.com');
    });

    it('should accept valid JWT payload with UUID userId', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const payload = { userId: uuid, email: 'test@example.com' };
      const result = validateJWTPayload(payload);
      expect(result.userId).toBe(uuid);
    });

    it('should reject null or non-object payload', () => {
      expect(() => validateJWTPayload(null)).toThrow('Invalid JWT payload structure');
      expect(() => validateJWTPayload('string')).toThrow('Invalid JWT payload structure');
      expect(() => validateJWTPayload(123)).toThrow('Invalid JWT payload structure');
    });

    it('should reject payload without userId', () => {
      expect(() => validateJWTPayload({ email: 'test@example.com' })).toThrow('JWT payload missing userId');
    });

    it('should reject payload with invalid userId', () => {
      expect(() => validateJWTPayload({ userId: 0 })).toThrow('JWT payload contains invalid userId format');
      expect(() => validateJWTPayload({ userId: 'invalid' })).toThrow('JWT payload contains invalid userId format');
    });
  });

  describe('validatePaginationParams', () => {
    it('should accept valid pagination parameters', () => {
      const result = validatePaginationParams({ limit: '20', offset: '10' });
      expect(result).toEqual({ limit: 20, offset: 10 });
    });

    it('should handle undefined parameters', () => {
      const result = validatePaginationParams({});
      expect(result).toEqual({});
    });

    it('should reject invalid limit values', () => {
      expect(() => validatePaginationParams({ limit: '0' })).toThrow('Limit must be a positive integer');
      expect(() => validatePaginationParams({ limit: '-1' })).toThrow('Limit must be a positive integer');
      expect(() => validatePaginationParams({ limit: 'abc' })).toThrow('Limit must be a positive integer');
    });

    it('should reject limit values over 100', () => {
      expect(() => validatePaginationParams({ limit: '101' })).toThrow('Limit cannot exceed 100');
    });

    it('should reject negative offset values', () => {
      expect(() => validatePaginationParams({ offset: '-1' })).toThrow('Offset must be a non-negative integer');
      expect(() => validatePaginationParams({ offset: 'abc' })).toThrow('Offset must be a non-negative integer');
    });

    it('should accept zero offset', () => {
      const result = validatePaginationParams({ offset: '0' });
      expect(result).toEqual({ offset: 0 });
    });
  });

  describe('validateFriendsQueryParams', () => {
    it('should accept valid friends query parameters', () => {
      const result = validateFriendsQueryParams({ limit: '20', offset: '0' });
      expect(result).toEqual({ limit: 20, offset: 0 });
    });

    it('should reject unknown parameters', () => {
      expect(() => validateFriendsQueryParams({ limit: '20', unknown: 'value' }))
        .toThrow('Unknown query parameters: unknown');
    });

    it('should reject multiple unknown parameters', () => {
      expect(() => validateFriendsQueryParams({ limit: '20', param1: 'a', param2: 'b' }))
        .toThrow('Unknown query parameters: param1, param2');
    });
  });

  describe('validateQueryParams', () => {
    it('should accept valid parameter arrays', () => {
      const params = [123, 'string', true, new Date(), null, undefined];
      expect(validateQueryParams(params)).toEqual(params);
    });

    it('should reject non-array input', () => {
      expect(() => validateQueryParams('not-array')).toThrow('Query parameters must be an array');
    });

    it('should reject invalid parameter types', () => {
      expect(() => validateQueryParams([123, { object: true }]))
        .toThrow('Invalid parameter type at index 1: object');
    });

    it('should reject extremely long strings', () => {
      const longString = 'a'.repeat(10001);
      expect(() => validateQueryParams([longString]))
        .toThrow('Parameter at index 0 exceeds maximum length of 10000 characters');
    });

    it('should accept Buffer parameters', () => {
      const buffer = Buffer.from('test');
      expect(validateQueryParams([buffer])).toEqual([buffer]);
    });
  });

  describe('validateSafeInteger', () => {
    it('should accept valid integers', () => {
      expect(validateSafeInteger(123)).toBe(123);
      expect(validateSafeInteger('456')).toBe(456);
    });

    it('should reject null/undefined values', () => {
      expect(() => validateSafeInteger(null)).toThrow('value is required');
      expect(() => validateSafeInteger(undefined)).toThrow('value is required');
    });

    it('should reject non-integer values', () => {
      expect(() => validateSafeInteger('abc')).toThrow('value must be a valid integer');
    });

    it('should reject unsafe integers', () => {
      const unsafeInteger = Number.MAX_SAFE_INTEGER + 1;
      expect(() => validateSafeInteger(unsafeInteger)).toThrow('value must be a safe integer');
    });

    it('should use custom field name in error messages', () => {
      expect(() => validateSafeInteger(null, 'userId')).toThrow('userId is required');
    });
  });

  describe('validateUUIDFormat', () => {
    it('should accept valid UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateUUIDFormat(uuid)).toBe(uuid);
    });

    it('should reject null/undefined values', () => {
      expect(() => validateUUIDFormat(null)).toThrow('value is required');
      expect(() => validateUUIDFormat(undefined)).toThrow('value is required');
    });

    it('should reject non-string values', () => {
      expect(() => validateUUIDFormat(123)).toThrow('value must be a string');
    });

    it('should reject invalid UUID format', () => {
      expect(() => validateUUIDFormat('invalid-uuid')).toThrow('value must be a valid UUID');
    });

    it('should use custom field name in error messages', () => {
      expect(() => validateUUIDFormat(null, 'roundId')).toThrow('roundId is required');
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with message', () => {
      const error = createValidationError('Test message');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test message');
      expect(error.field).toBe(undefined);
    });

    it('should create validation error with field', () => {
      const error = createValidationError('Test message', 'testField');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test message');
      expect(error.field).toBe('testField');
    });
  });
});
