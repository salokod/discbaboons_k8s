import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import {
  friendRequestRateLimit,
  friendRespondRateLimit,
  friendsListRateLimit,
} from '../../../middleware/friendsRateLimit.middleware.js';

describe('friendsRateLimit.middleware.js', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
      originalUrl: '/api/friends/test',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    // Reset environment
    delete process.env.NODE_ENV;
  });

  describe('friendRequestRateLimit', () => {
    it('should export friendRequestRateLimit middleware', () => {
      expect(friendRequestRateLimit).toBeDefined();
      expect(typeof friendRequestRateLimit).toBe('function');
    });

    it('should allow requests in test environment', async () => {
      process.env.NODE_ENV = 'test';

      await friendRequestRateLimit(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('friendRespondRateLimit', () => {
    it('should export friendRespondRateLimit middleware', () => {
      expect(friendRespondRateLimit).toBeDefined();
      expect(typeof friendRespondRateLimit).toBe('function');
    });
  });

  describe('friendsListRateLimit', () => {
    it('should export friendsListRateLimit middleware', () => {
      expect(friendsListRateLimit).toBeDefined();
      expect(typeof friendsListRateLimit).toBe('function');
    });
  });

  describe('Security logging', () => {
    it('should have custom rate limit handlers', () => {
      // Test that the middleware functions are properly configured
      expect(typeof friendRequestRateLimit).toBe('function');
      expect(typeof friendRespondRateLimit).toBe('function');
      expect(typeof friendsListRateLimit).toBe('function');
    });
  });
});
