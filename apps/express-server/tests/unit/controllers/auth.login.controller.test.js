import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

// Mock bcrypt and jwt BEFORE any imports
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

// Import AFTER mocking
const { default: loginController } = await import('../../../controllers/auth.login.controller.js');

// Import the mocked modules
const bcrypt = await import('bcrypt');
const jwt = await import('jsonwebtoken');

describe('AuthLoginController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // Set up environment variables
    process.env.JWT_SECRET = chance.string({ length: 32 });
    process.env.JWT_REFRESH_SECRET = chance.string({ length: 32 });

    // Clear database mock
    mockDatabase.queryOne.mockClear();
  });

  test('should export a function', () => {
    expect(typeof loginController).toBe('function');
  });

  test('should return 200 status for valid login', async () => {
    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({ length: 10 }),
    };

    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: loginData.username,
      email: chance.email(),
      password_hash: chance.hash(),
      created_at: chance.date().toISOString(),
    };

    const mockAccessToken = chance.string({ length: 50 });
    const mockRefreshToken = chance.string({ length: 50 });

    // Mock the database and crypto operations
    mockDatabase.queryOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true); // This should work now!
    vi.mocked(jwt.default.sign)
      .mockReturnValueOnce(mockAccessToken)
      .mockReturnValueOnce(mockRefreshToken);

    req.body = loginData;

    await loginController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        created_at: mockUser.created_at,
      },
      tokens: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
    });
  });

  test('should handle 401 authentication errors', async () => {
    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({ length: 10 }),
    };

    // Mock user not found
    mockDatabase.queryOne.mockResolvedValue(null);

    req.body = loginData;

    await loginController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid username or password',
    });
  });

  test('should handle validation errors', async () => {
    const loginData = {
      password: chance.string({ length: 10 }), // missing username
    };

    req.body = loginData;

    await loginController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Username is required',
    });
  });

  test('should call next for unexpected errors', async () => {
    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({ length: 10 }),
    };

    // Mock database error
    mockDatabase.queryOne.mockRejectedValue(new Error('Database connection failed'));

    req.body = loginData;

    await loginController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
