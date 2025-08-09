import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

// Mock modules with vi.mock
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

// Dynamic import AFTER mocking
const { default: loginUser } = await import('../../../services/auth.login.service.js');

// Import the mocked modules
const bcrypt = await import('bcrypt');
const jwt = await import('jsonwebtoken');

describe('LoginService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = chance.string({ length: 32 });
    process.env.JWT_REFRESH_SECRET = chance.string({ length: 32 });
  });

  test('should export loginUser function', () => {
    expect(typeof loginUser).toBe('function');
  });

  test('should throw error when username is missing', async () => {
    const loginData = {
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    await expect(loginUser(loginData)).rejects.toThrow('Username is required');
  });

  test('should throw error when password is missing', async () => {
    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
    };

    await expect(loginUser(loginData)).rejects.toThrow('Password is required');
  });

  test('should throw error when user does not exist', async () => {
    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    mockDatabase.queryOne.mockResolvedValue(null);

    await expect(loginUser(loginData)).rejects.toThrow('Invalid username or password');
  });

  test('should throw error when password is incorrect', async () => {
    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: loginData.username,
      email: chance.email(),
      password_hash: chance.hash(),
      created_at: chance.date().toISOString(),
    };

    mockDatabase.queryOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false);

    await expect(loginUser(loginData)).rejects.toThrow('Invalid username or password');
  });

  test('should successfully login with valid credentials', async () => {
    const jwtSecret = chance.string({ length: 32 });
    const jwtRefreshSecret = chance.string({ length: 32 });

    process.env.JWT_SECRET = jwtSecret;
    process.env.JWT_REFRESH_SECRET = jwtRefreshSecret;

    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: loginData.username,
      email: chance.email(),
      password_hash: chance.hash(),
      created_at: chance.date().toISOString(),
      is_admin: false,
    };

    const mockAccessToken = chance.string({ length: 50 });
    const mockRefreshToken = chance.string({ length: 50 });

    // Set up mocks
    mockDatabase.queryOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true); // This SHOULD work!

    vi.mocked(jwt.default.sign)
      .mockReturnValue(mockAccessToken)
      .mockReturnValueOnce(mockAccessToken)
      .mockReturnValueOnce(mockRefreshToken);

    const result = await loginUser(loginData);

    expect(result).toEqual({
      success: true,
      user: {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        created_at: mockUser.created_at,
        is_admin: mockUser.is_admin,
      },
      tokens: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
    });

    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockUser.id, username: mockUser.username, isAdmin: mockUser.is_admin },
      jwtSecret,
      { expiresIn: '15m' },
    );
    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockUser.id },
      jwtRefreshSecret,
      { expiresIn: '14d' },
    );
  });

  test('should convert username to lowercase before database lookup', async () => {
    const mixedCaseUsername = 'TestUser123';
    const loginData = {
      username: mixedCaseUsername,
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: 'testuser123', // Stored as lowercase
      email: chance.email(),
      password_hash: chance.hash(),
      created_at: chance.date().toISOString(),
      is_admin: false,
    };

    const mockAccessToken = chance.string({ length: 50 });
    const mockRefreshToken = chance.string({ length: 50 });

    // Set up mocks
    mockDatabase.queryOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true);
    vi.mocked(jwt.default.sign)
      .mockReturnValueOnce(mockAccessToken)
      .mockReturnValueOnce(mockRefreshToken);

    const result = await loginUser(loginData);

    // Assert that database was queried with lowercase username and includes is_admin field
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, username, email, password_hash, created_at, is_admin FROM users WHERE username = $1',
      ['testuser123'],
    );
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('testuser123');
  });

  test('should successfully login admin user with is_admin true', async () => {
    const jwtSecret = chance.string({ length: 32 });
    const jwtRefreshSecret = chance.string({ length: 32 });

    process.env.JWT_SECRET = jwtSecret;
    process.env.JWT_REFRESH_SECRET = jwtRefreshSecret;

    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    const mockAdminUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: loginData.username,
      email: chance.email(),
      password_hash: chance.hash(),
      created_at: chance.date().toISOString(),
      is_admin: true,
    };

    const mockAccessToken = chance.string({ length: 50 });
    const mockRefreshToken = chance.string({ length: 50 });

    // Set up mocks
    mockDatabase.queryOne.mockResolvedValue(mockAdminUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true);

    vi.mocked(jwt.default.sign)
      .mockReturnValueOnce(mockAccessToken)
      .mockReturnValueOnce(mockRefreshToken);

    const result = await loginUser(loginData);

    expect(result).toEqual({
      success: true,
      user: {
        id: mockAdminUser.id,
        username: mockAdminUser.username,
        email: mockAdminUser.email,
        created_at: mockAdminUser.created_at,
        is_admin: true,
      },
      tokens: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
    });

    // Verify JWT tokens include isAdmin field
    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockAdminUser.id, username: mockAdminUser.username, isAdmin: true },
      jwtSecret,
      { expiresIn: '15m' },
    );
    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockAdminUser.id },
      jwtRefreshSecret,
      { expiresIn: '14d' },
    );
  });

  test('should successfully login regular user with is_admin false', async () => {
    const jwtSecret = chance.string({ length: 32 });
    const jwtRefreshSecret = chance.string({ length: 32 });

    process.env.JWT_SECRET = jwtSecret;
    process.env.JWT_REFRESH_SECRET = jwtRefreshSecret;

    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    const mockRegularUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: loginData.username,
      email: chance.email(),
      password_hash: chance.hash(),
      created_at: chance.date().toISOString(),
      is_admin: false,
    };

    const mockAccessToken = chance.string({ length: 50 });
    const mockRefreshToken = chance.string({ length: 50 });

    // Set up mocks
    mockDatabase.queryOne.mockResolvedValue(mockRegularUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true);

    vi.mocked(jwt.default.sign)
      .mockReturnValueOnce(mockAccessToken)
      .mockReturnValueOnce(mockRefreshToken);

    const result = await loginUser(loginData);

    expect(result).toEqual({
      success: true,
      user: {
        id: mockRegularUser.id,
        username: mockRegularUser.username,
        email: mockRegularUser.email,
        created_at: mockRegularUser.created_at,
        is_admin: false,
      },
      tokens: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
    });

    // Verify JWT tokens include isAdmin field as false
    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockRegularUser.id, username: mockRegularUser.username, isAdmin: false },
      jwtSecret,
      { expiresIn: '15m' },
    );
    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockRegularUser.id },
      jwtRefreshSecret,
      { expiresIn: '14d' },
    );
  });

  test('should query database with is_admin field in SELECT statement', async () => {
    const loginData = {
      username: chance.string({ length: 8, alpha: true }),
      password: chance.string({
        length: 10, alpha: true, numeric: true, symbols: true,
      }),
    };

    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: loginData.username,
      email: chance.email(),
      password_hash: chance.hash(),
      created_at: chance.date().toISOString(),
      is_admin: chance.bool(),
    };

    mockDatabase.queryOne.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true);
    vi.mocked(jwt.default.sign).mockReturnValue(chance.string({ length: 50 }));

    await loginUser(loginData);

    // Assert that database query includes is_admin field
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, username, email, password_hash, created_at, is_admin FROM users WHERE username = $1',
      [loginData.username.toLowerCase()],
    );
  });
});
