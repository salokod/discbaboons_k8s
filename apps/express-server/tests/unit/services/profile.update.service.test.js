import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import updateProfileService from '../../../services/profile.update.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
});

describe('updateProfileService', () => {
  test('should be a function', () => {
    expect(typeof updateProfileService).toBe('function');
  });

  test('should throw ValidationError when userId is missing', async () => {
    await expect(updateProfileService()).rejects.toThrow('User ID is required');
    await expect(updateProfileService(null, {})).rejects.toThrow('User ID is required');
  });

  test('should throw ValidationError when updateData is missing or empty', async () => {
    await expect(updateProfileService(1)).rejects.toThrow('Update data is required');
    await expect(updateProfileService(1, null)).rejects.toThrow('Update data is required');
    await expect(updateProfileService(1, {})).rejects.toThrow('Update data is required');
  });

  test('should update the user profile and return success with profile', async () => {
    const userId = 1;
    const updateData = { bio: 'Updated bio' };
    const updatedProfile = { user_id: userId, bio: 'Updated bio' };

    // Mock the upsert to resolve with updatedProfile
    mockDatabase.queryOne.mockResolvedValueOnce(updatedProfile);

    const result = await updateProfileService(userId, updateData);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `INSERT INTO user_profiles (user_id, bio) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET bio = $2
     RETURNING *`,
      [userId, 'Updated bio'],
    );
    expect(result).toEqual({
      success: true,
      profile: updatedProfile,
    });
  });

  test('should create profile if it does not exist (upsert)', async () => {
    const userId = 999;
    const updateData = { bio: 'New user bio' };
    const createdProfile = { user_id: userId, bio: 'New user bio' };

    // Mock upsert to resolve with created profile
    mockDatabase.queryOne.mockResolvedValueOnce(createdProfile);

    const result = await updateProfileService(userId, updateData);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `INSERT INTO user_profiles (user_id, bio) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET bio = $2
     RETURNING *`,
      [userId, 'New user bio'],
    );
    expect(result).toEqual({
      success: true,
      profile: createdProfile,
    });
  });

  test('should throw ValidationError if updateData contains only invalid fields', async () => {
    const userId = chance.integer({ min: 1 });
    const updateData = { id: chance.integer(), user_id: userId, created_at: new Date() };

    await expect(updateProfileService(userId, updateData)).rejects.toThrow('No valid fields to update');
  });

  test('should ignore invalid fields and update only allowed fields', async () => {
    const userId = chance.integer({ min: 1 });
    const validName = chance.name();
    const updateData = { name: validName, id: chance.integer(), user_id: userId };
    const updatedProfile = { user_id: userId, name: validName };

    mockDatabase.queryOne.mockResolvedValueOnce(updatedProfile);

    const result = await updateProfileService(userId, updateData);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `INSERT INTO user_profiles (user_id, name) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET name = $2
     RETURNING *`,
      [userId, validName],
    );
    expect(result).toEqual({
      success: true,
      profile: updatedProfile,
    });
  });

  test('should update privacy fields', async () => {
    const userId = chance.integer({ min: 1 });
    const updateData = {
      isnamepublic: chance.bool(),
      isbiopublic: chance.bool(),
      islocationpublic: chance.bool(),
    };
    const updatedProfile = { user_id: userId, ...updateData };

    mockDatabase.queryOne.mockResolvedValueOnce(updatedProfile);

    const result = await updateProfileService(userId, updateData);

    const expectedParams = [
      userId, updateData.isnamepublic, updateData.isbiopublic, updateData.islocationpublic,
    ];
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_profiles'),
      expect.arrayContaining(expectedParams),
    );
    expect(result).toEqual({
      success: true,
      profile: updatedProfile,
    });
  });
});
