import {
  describe, test, expect, beforeAll, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

let editBagContentService;

beforeAll(async () => {
  ({ default: editBagContentService } = await import('../../../services/bag-contents.edit.service.js'));
});

describe('editBagContentService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDatabase.queryOne.mockReset();
  });
  test('should export a function', () => {
    expect(typeof editBagContentService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await editBagContentService(undefined, chance.guid(), chance.guid(), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if bagId is missing', async () => {
    try {
      await editBagContentService(chance.integer({ min: 1 }), undefined, chance.guid(), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bagId is required/i);
    }
  });

  test('should throw ValidationError if contentId is missing', async () => {
    try {
      await editBagContentService(chance.integer({ min: 1 }), chance.guid(), undefined, {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/contentId is required/i);
    }
  });

  test('should throw ValidationError if updateData is missing', async () => {
    try {
      await editBagContentService(
        chance.integer({ min: 1 }),
        chance.guid(),
        chance.guid(),
        undefined,
      );
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/updateData is required/i);
    }
  });

  test('should throw AuthorizationError if user does not own the bag containing the content', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { notes: chance.sentence() };

    // Mock queryOne to return null (content not found or not owned)
    mockDatabase.queryOne.mockResolvedValue(null);

    try {
      await editBagContentService(userId, bagId, contentId, updateData, mockDatabase);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/access denied/i);
    }

    // Verify the database call was made
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT bc.*, b.user_id as bag_user_id, b.name, b.created_at as bag_created_at, b.updated_at as bag_updated_at
     FROM bag_contents bc
     JOIN bags b ON bc.bag_id = b.id
     WHERE bc.id = $1 AND bc.bag_id = $2 AND b.user_id = $3`,
      [contentId, bagId, userId],
    );
  });

  test('should successfully update bag content and return updated content', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = {
      notes: chance.sentence(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
      condition: chance.pickone(['new', 'good', 'worn', 'beat-in']),
      plastic_type: chance.word(),
      color: chance.color({ format: 'name' }),
      speed: chance.integer({ min: 1, max: 15 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };

    const mockExistingContent = {
      id: contentId,
      bag_id: bagId,
      user_id: userId,
      disc_master_id: chance.guid(),
      bag_user_id: userId,
      name: chance.word(),
      bag_created_at: new Date(),
      bag_updated_at: new Date(),
    };

    const mockUpdatedContent = {
      id: contentId,
      bag_id: bagId,
      user_id: userId,
      disc_master_id: chance.guid(),
      ...updateData,
      updated_at: new Date(),
    };

    // Mock the sequence of database calls
    mockDatabase.queryOne
      .mockResolvedValueOnce(mockExistingContent) // First call: find existing content
      .mockResolvedValueOnce(mockUpdatedContent); // Second call: update content

    const result = await editBagContentService(userId, bagId, contentId, updateData, mockDatabase);

    expect(result).toEqual(mockUpdatedContent);

    // Verify the database calls
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      1,
      `SELECT bc.*, b.user_id as bag_user_id, b.name, b.created_at as bag_created_at, b.updated_at as bag_updated_at
     FROM bag_contents bc
     JOIN bags b ON bc.bag_id = b.id
     WHERE bc.id = $1 AND bc.bag_id = $2 AND b.user_id = $3`,
      [contentId, bagId, userId],
    );

    // Verify update call has correct structure
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^UPDATE bag_contents/),
      expect.arrayContaining([
        ...Object.values(updateData),
        expect.any(Date), // updated_at
        contentId, // WHERE clause
      ]),
    );
  });

  test('should throw ValidationError if speed is less than 1', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { speed: 0 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/speed must be between 1 and 15/i);
    }
  });

  test('should throw ValidationError if speed is greater than 15', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { speed: 16 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/speed must be between 1 and 15/i);
    }
  });

  test('should throw ValidationError if glide is less than 1', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { glide: 0 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/glide must be between 1 and 7/i);
    }
  });

  test('should throw ValidationError if glide is greater than 7', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { glide: 8 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/glide must be between 1 and 7/i);
    }
  });

  test('should throw ValidationError if turn is less than -5', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { turn: -6 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/turn must be between -5 and 2/i);
    }
  });

  test('should throw ValidationError if turn is greater than 2', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { turn: 3 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/turn must be between -5 and 2/i);
    }
  });

  test('should throw ValidationError if fade is less than 0', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { fade: -1 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/fade must be between 0 and 5/i);
    }
  });

  test('should throw ValidationError if fade is greater than 5', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { fade: 6 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/fade must be between 0 and 5/i);
    }
  });

  test('should throw ValidationError if brand exceeds 50 characters', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { brand: 'a'.repeat(51) };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/brand must be a string with maximum 50 characters/i);
    }
  });

  test('should throw ValidationError if model exceeds 50 characters', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { model: 'b'.repeat(51) };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/model must be a string with maximum 50 characters/i);
    }
  });

  test('should throw ValidationError if brand is not a string', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const contentId = chance.guid();
    const updateData = { brand: 123 };

    try {
      await editBagContentService(userId, bagId, contentId, updateData);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/brand must be a string with maximum 50 characters/i);
    }
  });
});
