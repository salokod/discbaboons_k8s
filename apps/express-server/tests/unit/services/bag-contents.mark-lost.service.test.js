import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import markDiscLostService from '../../../services/bag-contents.mark-lost.service.js';

const chance = new Chance();

describe('markDiscLostService', () => {
  test('should export a function', () => {
    expect(typeof markDiscLostService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await markDiscLostService(undefined, chance.guid(), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if bagContentId is missing', async () => {
    try {
      await markDiscLostService(chance.integer({ min: 1 }), undefined, {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bagContentId is required/i);
    }
  });

  test('should return null if bagContentId is not a valid UUID format', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidBagContentId = 'invalidUUID';

    const result = await markDiscLostService(userId, invalidBagContentId, {});

    expect(result).toBeNull();
  });

  test('should throw ValidationError if lostData is missing', async () => {
    try {
      await markDiscLostService(chance.integer({ min: 1 }), chance.guid(), undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/lostData is required/i);
    }
  });

  test('should throw ValidationError if is_lost is missing from lostData', async () => {
    try {
      await markDiscLostService(chance.integer({ min: 1 }), chance.guid(), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/is_lost is required/i);
    }
  });

  test('should return null if bag content does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => null, // Not found or not owned
      },
    };

    const result = await markDiscLostService(userId, bagContentId, { is_lost: true }, mockPrisma);

    expect(result).toBeNull();
  });

  test('should mark disc as lost with notes and automatic date', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const lostNotes = chance.sentence();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      is_lost: false,
    };
    const updatedBagContent = {
      id: bagContentId,
      user_id: userId,
      is_lost: true,
      lost_notes: lostNotes,
      lost_at: new Date(),
    };

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => mockBagContent,
        update: async (options) => {
          expect(options.where.id).toBe(bagContentId);
          expect(options.data.is_lost).toBe(true);
          expect(options.data.lost_notes).toBe(lostNotes);
          expect(options.data.lost_at).toBeInstanceOf(Date);
          expect(options.data.updated_at).toBeInstanceOf(Date);
          return updatedBagContent;
        },
      },
    };

    const result = await markDiscLostService(userId, bagContentId, {
      is_lost: true,
      lost_notes: lostNotes,
    }, mockPrisma);

    expect(result).toEqual(updatedBagContent);
  });

  test('should mark disc as found and clear lost data', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      is_lost: true,
      lost_notes: 'prospect park hole 12',
      lost_at: new Date('2024-01-15'),
    };
    const updatedBagContent = {
      id: bagContentId,
      user_id: userId,
      is_lost: false,
      lost_notes: null,
      lost_at: null,
    };

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => mockBagContent,
        update: async (options) => {
          expect(options.where.id).toBe(bagContentId);
          expect(options.data.is_lost).toBe(false);
          expect(options.data.lost_notes).toBeNull();
          expect(options.data.lost_at).toBeNull();
          expect(options.data.updated_at).toBeInstanceOf(Date);
          return updatedBagContent;
        },
      },
    };

    const result = await markDiscLostService(userId, bagContentId, {
      is_lost: false,
    }, mockPrisma);

    expect(result).toEqual(updatedBagContent);
  });
});
