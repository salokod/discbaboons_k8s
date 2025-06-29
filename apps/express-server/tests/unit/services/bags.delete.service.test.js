import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import deleteBagService from '../../../services/bags.delete.service.js';

const chance = new Chance();

describe('deleteBagService', () => {
  test('should export a function', () => {
    expect(typeof deleteBagService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await deleteBagService(undefined, chance.guid());
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if bagId is missing', async () => {
    try {
      await deleteBagService(chance.integer({ min: 1 }), undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bagId is required/i);
    }
  });

  test('should return null if bagId is not a valid UUID format', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidBagId = 'invalidUUID';

    const result = await deleteBagService(userId, invalidBagId);

    expect(result).toBeNull();
  });

  test('should delete bag if user owns it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    const mockPrisma = {
      bags: {
        deleteMany: async () => ({ count: 1 }),
      },
    };

    const result = await deleteBagService(userId, bagId, mockPrisma);

    expect(result).toBe(true);
  });

  test('should return null if bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    const mockPrisma = {
      bags: {
        deleteMany: async () => ({ count: 0 }), // No rows deleted
      },
    };

    const result = await deleteBagService(userId, bagId, mockPrisma);

    expect(result).toBeNull();
  });
});
