import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import markDiscLostService from '../../../services/bag-contents.mark-lost.service.js';

const chance = new Chance();

describe('markDiscLostService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDatabase.queryOne.mockReset();
  });
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

    // Mock queryOne to return null (not found or not owned)
    mockDatabase.queryOne.mockResolvedValue(null);

    const result = await markDiscLostService(userId, bagContentId, { is_lost: true }, mockDatabase);

    expect(result).toBeNull();
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT id, user_id, bag_id, speed, glide, turn, fade, brand, model, is_lost, lost_notes, lost_at
     FROM bag_contents 
     WHERE id = $1 AND user_id = $2`,
      [bagContentId, userId],
    );
  });

  test('should mark disc as lost with notes and automatic date', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const lostNotes = chance.sentence();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      is_lost: false,
      speed: chance.integer({ min: 1, max: 15 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      brand: chance.company(),
      model: chance.word(),
    };
    const updatedBagContent = {
      id: bagContentId,
      user_id: userId,
      is_lost: true,
      lost_notes: lostNotes,
      lost_at: new Date(),
      bag_id: null,
    };

    // Mock the sequence of database calls
    mockDatabase.queryOne
      .mockResolvedValueOnce(mockBagContent) // First call: find bag content
      .mockResolvedValueOnce(updatedBagContent); // Second call: update bag content

    const result = await markDiscLostService(userId, bagContentId, {
      is_lost: true,
      lost_notes: lostNotes,
    }, mockDatabase);

    expect(result).toEqual(updatedBagContent);

    // Verify the database calls
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      1,
      `SELECT id, user_id, bag_id, speed, glide, turn, fade, brand, model, is_lost, lost_notes, lost_at
     FROM bag_contents 
     WHERE id = $1 AND user_id = $2`,
      [bagContentId, userId],
    );
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      `UPDATE bag_contents 
       SET is_lost = $1, bag_id = NULL, lost_notes = $2, lost_at = $3, updated_at = $4,
           speed = $5, glide = $6, turn = $7, fade = $8, brand = $9, model = $10
       WHERE id = $11
       RETURNING *`,
      [
        true,
        lostNotes,
        expect.any(Date),
        expect.any(Date),
        mockBagContent.speed,
        mockBagContent.glide,
        mockBagContent.turn,
        mockBagContent.fade,
        mockBagContent.brand,
        mockBagContent.model,
        bagContentId,
      ],
    );
  });

  test('should mark disc as found and clear lost data', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const targetBagId = chance.guid();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      is_lost: true,
      lost_notes: 'prospect park hole 12',
      lost_at: new Date('2024-01-15'),
      speed: chance.integer({ min: 1, max: 15 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      brand: chance.company(),
      model: chance.word(),
    };
    const mockTargetBag = {
      id: targetBagId,
      user_id: userId,
      name: 'Target Bag',
    };
    const updatedBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: targetBagId,
      is_lost: false,
      lost_notes: null,
      lost_at: null,
    };

    // Mock the sequence of database calls
    mockDatabase.queryOne
      .mockResolvedValueOnce(mockBagContent) // First call: find bag content
      .mockResolvedValueOnce(mockTargetBag) // Second call: validate target bag
      .mockResolvedValueOnce(updatedBagContent); // Third call: update bag content

    const result = await markDiscLostService(userId, bagContentId, {
      is_lost: false,
      bag_id: targetBagId,
    }, mockDatabase);

    expect(result).toEqual(updatedBagContent);

    // Verify the database calls
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(3);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      1,
      `SELECT id, user_id, bag_id, speed, glide, turn, fade, brand, model, is_lost, lost_notes, lost_at
     FROM bag_contents 
     WHERE id = $1 AND user_id = $2`,
      [bagContentId, userId],
    );
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      `SELECT id, user_id, name 
       FROM bags 
       WHERE id = $1 AND user_id = $2`,
      [targetBagId, userId],
    );
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      3,
      `UPDATE bag_contents 
       SET is_lost = $1, bag_id = $2, lost_notes = NULL, lost_at = NULL, updated_at = $3,
           speed = $4, glide = $5, turn = $6, fade = $7, brand = $8, model = $9
       WHERE id = $10
       RETURNING *`,
      [
        false,
        targetBagId,
        expect.any(Date),
        mockBagContent.speed,
        mockBagContent.glide,
        mockBagContent.turn,
        mockBagContent.fade,
        mockBagContent.brand,
        mockBagContent.model,
        bagContentId,
      ],
    );
  });

  test('should remove disc from bag when marking as lost', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: chance.guid(), // Currently in a bag
      is_lost: false,
      speed: 5,
      glide: 5,
      turn: 0,
      fade: 2,
      brand: 'Innova',
      model: 'Champion Leopard3',
    };
    const updatedBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: null, // Removed from bag
      is_lost: true,
      lost_notes: null,
      lost_at: new Date(),
    };

    // Mock the sequence of database calls
    mockDatabase.queryOne
      .mockResolvedValueOnce(mockBagContent) // First call: find bag content
      .mockResolvedValueOnce(updatedBagContent); // Second call: update bag content

    const result = await markDiscLostService(userId, bagContentId, {
      is_lost: true,
    }, mockDatabase);

    expect(result).toEqual(updatedBagContent);

    // Verify the database calls
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      `UPDATE bag_contents 
       SET is_lost = $1, bag_id = NULL, lost_notes = $2, lost_at = $3, updated_at = $4,
           speed = $5, glide = $6, turn = $7, fade = $8, brand = $9, model = $10
       WHERE id = $11
       RETURNING *`,
      [
        true,
        null,
        expect.any(Date),
        expect.any(Date),
        mockBagContent.speed,
        mockBagContent.glide,
        mockBagContent.turn,
        mockBagContent.fade,
        mockBagContent.brand,
        mockBagContent.model,
        bagContentId,
      ],
    );
  });

  test('should throw ValidationError when marking as found without bag_id', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: null, // Currently lost
      is_lost: true,
    };

    // Mock queryOne to return the bag content on first call
    mockDatabase.queryOne.mockResolvedValueOnce(mockBagContent);

    try {
      await markDiscLostService(userId, bagContentId, {
        is_lost: false, // No bag_id provided
      }, mockDatabase);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bag_id is required when marking disc as found/i);
    }

    // Verify only one database call was made (to find the bag content)
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(1);
  });

  test('should throw ValidationError when bag_id is not valid UUID format', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const invalidBagId = 'invalidUUID';
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: null,
      is_lost: true,
    };

    // Mock queryOne to return the bag content on first call
    mockDatabase.queryOne.mockResolvedValueOnce(mockBagContent);

    try {
      await markDiscLostService(userId, bagContentId, {
        is_lost: false,
        bag_id: invalidBagId,
      }, mockDatabase);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/invalid bag_id format/i);
    }

    // Verify only one database call was made (to find the bag content)
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(1);
  });

  test('should throw AuthorizationError when target bag not found or not owned', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const targetBagId = chance.guid();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: null,
      is_lost: true,
    };

    // Mock the sequence of database calls
    mockDatabase.queryOne
      .mockResolvedValueOnce(mockBagContent) // First call: find bag content
      .mockResolvedValueOnce(null); // Second call: target bag not found

    try {
      await markDiscLostService(userId, bagContentId, {
        is_lost: false,
        bag_id: targetBagId,
      }, mockDatabase);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/target bag not found or access denied/i);
    }

    // Verify two database calls were made
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      `SELECT id, user_id, name 
       FROM bags 
       WHERE id = $1 AND user_id = $2`,
      [targetBagId, userId],
    );
  });

  test('should mark disc as found and assign to valid bag', async () => {
    const userId = chance.integer({ min: 1 });
    const bagContentId = chance.guid();
    const targetBagId = chance.guid();
    const mockBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: null,
      is_lost: true,
      speed: 7,
      glide: 5,
      turn: -1,
      fade: 1,
      brand: 'Discraft',
      model: 'ESP Buzzz',
    };
    const mockTargetBag = {
      id: targetBagId,
      user_id: userId,
      name: 'Target Bag',
    };
    const updatedBagContent = {
      id: bagContentId,
      user_id: userId,
      bag_id: targetBagId, // Assigned to new bag
      is_lost: false,
      lost_notes: null,
      lost_at: null,
    };

    // Mock the sequence of database calls
    mockDatabase.queryOne
      .mockResolvedValueOnce(mockBagContent) // First call: find bag content
      .mockResolvedValueOnce(mockTargetBag) // Second call: validate target bag
      .mockResolvedValueOnce(updatedBagContent); // Third call: update bag content

    const result = await markDiscLostService(userId, bagContentId, {
      is_lost: false,
      bag_id: targetBagId,
    }, mockDatabase);

    expect(result).toEqual(updatedBagContent);

    // Verify the database calls
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(3);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      3,
      `UPDATE bag_contents 
       SET is_lost = $1, bag_id = $2, lost_notes = NULL, lost_at = NULL, updated_at = $3,
           speed = $4, glide = $5, turn = $6, fade = $7, brand = $8, model = $9
       WHERE id = $10
       RETURNING *`,
      [
        false,
        targetBagId,
        expect.any(Date),
        mockBagContent.speed,
        mockBagContent.glide,
        mockBagContent.turn,
        mockBagContent.fade,
        mockBagContent.brand,
        mockBagContent.model,
        bagContentId,
      ],
    );
  });
});
