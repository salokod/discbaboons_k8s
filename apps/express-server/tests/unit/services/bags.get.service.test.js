import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import getBagService from '../../../services/bags.get.service.js';

const chance = new Chance();

describe('getBagService', () => {
  test('should export a function', () => {
    expect(typeof getBagService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await getBagService(undefined, chance.guid());
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if bagId is missing', async () => {
    try {
      await getBagService(chance.integer({ min: 1 }), undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bagId is required/i);
    }
  });

  test('should return bag if user owns it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };

    const mockPrisma = {
      bags: {
        findFirst: async () => mockBag,
      },
    };

    const result = await getBagService(userId, bagId, mockPrisma);

    expect(result).toEqual(mockBag);
  });

  test('should return null if bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    const mockPrisma = {
      bags: {
        findFirst: async () => null, // Bag not found or not owned
      },
    };

    const result = await getBagService(userId, bagId, mockPrisma);

    expect(result).toBeNull();
  });

  test('should return null if bagId is not a valid UUID format', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidBagId = 'badBagId'; // Invalid UUID format

    // Mock should not be called since we return early for invalid UUID
    const mockPrisma = {
      bags: {
        findFirst: async () => {
          throw new Error('Should not reach Prisma for invalid UUID');
        },
      },
    };

    const result = await getBagService(userId, invalidBagId, mockPrisma);

    expect(result).toBeNull();
  });
});
