import {
  describe, test, expect, jest, beforeEach,
} from '@jest/globals';
import Chance from 'chance';

const chance = new Chance();

// Mock bcrypt and jwt BEFORE any imports
const bcryptMock = {
  compare: jest.fn(),
  hash: jest.fn(),
};

const jwtMock = {
  sign: jest.fn(),
  verify: jest.fn(),
};

jest.doMock('bcrypt', () => bcryptMock);
jest.doMock('jsonwebtoken', () => jwtMock);

// Import AFTER mocking
const { mockPrisma } = await import('../setup.js');
const { default: loginController } = await import('../../../controllers/auth.login.controller.js');

describe('AuthLoginController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Set up environment variables
    process.env.JWT_SECRET = chance.string({ length: 32 });
    process.env.JWT_REFRESH_SECRET = chance.string({ length: 32 });
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
    mockPrisma.users.findUnique.mockResolvedValue(mockUser);
    bcryptMock.compare.mockResolvedValue(true); // This should work now!
    jwtMock.sign
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
    mockPrisma.users.findUnique.mockResolvedValue(null);

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
    mockPrisma.users.findUnique.mockRejectedValue(new Error('Database connection failed'));

    req.body = loginData;

    await loginController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
