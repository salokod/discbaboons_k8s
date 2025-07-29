import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock express-rate-limit before importing the middleware
vi.mock('express-rate-limit', () => ({
  default: vi.fn((config) => {
    // Return a mock middleware function with the config attached
    const mockMiddleware = vi.fn((req, res, next) => {
      // Simulate rate limiting logic
      if (config.skip && config.skip()) {
        return next(); // Skip rate limiting
      }

      // For testing, we'll assume requests are within limits unless specified
      if (req.headers && req.headers['x-rate-limit-exceeded']) {
        return res.status(429).json(config.message);
      }

      return next();
    });

    // Attach config for inspection
    mockMiddleware.config = config;
    return mockMiddleware;
  }),
}));

describe('coursesRateLimit middleware', () => {
  beforeEach(() => {
    // Reset environment for each test
    delete process.env.NODE_ENV;
    vi.clearAllMocks();
  });

  it('should export courseSearchRateLimit function', async () => {
    const { courseSearchRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');
    expect(typeof courseSearchRateLimit).toBe('function');
  });

  it('should export courseSubmitRateLimit function', async () => {
    const { courseSubmitRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');
    expect(typeof courseSubmitRateLimit).toBe('function');
  });

  it('should export courseEditRateLimit function', async () => {
    const { courseEditRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');
    expect(typeof courseEditRateLimit).toBe('function');
  });

  it('should export courseAdminRateLimit function', async () => {
    const { courseAdminRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');
    expect(typeof courseAdminRateLimit).toBe('function');
  });

  it('should configure courseSearchRateLimit with 5 minute window and 30 max attempts', async () => {
    const { courseSearchRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');

    expect(courseSearchRateLimit.config.windowMs).toBe(5 * 60 * 1000); // 5 minutes
    expect(courseSearchRateLimit.config.max).toBe(30);
    expect(courseSearchRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many search requests, please try again in 5 minutes',
    });
  });

  it('should configure courseSubmitRateLimit with 1 hour window and 5 max attempts', async () => {
    const { courseSubmitRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');

    expect(courseSubmitRateLimit.config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(courseSubmitRateLimit.config.max).toBe(5);
    expect(courseSubmitRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many course submissions, please try again in 1 hour',
    });
  });

  it('should skip rate limiting in test environment', async () => {
    process.env.NODE_ENV = 'test';

    const { courseSearchRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');

    const mockReq = { headers: {} };
    const mockRes = {};
    const mockNext = vi.fn();

    courseSearchRateLimit(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should apply rate limiting in production environment', async () => {
    process.env.NODE_ENV = 'production';

    const { courseSearchRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');

    const mockReq = {
      headers: { 'x-rate-limit-exceeded': 'true' }, // Simulate rate limit exceeded
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    courseSearchRateLimit(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many search requests, please try again in 5 minutes',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should log security violations with dynamic data', async () => {
    const { courseSubmitRateLimit } = await import('../../../middleware/coursesRateLimit.middleware.js');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';

    const mockReq = {
      ip: chance.ip(),
      get: vi.fn().mockReturnValue(chance.string()),
      originalUrl: `/api/courses/${chance.word()}`,
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    // Call the custom handler directly
    courseSubmitRateLimit.config.handler(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many requests, please try again later',
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SECURITY] Rate limit exceeded: course_submit_rate_limit',
      expect.objectContaining({
        ip: mockReq.ip,
        endpoint: mockReq.originalUrl,
      }),
    );

    // Cleanup
    consoleSpy.mockRestore();
    delete process.env.NODE_ENV;
  });
});
