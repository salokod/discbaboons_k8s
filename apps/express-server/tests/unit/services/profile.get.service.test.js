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

  test('should create default profile when user has no profile', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const user = { userId, username: chance.word() };
    const mockCreatedProfile = {
      id: chance.integer({ min: 1, max: 1000 }),
      user_id: userId,
      name: null,
      country: null,
      state_province: null,
      city: null,
      bio: null,
      isnamepublic: false,
      isbiopublic: false,
      islocationpublic: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // First call: no profile found, second call: return created profile
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // First query finds no profile
      .mockResolvedValueOnce(mockCreatedProfile); // INSERT returns created profile

    const result = await getProfileService(user);

    // Should call SELECT first, then INSERT
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      1,
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId],
    );

    // Check the INSERT query
    const insertCall = mockDatabase.queryOne.mock.calls[1];
    expect(insertCall[0]).toContain('INSERT INTO user_profiles');
    expect(insertCall[0]).toContain('RETURNING *');
    expect(insertCall[1]).toEqual([userId]);

    expect(result).toEqual({
      success: true,
      profile: expect.objectContaining({
        user_id: userId,
        name: null,
        bio: null,
        isnamepublic: false,
        isbiopublic: false,
        islocationpublic: false,
      }),
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
      profile: {
        user_id: mockProfile.user_id,
        name: mockProfile.name,
        country: mockProfile.country,
        state_province: mockProfile.state_province,
        city: mockProfile.city,
        bio: mockProfile.bio,
      },
    });
  });

  test('should filter out internal database fields from response', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const user = { userId, username: chance.word() };
    const mockProfile = {
      id: chance.integer({ min: 1, max: 1000 }), // Internal field
      user_id: userId,
      name: chance.name(),
      country: chance.country({ full: true }),
      state_province: chance.state(),
      city: chance.city(),
      bio: chance.sentence(),
      isnamepublic: true,
      isbiopublic: true,
      islocationpublic: true,
      created_at: new Date(), // Internal field
      updated_at: new Date(), // Internal field
    };

    mockDatabase.queryOne.mockResolvedValue(mockProfile);

    const result = await getProfileService(user);

    // Should not include internal fields
    expect(result.profile).not.toHaveProperty('id');
    expect(result.profile).not.toHaveProperty('created_at');
    expect(result.profile).not.toHaveProperty('updated_at');

    // Should include user-facing fields
    expect(result.profile).toHaveProperty('user_id');
    expect(result.profile).toHaveProperty('name');
    expect(result.profile).toHaveProperty('bio');
    expect(result.profile).toHaveProperty('country');
    expect(result.profile).toHaveProperty('state_province');
    expect(result.profile).toHaveProperty('city');
    expect(result.profile).toHaveProperty('isnamepublic');
    expect(result.profile).toHaveProperty('isbiopublic');
    expect(result.profile).toHaveProperty('islocationpublic');
  });
});
