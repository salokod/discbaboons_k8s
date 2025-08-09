import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

// Dynamic import AFTER mocking
const { default: refreshTokenService } = await import('../../../services/auth.refresh.service.js');

describe('RefreshTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDatabase.queryOne.mockClear();
    process.env.JWT_SECRET = chance.string({ length: 32 });
    process.env.JWT_REFRESH_SECRET = chance.string({ length: 32 });
  });

  test('should export refreshTokenService function', () => {
    expect(typeof refreshTokenService).toBe('function');
  });

  test('should throw ValidationError when no refresh token provided', async () => {
    await expect(refreshTokenService({})).rejects.toThrow('Refresh token is required');
  });

  test('should throw ValidationError when refreshToken is empty', async () => {
    await expect(refreshTokenService({ refreshToken: '' })).rejects.toThrow('Refresh token is required');
  });

  test('should throw ValidationError when refresh token is invalid', async () => {
    const invalidToken = chance.string();

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to throw an error (invalid token)
    jwt.default.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(refreshTokenService({
      refreshToken: invalidToken,
    })).rejects.toThrow('Invalid or expired refresh token');

    expect(jwt.default.verify).toHaveBeenCalledWith(
      invalidToken,
      process.env.JWT_REFRESH_SECRET,
    );
  });

  test('should generate new access token when refresh token is valid', async () => {
    const validRefreshToken = chance.string();
    const newAccessToken = chance.string();
    const newRefreshToken = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const username = chance.word();
    const isAdmin = chance.bool();

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return decoded payload (refresh token only contains userId)
    jwt.default.verify.mockReturnValue({
      userId,
    });

    // Mock database lookup to return user data
    const mockUser = {
      id: userId,
      username,
      is_admin: isAdmin,
    };
    mockDatabase.queryOne.mockResolvedValue(mockUser);

    // Mock JWT sign to return different tokens for each call
    jwt.default.sign
      .mockReturnValueOnce(newAccessToken) // First call - access token
      .mockReturnValueOnce(newRefreshToken); // Second call - refresh token

    const result = await refreshTokenService({
      refreshToken: validRefreshToken,
    });

    expect(result).toEqual({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // Should verify the refresh token
    expect(jwt.default.verify).toHaveBeenCalledWith(
      validRefreshToken,
      process.env.JWT_REFRESH_SECRET,
    );

    // Should query database for user data
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, username, is_admin FROM users WHERE id = $1',
      [userId],
    );

    // Should generate new access token with current user data including admin status
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      1,
      { userId, username, isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Should generate new refresh token
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      2,
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '14d' },
    );
  });

  test('should throw ValidationError when user account no longer exists', async () => {
    const validRefreshToken = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return decoded payload
    jwt.default.verify.mockReturnValue({
      userId,
    });

    // Mock database lookup to return null (user deleted)
    mockDatabase.queryOne.mockResolvedValue(null);

    await expect(refreshTokenService({
      refreshToken: validRefreshToken,
    })).rejects.toThrow('Invalid or expired refresh token');

    // Should verify the refresh token
    expect(jwt.default.verify).toHaveBeenCalledWith(
      validRefreshToken,
      process.env.JWT_REFRESH_SECRET,
    );

    // Should query database for user data
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, username, is_admin FROM users WHERE id = $1',
      [userId],
    );

    // Should not generate new tokens
    expect(jwt.default.sign).not.toHaveBeenCalled();
  });

  test('should generate tokens with current admin status for admin users', async () => {
    const validRefreshToken = chance.string();
    const newAccessToken = chance.string();
    const newRefreshToken = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const username = chance.word();

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return decoded payload
    jwt.default.verify.mockReturnValue({
      userId,
    });

    // Mock database lookup to return admin user
    const mockAdminUser = {
      id: userId,
      username,
      is_admin: true,
    };
    mockDatabase.queryOne.mockResolvedValue(mockAdminUser);

    // Mock JWT sign to return different tokens for each call
    jwt.default.sign
      .mockReturnValueOnce(newAccessToken)
      .mockReturnValueOnce(newRefreshToken);

    const result = await refreshTokenService({
      refreshToken: validRefreshToken,
    });

    expect(result).toEqual({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // Should generate new access token with admin privileges
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      1,
      { userId, username, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Should generate new refresh token
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      2,
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '14d' },
    );
  });

  test('should generate tokens with current admin status for regular users', async () => {
    const validRefreshToken = chance.string();
    const newAccessToken = chance.string();
    const newRefreshToken = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const username = chance.word();

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return decoded payload
    jwt.default.verify.mockReturnValue({
      userId,
    });

    // Mock database lookup to return regular user
    const mockRegularUser = {
      id: userId,
      username,
      is_admin: false,
    };
    mockDatabase.queryOne.mockResolvedValue(mockRegularUser);

    // Mock JWT sign to return different tokens for each call
    jwt.default.sign
      .mockReturnValueOnce(newAccessToken)
      .mockReturnValueOnce(newRefreshToken);

    const result = await refreshTokenService({
      refreshToken: validRefreshToken,
    });

    expect(result).toEqual({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // Should generate new access token without admin privileges
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      1,
      { userId, username, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Should generate new refresh token
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      2,
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '14d' },
    );
  });
});
