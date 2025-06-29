/* eslint-disable no-underscore-dangle */
import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import listBagsService from '../../../services/bags.list.service.js';

const chance = new Chance();

describe('listBagsService', () => {
  test('should export a function', () => {
    expect(typeof listBagsService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await listBagsService(undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should return bags array and total for valid userId', async () => {
    const userId = chance.integer({ min: 1 });
    const mockPrisma = {
      bags: {
        findMany: async () => [],
        count: async () => 0,
      },
    };

    const result = await listBagsService(userId, mockPrisma);

    expect(result).toHaveProperty('bags');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.bags)).toBe(true);
    expect(typeof result.total).toBe('number');
  });

  test('should include disc_count for each bag', async () => {
    const userId = chance.integer({ min: 1 });
    const mockBag = {
      id: chance.guid(),
      name: chance.word(),
      user_id: userId,
      _count: { bag_contents: chance.integer({ min: 0, max: 20 }) },
    };

    const mockPrisma = {
      bags: {
        findMany: async () => [mockBag],
        count: async () => 1,
      },
    };

    const result = await listBagsService(userId, mockPrisma);

    expect(result.bags[0]).toHaveProperty('disc_count');
    expect(result.bags[0].disc_count).toBe(mockBag._count.bag_contents);
  });
});
