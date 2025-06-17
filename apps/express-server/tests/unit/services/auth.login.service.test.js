import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

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
const { mockPrisma } = await import('../setup.js');

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

    mockPrisma.users.findUnique.mockResolvedValue(null);

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

    mockPrisma.users.findUnique.mockResolvedValue(mockUser);
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
    };

    const mockAccessToken = chance.string({ length: 50 });
    const mockRefreshToken = chance.string({ length: 50 });

    // Set up mocks
    mockPrisma.users.findUnique.mockResolvedValue(mockUser);
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
      },
      tokens: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
    });

    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockUser.id, username: mockUser.username },
      jwtSecret,
      { expiresIn: '1d' },
    );
    expect(vi.mocked(jwt.default.sign)).toHaveBeenCalledWith(
      { userId: mockUser.id },
      jwtRefreshSecret,
      { expiresIn: '14d' },
    );
  });
});
