import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import getProfileService from '../../../services/profile.get.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
});

describe('ProfileGetService', () => {
  test('should export a function', () => {
    expect(typeof getProfileService).toBe('function');
  });

  test('should throw ValidationError when user object is missing', async () => {
    await expect(getProfileService()).rejects.toThrow('User ID is required');
    await expect(getProfileService(null)).rejects.toThrow('User ID is required');
    await expect(getProfileService({})).rejects.toThrow('User ID is required');
  });

  test('should return null when user has no profile', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const user = { userId, username: chance.word() };

    // Mock: no profile found
    mockDatabase.queryOne.mockResolvedValue(null);

    const result = await getProfileService(user);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId],
    );

    expect(result).toEqual({
      success: true,
      profile: null,
    });
  });

  test('should return profile data when user has a profile', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const user = { userId, username: chance.word() };
    const mockProfile = {
      id: chance.integer({ min: 1, max: 1000 }),
      user_id: userId,
      name: chance.name(),
      country: chance.country({ full: true }),
      state_province: chance.state(),
      city: chance.city(),
      bio: chance.sentence(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock: profile found
    mockDatabase.queryOne.mockResolvedValue(mockProfile);

    const result = await getProfileService(user);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId],
    );

    expect(result).toEqual({
      success: true,
      profile: mockProfile,
    });
  });
});
