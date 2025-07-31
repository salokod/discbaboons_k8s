import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

// Dynamic import AFTER mocking
const { default: authenticateToken } = await import('../../../middleware/auth.middleware.js');

describe('AuthMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    vi.clearAllMocks();
    process.env.JWT_SECRET = chance.string({ length: 32 });
  });

  test('should export authenticateToken function', () => {
    expect(typeof authenticateToken).toBe('function');
  });

  test('should return 401 when no authorization header is provided', () => {
    // No authorization header in req.headers
    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access token required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when authorization header format is invalid', () => {
    // Invalid format - missing "Bearer " prefix
    req.headers.authorization = chance.string();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid authorization header format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when JWT token is invalid', async () => {
    const invalidToken = chance.string();
    req.headers.authorization = `Bearer ${invalidToken}`;

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to throw an error (invalid token)
    jwt.default.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    authenticateToken(req, res, next);

    expect(jwt.default.verify).toHaveBeenCalledWith(
      invalidToken,
      process.env.JWT_SECRET,
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next and add validated user to request when JWT token is valid', async () => {
    const validToken = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const username = chance.word();

    req.headers.authorization = `Bearer ${validToken}`;

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return decoded payload
    jwt.default.verify.mockReturnValue({
      userId,
      username,
    });

    authenticateToken(req, res, next);

    expect(jwt.default.verify).toHaveBeenCalledWith(
      validToken,
      process.env.JWT_SECRET,
    );
    expect(req.user).toEqual({
      userId,
      username,
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should return 401 when JWT payload validation fails', async () => {
    const validToken = chance.string();
    req.headers.authorization = `Bearer ${validToken}`;

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return invalid payload (missing userId)
    jwt.default.verify.mockReturnValue({
      username: 'test',
      // missing userId
    });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Token validation failed'),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when JWT payload has invalid userId format', async () => {
    const validToken = chance.string();
    req.headers.authorization = `Bearer ${validToken}`;

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return payload with invalid userId
    jwt.default.verify.mockReturnValue({
      userId: 0, // Invalid - must be positive
      username: 'test',
    });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Token validation failed'),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
