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
    const discCount = chance.integer({ min: 0, max: 20 });
    const mockBag = {
      id: chance.guid(),
      name: chance.word(),
      user_id: userId,
      _count: {
        bag_contents: discCount,
      },
    };

    const mockPrisma = {
      bags: {
        findMany: async () => [mockBag],
        count: async () => 1,
      },
    };

    const result = await listBagsService(userId, mockPrisma);

    expect(result.bags[0]).toHaveProperty('disc_count');
    expect(result.bags[0].disc_count).toBe(discCount);
  });

  test('should call findMany with _count include for bag_contents', async () => {
    const userId = chance.integer({ min: 1 });
    let findManyOptions;

    const mockPrisma = {
      bags: {
        findMany: async (options) => {
          findManyOptions = options;
          return [];
        },
        count: async () => 0,
      },
    };

    await listBagsService(userId, mockPrisma);

    expect(findManyOptions).toEqual({
      where: { user_id: userId },
      include: {
        _count: {
          select: { bag_contents: true },
        },
      },
    });
  });
});
