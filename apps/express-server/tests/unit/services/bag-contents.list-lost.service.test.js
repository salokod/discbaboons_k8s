import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import listLostDiscsService from '../../../services/bag-contents.list-lost.service.js';

const chance = new Chance();

describe('listLostDiscsService', () => {
  test('should export a function', () => {
    expect(typeof listLostDiscsService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await listLostDiscsService(undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should return lost discs for user with default options', async () => {
    const userId = chance.integer({ min: 1 });
    const mockLostDiscs = [
      {
        id: chance.guid(),
        user_id: userId,
        disc_id: chance.guid(),
        is_lost: true,
        lost_notes: chance.sentence(),
        lost_at: new Date(),
        disc_master: {
          brand: chance.company(),
          model: chance.word(),
          speed: chance.integer({ min: 1, max: 15 }),
          glide: chance.integer({ min: 1, max: 7 }),
          turn: chance.integer({ min: -5, max: 2 }),
          fade: chance.integer({ min: 0, max: 5 }),
        },
      },
    ];

    const mockPrisma = {
      bag_contents: {
        findMany: async (query) => {
          expect(query.where.user_id).toBe(userId);
          expect(query.where.is_lost).toBe(true);
          expect(query.include.disc_master).toBe(true);
          return mockLostDiscs;
        },
      },
    };

    const result = await listLostDiscsService(userId, {}, mockPrisma);

    const expectedDisc = {
      ...mockLostDiscs[0],
      speed: mockLostDiscs[0].disc_master.speed,
      glide: mockLostDiscs[0].disc_master.glide,
      turn: mockLostDiscs[0].disc_master.turn,
      fade: mockLostDiscs[0].disc_master.fade,
      brand: mockLostDiscs[0].disc_master.brand,
      model: mockLostDiscs[0].disc_master.model,
    };

    expect(result).toEqual({
      lost_discs: [expectedDisc],
      pagination: {
        total: 1,
        limit: 30,
        offset: 0,
        has_more: false,
      },
    });
  });

  test('should merge custom flight numbers and disc names with disc_master fallbacks', async () => {
    const userId = chance.integer({ min: 1 });
    const customSpeed = chance.integer({ min: 1, max: 15 });
    const customTurn = chance.integer({ min: -5, max: 2 });
    const customBrand = chance.company();
    const stockGlide = chance.integer({ min: 1, max: 7 });
    const stockFade = chance.integer({ min: 0, max: 5 });
    const stockModel = chance.word();

    const mockLostDiscs = [
      {
        id: chance.guid(),
        user_id: userId,
        speed: customSpeed, // Custom override
        glide: null, // Use disc_master fallback
        turn: customTurn, // Custom override
        fade: null, // Use disc_master fallback
        brand: customBrand, // Custom override
        model: null, // Use disc_master fallback
        disc_master: {
          speed: chance.integer({ min: 1, max: 15 }), // Should be overridden
          glide: stockGlide, // Should be used
          turn: chance.integer({ min: -5, max: 2 }), // Should be overridden
          fade: stockFade, // Should be used
          brand: chance.company(), // Should be overridden
          model: stockModel, // Should be used
        },
      },
    ];

    const mockPrisma = {
      bag_contents: {
        findMany: async () => mockLostDiscs,
      },
    };

    const result = await listLostDiscsService(userId, {}, mockPrisma);

    const mergedDisc = result.lost_discs[0];
    expect(mergedDisc.speed).toBe(customSpeed); // Custom used
    expect(mergedDisc.glide).toBe(stockGlide); // Fallback used
    expect(mergedDisc.turn).toBe(customTurn); // Custom used
    expect(mergedDisc.fade).toBe(stockFade); // Fallback used
    expect(mergedDisc.brand).toBe(customBrand); // Custom used
    expect(mergedDisc.model).toBe(stockModel); // Fallback used
  });

  test('should handle custom pagination options', async () => {
    const userId = chance.integer({ min: 1 });
    const customLimit = chance.integer({ min: 5, max: 50 });
    const customOffset = chance.integer({ min: 0, max: 100 });

    const mockPrisma = {
      bag_contents: {
        findMany: async (query) => {
          expect(query.take).toBe(customLimit);
          expect(query.skip).toBe(customOffset);
          expect(query.where.user_id).toBe(userId);
          expect(query.where.is_lost).toBe(true);
          return [];
        },
      },
    };

    const options = { limit: customLimit, offset: customOffset };
    const result = await listLostDiscsService(userId, options, mockPrisma);

    expect(result.pagination.limit).toBe(customLimit);
    expect(result.pagination.offset).toBe(customOffset);
  });

  test('should handle custom sorting options', async () => {
    const userId = chance.integer({ min: 1 });
    const sortField = 'lost_at';
    const sortOrder = 'asc';

    const mockPrisma = {
      bag_contents: {
        findMany: async (query) => {
          expect(query.orderBy).toEqual({
            [sortField]: sortOrder,
          });
          expect(query.where.user_id).toBe(userId);
          expect(query.where.is_lost).toBe(true);
          return [];
        },
      },
    };

    const options = { sort: sortField, order: sortOrder };
    const result = await listLostDiscsService(userId, options, mockPrisma);

    expect(result.lost_discs).toEqual([]);
  });

  test('should return empty results when user has no lost discs', async () => {
    const userId = chance.integer({ min: 1 });

    const mockPrisma = {
      bag_contents: {
        findMany: async (query) => {
          expect(query.where.user_id).toBe(userId);
          expect(query.where.is_lost).toBe(true);
          return [];
        },
      },
    };

    const result = await listLostDiscsService(userId, {}, mockPrisma);

    expect(result).toEqual({
      lost_discs: [],
      pagination: {
        total: 0,
        limit: 30,
        offset: 0,
        has_more: false,
      },
    });
  });

  test('should set has_more flag correctly based on result count', async () => {
    const userId = chance.integer({ min: 1 });
    const limit = 5;

    // Mock exactly limit number of results (should set has_more: true)
    const mockLostDiscs = Array.from({ length: limit }, () => ({
      id: chance.guid(),
      user_id: userId,
      disc_id: chance.guid(),
      is_lost: true,
      lost_notes: chance.sentence(),
      lost_at: new Date(),
      disc_master: {
        brand: chance.company(),
        model: chance.word(),
        speed: chance.integer({ min: 1, max: 15 }),
        glide: chance.integer({ min: 1, max: 7 }),
        turn: chance.integer({ min: -5, max: 2 }),
        fade: chance.integer({ min: 0, max: 5 }),
      },
    }));

    const mockPrisma = {
      bag_contents: {
        findMany: async () => mockLostDiscs,
      },
    };

    const result = await listLostDiscsService(userId, { limit }, mockPrisma);

    expect(result.pagination.has_more).toBe(true);
    expect(result.pagination.total).toBe(limit);
  });
});
