import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Create mock functions
const mockFindUnique = vi.fn();
const mockDisconnect = vi.fn();

// Mock Prisma - return the SAME instance
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user_profiles: {
      findUnique: mockFindUnique,
    },
    $disconnect: mockDisconnect,
  })),
}));

// Dynamic import AFTER mocking
const { default: getProfileService } = await import('../../../services/profile.get.service.js');

describe('ProfileGetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    mockFindUnique.mockResolvedValue(null);

    const result = await getProfileService(user);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { user_id: userId },
    });

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
    mockFindUnique.mockResolvedValue(mockProfile);

    const result = await getProfileService(user);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { user_id: userId },
    });

    expect(result).toEqual({
      success: true,
      profile: mockProfile,
    });
  });
});
