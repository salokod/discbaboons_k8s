import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock Prisma update method for later tests
const mockUpdate = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user_profiles: {
      upsert: mockUpdate,
    },
    $disconnect: mockDisconnect,
  })),
}));

const { default: updateProfileService } = await import('../../../services/profile.update.service.js');

describe('updateProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    mockUpdate.mockResolvedValueOnce(updatedProfile);

    const result = await updateProfileService(userId, updateData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { user_id: userId },
      update: updateData,
      create: { user_id: userId, ...updateData },
    });
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
    mockUpdate.mockResolvedValueOnce(createdProfile);

    const result = await updateProfileService(userId, updateData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { user_id: userId },
      update: updateData,
      create: { user_id: userId, ...updateData },
    });
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

    mockUpdate.mockResolvedValueOnce(updatedProfile);

    const result = await updateProfileService(userId, updateData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { user_id: userId },
      update: { name: validName },
      create: { user_id: userId, name: validName },
    });
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

    mockUpdate.mockResolvedValueOnce(updatedProfile);

    const result = await updateProfileService(userId, updateData);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { user_id: userId },
      update: updateData,
      create: { user_id: userId, ...updateData },
    });
    expect(result).toEqual({
      success: true,
      profile: updatedProfile,
    });
  });
});
