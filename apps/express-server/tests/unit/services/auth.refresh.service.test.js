import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

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

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return decoded payload
    jwt.default.verify.mockReturnValue({
      userId,
      username,
    });

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
      // Remove the confusing expiresIn field
    });

    // Should verify the refresh token
    expect(jwt.default.verify).toHaveBeenCalledWith(
      validRefreshToken,
      process.env.JWT_REFRESH_SECRET,
    );

    // Should generate new access token
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      1,
      { userId, username },
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

  test('should generate new refresh token for token rotation', async () => {
    const validRefreshToken = chance.string();
    const newAccessToken = chance.string();
    const newRefreshToken = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const username = chance.word();

    const jwt = await import('jsonwebtoken');

    // Mock JWT verify to return decoded payload
    jwt.default.verify.mockReturnValue({
      userId,
      username,
    });

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
      // Remove the confusing expiresIn field
    });

    // Should generate new access token
    expect(jwt.default.sign).toHaveBeenNthCalledWith(
      1,
      { userId, username },
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
