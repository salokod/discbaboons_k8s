import {
  describe, test, expect, beforeAll, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

let updateBagService;

beforeAll(async () => {
  ({ default: updateBagService } = await import('../../../services/bags.update.service.js'));
});

beforeEach(() => {
  mockDatabase.query.mockClear();
  mockDatabase.queryOne.mockClear();
});

describe('updateBagService', () => {
  test('should export a function', () => {
    expect(typeof updateBagService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await updateBagService(undefined, chance.guid(), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if bagId is missing', async () => {
    try {
      await updateBagService(chance.integer({ min: 1 }), undefined, {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bagId is required/i);
    }
  });

  test('should return null if bagId is not a valid UUID format', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidBagId = 'invalidUUID';

    const result = await updateBagService(userId, invalidBagId, {});

    expect(result).toBeNull();
  });

  test('should throw ValidationError if updateData is missing', async () => {
    try {
      await updateBagService(chance.integer({ min: 1 }), chance.guid(), undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/updateData is required/i);
    }
  });

  test('should throw ValidationError if updateData is empty object', async () => {
    try {
      await updateBagService(chance.integer({ min: 1 }), chance.guid(), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/updateData is required/i);
    }
  });

  test('should update bag if user owns it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const updateData = {
      name: chance.word(),
      description: chance.sentence(),
    };
    const updatedBag = {
      id: bagId,
      user_id: userId,
      ...updateData,
      is_public: false,
      is_friends_visible: true,
    };

    // Mock successful update (1 row affected) and bag retrieval
    mockDatabase.query.mockResolvedValue({ rowCount: 1 });
    mockDatabase.queryOne.mockResolvedValue(updatedBag);

    const result = await updateBagService(userId, bagId, updateData);

    expect(result).toEqual(updatedBag);
    expect(mockDatabase.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE bags SET'),
      expect.arrayContaining([userId, bagId]),
    );
  });

  test('should return null if bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const updateData = {
      name: chance.word(),
    };

    // Mock failed update (0 rows affected)
    mockDatabase.query.mockResolvedValue({ rowCount: 0 });

    const result = await updateBagService(userId, bagId, updateData);

    expect(result).toBeNull();
  });
});
