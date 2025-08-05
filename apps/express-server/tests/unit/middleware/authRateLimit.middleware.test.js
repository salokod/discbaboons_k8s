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

describe('authRateLimit middleware', () => {
  beforeEach(() => {
    // Reset environment for each test
    delete process.env.NODE_ENV;
    vi.clearAllMocks();
  });

  it('should export authRateLimit function', async () => {
    const { authRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');
    expect(typeof authRateLimit).toBe('function');
  });

  it('should export passwordRateLimit function', async () => {
    const { passwordRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');
    expect(typeof passwordRateLimit).toBe('function');
  });

  it('should export usernameRecoveryRateLimit function', async () => {
    const { usernameRecoveryRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');
    expect(typeof usernameRecoveryRateLimit).toBe('function');
  });

  it('should export loginBruteForceProtection function', async () => {
    const { loginBruteForceProtection } = await import('../../../middleware/authRateLimit.middleware.js');
    expect(typeof loginBruteForceProtection).toBe('function');
  });

  it('should configure authRateLimit with 15 minute window and 10 max attempts', async () => {
    const { authRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    expect(authRateLimit.config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    expect(authRateLimit.config.max).toBe(10);
    expect(authRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes',
    });
  });

  it('should configure passwordRateLimit with 1 hour window and 3 max attempts', async () => {
    const { passwordRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    expect(passwordRateLimit.config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(passwordRateLimit.config.max).toBe(3);
    expect(passwordRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many password reset attempts, please try again in 1 hour',
    });
  });

  it('should configure usernameRecoveryRateLimit with 30 minute window and 5 max attempts', async () => {
    const { usernameRecoveryRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    expect(usernameRecoveryRateLimit.config.windowMs).toBe(30 * 60 * 1000); // 30 minutes
    expect(usernameRecoveryRateLimit.config.max).toBe(5);
    expect(usernameRecoveryRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many username recovery attempts, please try again in 30 minutes',
    });
  });

  it('should skip rate limiting in test environment', async () => {
    process.env.NODE_ENV = 'test';

    const { authRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    const mockReq = { headers: {} };
    const mockRes = {};
    const mockNext = vi.fn();

    authRateLimit(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should apply rate limiting in production environment', async () => {
    process.env.NODE_ENV = 'production';

    const { authRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    const mockReq = {
      headers: { 'x-rate-limit-exceeded': 'true' }, // Simulate rate limit exceeded
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    authRateLimit(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should have different configurations for different rate limiters', async () => {
    const { authRateLimit, passwordRateLimit, usernameRecoveryRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    // Verify they have different window times
    expect(authRateLimit.config.windowMs).toBe(15 * 60 * 1000);
    expect(passwordRateLimit.config.windowMs).toBe(60 * 60 * 1000);
    expect(usernameRecoveryRateLimit.config.windowMs).toBe(30 * 60 * 1000);

    // Verify they have appropriate max limits
    expect(authRateLimit.config.max).toBe(10);
    expect(passwordRateLimit.config.max).toBe(3); // Most restrictive
    expect(usernameRecoveryRateLimit.config.max).toBe(5);
  });

  it('should configure loginBruteForceProtection with 1 hour window and 10 max attempts', async () => {
    const { loginBruteForceProtection } = await import('../../../middleware/authRateLimit.middleware.js');

    expect(loginBruteForceProtection.config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(loginBruteForceProtection.config.max).toBe(10);
    expect(loginBruteForceProtection.config.skipSuccessfulRequests).toBe(true); // Only count failed
    expect(loginBruteForceProtection.config.message).toEqual({
      success: false,
      message: 'Too many login attempts from this IP. Please try again in 1 hour',
    });
  });

  it('should use standardHeaders and disable legacyHeaders', async () => {
    const {
      authRateLimit, passwordRateLimit, usernameRecoveryRateLimit, loginBruteForceProtection,
    } = await import('../../../middleware/authRateLimit.middleware.js');

    [authRateLimit, passwordRateLimit, usernameRecoveryRateLimit, loginBruteForceProtection]
      .forEach((rateLimit) => {
        expect(rateLimit.config.standardHeaders).toBe(true);
        expect(rateLimit.config.legacyHeaders).toBe(false);
        expect(rateLimit.config.skipFailedRequests).toBe(false);
      });
  });

  it('should have custom handler for security monitoring', async () => {
    const {
      authRateLimit, passwordRateLimit, usernameRecoveryRateLimit, loginBruteForceProtection,
    } = await import('../../../middleware/authRateLimit.middleware.js');

    [authRateLimit, passwordRateLimit, usernameRecoveryRateLimit, loginBruteForceProtection]
      .forEach((rateLimit) => {
        expect(typeof rateLimit.config.handler).toBe('function');
      });
  });

  it('should log security violations with random IP and user agent', async () => {
    const { authRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';

    const mockReq = {
      ip: chance.ip(),
      get: vi.fn().mockReturnValue(chance.string()),
      originalUrl: `/api/auth/${chance.word()}`,
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    // Call the custom handler directly
    authRateLimit.config.handler(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many requests, please try again later',
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SECURITY] Rate limit exceeded: auth_rate_limit',
      expect.objectContaining({
        ip: mockReq.ip,
        endpoint: mockReq.originalUrl,
      }),
    );

    // Cleanup
    consoleSpy.mockRestore();
    delete process.env.NODE_ENV;
  });

  it('should not log in test environment', async () => {
    const { passwordRateLimit } = await import('../../../middleware/authRateLimit.middleware.js');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'test';

    const mockReq = {
      ip: chance.ip(),
      get: vi.fn().mockReturnValue(chance.string()),
      originalUrl: `/api/auth/${chance.word()}`,
      headers: {},
    };
    const mockRes = {};
    const mockNext = vi.fn();

    passwordRateLimit(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
