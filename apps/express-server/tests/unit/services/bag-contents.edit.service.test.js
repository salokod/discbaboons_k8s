import {
  describe, test, expect, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let editBagContentService;

beforeAll(async () => {
  ({ default: editBagContentService } = await import('../../../services/bag-contents.edit.service.js'));
});

describe('editBagContentService', () => {
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

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => null, // Content not found or not owned
      },
    };

    try {
      await editBagContentService(userId, bagId, contentId, updateData, mockPrisma);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/access denied/i);
    }
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
      bags: { user_id: userId },
    };

    const mockUpdatedContent = {
      id: contentId,
      bag_id: bagId,
      ...updateData,
    };

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => mockExistingContent,
        update: async () => mockUpdatedContent,
      },
    };

    const result = await editBagContentService(userId, bagId, contentId, updateData, mockPrisma);

    expect(result).toEqual(mockUpdatedContent);
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
});
