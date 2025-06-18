import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import forgotPasswordService from '../../../services/auth.forgotpassword.service.js';

// Mock Redis using the same pattern as other tests
vi.mock('../../../lib/redis.js', () => ({
  default: {
    setEx: vi.fn().mockResolvedValue('OK'),
  },
}));

describe('ForgotPasswordService', () => {
  let mockRedis;

  beforeEach(async () => {
    const { default: redis } = await import('../../../lib/redis.js');
    mockRedis = redis;
    vi.clearAllMocks();
  });

  test('should export forgotPassword function', () => {
    expect(typeof forgotPasswordService).toBe('function');
  });

  test('should return success message', async () => {
    const result = await forgotPasswordService();

    expect(result).toEqual({
      success: true,
      message: 'Redis test working',
    });
  });

  test('should store test value in Redis', async () => {
    await forgotPasswordService();

    expect(mockRedis.setEx).toHaveBeenCalledWith('test:redis', 60, 'working');
  });

  test('should throw error when Redis fails', async () => {
    const redisError = new Error('Redis connection failed');
    mockRedis.setEx.mockRejectedValue(redisError);

    await expect(forgotPasswordService()).rejects.toThrow('Redis connection failed');
  });
});
