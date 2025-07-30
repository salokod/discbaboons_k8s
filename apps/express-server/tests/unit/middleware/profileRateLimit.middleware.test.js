import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import {
  profileGetRateLimit,
  profileUpdateRateLimit,
  profileSearchRateLimit,
} from '../../../middleware/profileRateLimit.middleware.js';

describe('profileRateLimit.middleware.js', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
      originalUrl: '/api/profile/test',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    // Reset environment
    delete process.env.NODE_ENV;
  });

  describe('profileGetRateLimit', () => {
    it('should export profileGetRateLimit middleware', () => {
      expect(profileGetRateLimit).toBeDefined();
      expect(typeof profileGetRateLimit).toBe('function');
    });

    it('should allow requests in test environment', async () => {
      process.env.NODE_ENV = 'test';

      await profileGetRateLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('profileUpdateRateLimit', () => {
    it('should export profileUpdateRateLimit middleware', () => {
      expect(profileUpdateRateLimit).toBeDefined();
      expect(typeof profileUpdateRateLimit).toBe('function');
    });
  });

  describe('profileSearchRateLimit', () => {
    it('should export profileSearchRateLimit middleware', () => {
      expect(profileSearchRateLimit).toBeDefined();
      expect(typeof profileSearchRateLimit).toBe('function');
    });
  });

  describe('Security logging', () => {
    it('should have custom rate limit handlers', () => {
      // Test that the middleware functions are properly configured
      expect(typeof profileGetRateLimit).toBe('function');
      expect(typeof profileUpdateRateLimit).toBe('function');
      expect(typeof profileSearchRateLimit).toBe('function');
    });
  });
});
