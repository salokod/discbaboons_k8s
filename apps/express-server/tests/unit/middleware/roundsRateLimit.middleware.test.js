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

describe('roundsRateLimit middleware', () => {
  beforeEach(() => {
    // Reset environment for each test
    delete process.env.NODE_ENV;
    vi.clearAllMocks();
  });

  it('should export roundsListRateLimit function', async () => {
    const { roundsListRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsListRateLimit).toBe('function');
  });

  it('should export roundsCreateRateLimit function', async () => {
    const { roundsCreateRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsCreateRateLimit).toBe('function');
  });

  it('should export roundsDetailsRateLimit function', async () => {
    const { roundsDetailsRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsDetailsRateLimit).toBe('function');
  });

  it('should export roundsUpdateRateLimit function', async () => {
    const { roundsUpdateRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsUpdateRateLimit).toBe('function');
  });

  it('should export roundsDeleteRateLimit function', async () => {
    const { roundsDeleteRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsDeleteRateLimit).toBe('function');
  });

  it('should export roundsPlayerRateLimit function', async () => {
    const { roundsPlayerRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsPlayerRateLimit).toBe('function');
  });

  it('should export roundsScoringRateLimit function', async () => {
    const { roundsScoringRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsScoringRateLimit).toBe('function');
  });

  it('should export roundsSideBetsRateLimit function', async () => {
    const { roundsSideBetsRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');
    expect(typeof roundsSideBetsRateLimit).toBe('function');
  });

  it('should configure roundsListRateLimit with 10 minute window and 50 max attempts', async () => {
    const { roundsListRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsListRateLimit.config.windowMs).toBe(10 * 60 * 1000); // 10 minutes
    expect(roundsListRateLimit.config.max).toBe(50);
    expect(roundsListRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many rounds list requests, please try again in 10 minutes',
    });
  });

  it('should configure roundsCreateRateLimit with 1 hour window and 10 max attempts', async () => {
    const { roundsCreateRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsCreateRateLimit.config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(roundsCreateRateLimit.config.max).toBe(10);
    expect(roundsCreateRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many round creation requests, please try again in 1 hour',
    });
  });

  it('should configure roundsDetailsRateLimit with 10 minute window and 100 max attempts', async () => {
    const { roundsDetailsRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsDetailsRateLimit.config.windowMs).toBe(10 * 60 * 1000); // 10 minutes
    expect(roundsDetailsRateLimit.config.max).toBe(100);
    expect(roundsDetailsRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many round detail requests, please try again in 10 minutes',
    });
  });

  it('should configure roundsUpdateRateLimit with 1 hour window and 20 max attempts', async () => {
    const { roundsUpdateRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsUpdateRateLimit.config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(roundsUpdateRateLimit.config.max).toBe(20);
    expect(roundsUpdateRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many round update requests, please try again in 1 hour',
    });
  });

  it('should configure roundsDeleteRateLimit with 1 hour window and 5 max attempts', async () => {
    const { roundsDeleteRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsDeleteRateLimit.config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(roundsDeleteRateLimit.config.max).toBe(5);
    expect(roundsDeleteRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many round deletion requests, please try again in 1 hour',
    });
  });

  it('should configure roundsPlayerRateLimit with 10 minute window and 30 max attempts', async () => {
    const { roundsPlayerRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsPlayerRateLimit.config.windowMs).toBe(10 * 60 * 1000); // 10 minutes
    expect(roundsPlayerRateLimit.config.max).toBe(30);
    expect(roundsPlayerRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many player management requests, please try again in 10 minutes',
    });
  });

  it('should configure roundsScoringRateLimit with 10 minute window and 100 max attempts', async () => {
    const { roundsScoringRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsScoringRateLimit.config.windowMs).toBe(10 * 60 * 1000); // 10 minutes
    expect(roundsScoringRateLimit.config.max).toBe(100);
    expect(roundsScoringRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many scoring requests, please try again in 10 minutes',
    });
  });

  it('should configure roundsSideBetsRateLimit with 1 hour window and 20 max attempts', async () => {
    const { roundsSideBetsRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    expect(roundsSideBetsRateLimit.config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(roundsSideBetsRateLimit.config.max).toBe(20);
    expect(roundsSideBetsRateLimit.config.message).toEqual({
      success: false,
      message: 'Too many side bet requests, please try again in 1 hour',
    });
  });

  it('should skip rate limiting in test environment', async () => {
    process.env.NODE_ENV = 'test';

    const { roundsListRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    const mockReq = { headers: {} };
    const mockRes = {};
    const mockNext = vi.fn();

    roundsListRateLimit(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should apply rate limiting in production environment', async () => {
    process.env.NODE_ENV = 'production';

    const { roundsCreateRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    const mockReq = {
      headers: { 'x-rate-limit-exceeded': 'true' }, // Simulate rate limit exceeded
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    roundsCreateRateLimit(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many round creation requests, please try again in 1 hour',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should log security violations with dynamic data', async () => {
    const { roundsScoringRateLimit } = await import('../../../middleware/roundsRateLimit.middleware.js');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';

    const mockReq = {
      ip: chance.ip(),
      get: vi.fn().mockReturnValue(chance.string()),
      originalUrl: `/api/rounds/${chance.guid()}/scores`,
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    // Call the custom handler directly
    roundsScoringRateLimit.config.handler(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many requests, please try again later',
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SECURITY] Rate limit exceeded: rounds_scoring_rate_limit',
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
