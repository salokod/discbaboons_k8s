import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import changePasswordService from '../../../services/auth.changepassword.service.js';

const chance = new Chance();

// Mock Redis
vi.mock('../../../lib/redis.js', () => ({
  default: {
    get: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$10$mocked.hash.value.here'),
  },
}));

describe('ChangePasswordService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockDatabase.queryOne.mockClear();
    mockDatabase.query.mockClear();
  });

  test('should throw ValidationError when no data provided', async () => {
    await expect(changePasswordService({})).rejects.toThrow('Reset code, new password, and username or email are required');
  });

  test('should throw ValidationError when missing reset code', async () => {
    await expect(changePasswordService({
      newPassword: chance.string(),
      username: chance.word(),
    })).rejects.toThrow('Reset code, new password, and username or email are required');
  });

  test('should throw ValidationError when missing new password', async () => {
    await expect(changePasswordService({
      resetCode: chance.string(),
      username: chance.word(),
    })).rejects.toThrow('Reset code, new password, and username or email are required');
  });

  test('should throw ValidationError when missing username and email', async () => {
    await expect(changePasswordService({
      resetCode: chance.string(),
      newPassword: chance.string(),
    })).rejects.toThrow('Reset code, new password, and username or email are required');
  });

  test('should throw ValidationError for invalid email format', async () => {
    await expect(changePasswordService({
      resetCode: chance.string(),
      newPassword: chance.string(),
      email: chance.word(), // Invalid email format
    })).rejects.toThrow('Invalid email format');
  });

  test('should lookup reset token in Redis when user exists', async () => {
    const resetCode = chance.string();
    const username = chance.word();
    const newPassword = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock user exists in database
    const mockUser = {
      id: userId,
      username,
      email: chance.email(),
    };
    mockDatabase.queryOne.mockResolvedValue(mockUser);

    const { default: redis } = await import('../../../lib/redis.js');

    // Mock Redis to return null (no matching token found)
    redis.get.mockResolvedValue(null);

    await expect(changePasswordService({
      resetCode,
      newPassword,
      username,
    })).rejects.toThrow('Invalid or expired reset code');

    // Should have looked up the user
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE username = $1',
      [username],
    );

    // Should have attempted to look up the token in Redis
    expect(redis.get).toHaveBeenCalledWith(`password_reset:${userId}`);
  });

  test('should hash password and update user when valid token provided', async () => {
    const resetCode = chance.string();
    const username = chance.word();
    const newPassword = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const hashedPassword = chance.string({ length: 60 }); // Realistic bcrypt hash length

    // Mock user exists in database
    const mockUser = {
      id: userId,
      username,
      email: chance.email(),
    };
    mockDatabase.queryOne.mockResolvedValue(mockUser);
    mockDatabase.query.mockResolvedValue();

    const { default: redis } = await import('../../../lib/redis.js');
    const bcrypt = await import('bcrypt');

    // Mock Redis to return matching token
    redis.get.mockResolvedValue(resetCode);

    // Mock bcrypt to return our chance-generated hash
    bcrypt.default.hash.mockResolvedValue(hashedPassword);

    await changePasswordService({
      resetCode,
      newPassword,
      username,
    });

    // Should hash the new password
    expect(bcrypt.default.hash).toHaveBeenCalledWith(newPassword, 10);

    // Should update user's password in database
    expect(mockDatabase.query).toHaveBeenCalledWith(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId],
    );
  });

  test('should delete reset token from Redis after successful password change', async () => {
    const resetCode = chance.string();
    const username = chance.word();
    const newPassword = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const hashedPassword = chance.string({ length: 60 });

    // Mock user exists in database
    const mockUser = {
      id: userId,
      username,
      email: chance.email(),
    };
    mockDatabase.queryOne.mockResolvedValue(mockUser);
    mockDatabase.query.mockResolvedValue();

    const { default: redis } = await import('../../../lib/redis.js');
    const bcrypt = await import('bcrypt');

    // Mock Redis to return matching token
    redis.get.mockResolvedValue(resetCode);
    bcrypt.default.hash.mockResolvedValue(hashedPassword);

    await changePasswordService({
      resetCode,
      newPassword,
      username,
    });

    // Should delete the token from Redis after successful change
    expect(redis.del).toHaveBeenCalledWith(`password_reset:${userId}`);
  });

  test('should return success message after password change', async () => {
    const resetCode = chance.string();
    const username = chance.word();
    const newPassword = chance.string();
    const userId = chance.integer({ min: 1, max: 1000 });
    const hashedPassword = chance.string({ length: 60 });

    // Mock user exists in database
    const mockUser = {
      id: userId,
      username,
      email: chance.email(),
    };
    mockDatabase.queryOne.mockResolvedValue(mockUser);
    mockDatabase.query.mockResolvedValue();

    const { default: redis } = await import('../../../lib/redis.js');
    const bcrypt = await import('bcrypt');

    // Mock Redis to return matching token
    redis.get.mockResolvedValue(resetCode);
    bcrypt.default.hash.mockResolvedValue(hashedPassword);

    const result = await changePasswordService({
      resetCode,
      newPassword,
      username,
    });

    expect(result).toEqual({
      success: true,
      message: 'Password has been successfully changed.',
    });
  });
});
