import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import createBagService from '../../../services/bags.create.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
});

describe('createBagService', () => {
  test('should export a function', () => {
    expect(typeof createBagService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await createBagService(undefined, { name: chance.word() });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('should throw ValidationError if bag name is missing', async () => {
    try {
      await createBagService(chance.integer({ min: 1 }), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('should throw ValidationError if bag name is not unique for user', async () => {
    const userId = chance.integer({ min: 1 });
    const bagName = chance.word();

    // Mock database to simulate a duplicate bag
    mockDatabase.queryOne.mockResolvedValueOnce({ id: chance.guid() });

    try {
      await createBagService(userId, { name: bagName });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/already exists/i);
    }
  });

  test('should throw ValidationError if bag name is too long', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.string({ length: 101 }),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };
    try {
      await createBagService(userId, bagData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/100 characters or less/i);
    }
  });

  test('should throw ValidationError if description is too long', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.string({ length: 501 }),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };
    try {
      await createBagService(userId, bagData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/500 characters or less/i);
    }
  });

  test('should throw ValidationError if is_public is not boolean', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: 'yes',
      is_friends_visible: chance.bool(),
    };
    try {
      await createBagService(userId, bagData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/is_public must be a boolean/i);
    }
  });

  test('should throw ValidationError if is_friends_visible is not boolean', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: 'no',
    };
    try {
      await createBagService(userId, bagData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/is_friends_visible must be a boolean/i);
    }
  });

  test('should create and return a new bag if all inputs are valid', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };
    const createdBag = {
      id: chance.guid(),
      user_id: userId,
      ...bagData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock database: no duplicate found, then return created bag
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No duplicate bag found
      .mockResolvedValueOnce(createdBag); // Return created bag

    const result = await createBagService(userId, bagData);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, bagData.name],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, bagData.name, bagData.description, bagData.is_public, bagData.is_friends_visible],
    );
    expect(result).toBe(createdBag);
  });
});
