import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import getBagService from '../../../services/bags.get.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

describe('getBagService', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
    mockDatabase.queryRows.mockClear();
  });

  test('should export a function', () => {
    expect(typeof getBagService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await getBagService(undefined, chance.guid());
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if bagId is missing', async () => {
    try {
      await getBagService(chance.integer({ min: 1 }), undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bagId is required/i);
    }
  });

  test('should return bag if user owns it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockContents = [];

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue(mockContents);

    const result = await getBagService(userId, bagId, false);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [bagId, userId],
    );
    expect(result).toEqual({ ...mockBag, bag_contents: mockContents });
  });

  test('should return null if bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    // Mock database to return null (bag not found)
    mockDatabase.queryOne.mockResolvedValue(null);

    const result = await getBagService(userId, bagId, false);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [bagId, userId],
    );
    expect(result).toBeNull();
  });

  test('should return null if bagId is not a valid UUID format', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidBagId = 'badBagId'; // Invalid UUID format

    const result = await getBagService(userId, invalidBagId, false);

    // Should not call database for invalid UUID
    expect(mockDatabase.queryOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test('should query bag contents with disc master data', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([]);

    await getBagService(userId, bagId, false);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('JOIN disc_master dm ON bc.disc_id = dm.id'),
      [bagId],
    );
  });

  test('should include disc master data in query result', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockContent = {
      id: chance.guid(),
      user_id: userId,
      bag_id: bagId,
      disc_id: chance.guid(),
      notes: chance.sentence(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: 'New',
      plastic_type: 'Champion',
      color: 'Red',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
      brand: 'Innova',
      model: 'Destroyer',
      is_lost: false,
      created_at: new Date(),
      updated_at: new Date(),
      disc_master_id: chance.guid(),
      disc_master_brand: 'Innova',
      disc_master_model: 'Destroyer',
      disc_master_speed: 12,
      disc_master_glide: 5,
      disc_master_turn: -1,
      disc_master_fade: 3,
      disc_master_approved: true,
      disc_master_added_by_id: chance.integer({ min: 1 }),
      disc_master_created_at: new Date(),
      disc_master_updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([mockContent]);

    const result = await getBagService(userId, bagId, false);

    expect(result.bag_contents).toHaveLength(1);
    expect(result.bag_contents[0]).toHaveProperty('disc_master');
    expect(result.bag_contents[0].disc_master).toEqual({
      id: mockContent.disc_master_id,
      brand: mockContent.disc_master_brand,
      model: mockContent.disc_master_model,
      speed: mockContent.disc_master_speed,
      glide: mockContent.disc_master_glide,
      turn: mockContent.disc_master_turn,
      fade: mockContent.disc_master_fade,
      approved: mockContent.disc_master_approved,
      added_by_id: mockContent.disc_master_added_by_id,
      created_at: mockContent.disc_master_created_at,
      updated_at: mockContent.disc_master_updated_at,
    });
  });

  test('should filter out lost discs by default', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([]);

    await getBagService(userId, bagId, false);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('AND bc.is_lost = false'),
      [bagId],
    );
  });

  test('should include lost discs when includeLost is true', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([]);

    await getBagService(userId, bagId, true);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.not.stringContaining('AND bc.is_lost = false'),
      [bagId],
    );
  });

  test('should use custom flight numbers from bag_contents over disc_master', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockContent = {
      id: chance.guid(),
      user_id: userId,
      bag_id: bagId,
      disc_id: chance.guid(),
      notes: chance.sentence(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: 'New',
      plastic_type: 'Champion',
      color: 'Red',
      speed: 9, // Custom override
      glide: null, // Use disc_master fallback
      turn: -2, // Custom override
      fade: null, // Use disc_master fallback
      brand: 'Innova',
      model: 'Destroyer',
      is_lost: false,
      created_at: new Date(),
      updated_at: new Date(),
      disc_master_id: chance.guid(),
      disc_master_brand: 'Innova',
      disc_master_model: 'Destroyer',
      disc_master_speed: 12, // Stock value (should be overridden)
      disc_master_glide: 5, // Stock value (should be used)
      disc_master_turn: -1, // Stock value (should be overridden)
      disc_master_fade: 3, // Stock value (should be used)
      disc_master_approved: true,
      disc_master_added_by_id: chance.integer({ min: 1 }),
      disc_master_created_at: new Date(),
      disc_master_updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([mockContent]);

    const result = await getBagService(userId, bagId, false);

    expect(result.bag_contents[0].speed).toBe(9); // Custom used
    expect(result.bag_contents[0].glide).toBe(5); // Fallback used
    expect(result.bag_contents[0].turn).toBe(-2); // Custom used
    expect(result.bag_contents[0].fade).toBe(3); // Fallback used
  });

  test('should use all custom flight numbers when none are null', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockContent = {
      id: chance.guid(),
      user_id: userId,
      bag_id: bagId,
      disc_id: chance.guid(),
      notes: chance.sentence(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: 'New',
      plastic_type: 'Champion',
      color: 'Red',
      speed: 11, // All custom values
      glide: 6, // All custom values
      turn: 0, // All custom values
      fade: 1, // All custom values
      brand: 'Innova',
      model: 'Destroyer',
      is_lost: false,
      created_at: new Date(),
      updated_at: new Date(),
      disc_master_id: chance.guid(),
      disc_master_brand: 'Innova',
      disc_master_model: 'Destroyer',
      disc_master_speed: 12, // Should be ignored
      disc_master_glide: 5, // Should be ignored
      disc_master_turn: -1, // Should be ignored
      disc_master_fade: 3, // Should be ignored
      disc_master_approved: true,
      disc_master_added_by_id: chance.integer({ min: 1 }),
      disc_master_created_at: new Date(),
      disc_master_updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([mockContent]);

    const result = await getBagService(userId, bagId, false);

    expect(result.bag_contents[0].speed).toBe(11); // All custom values used
    expect(result.bag_contents[0].glide).toBe(6);
    expect(result.bag_contents[0].turn).toBe(0);
    expect(result.bag_contents[0].fade).toBe(1);
  });

  test('should use custom brand/model from bag_contents over disc_master', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockContent = {
      id: chance.guid(),
      user_id: userId,
      bag_id: bagId,
      disc_id: chance.guid(),
      notes: chance.sentence(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: 'New',
      plastic_type: 'Champion',
      color: 'Red',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
      brand: 'Custom Brand', // Custom override
      model: null, // Use disc_master fallback
      is_lost: false,
      created_at: new Date(),
      updated_at: new Date(),
      disc_master_id: chance.guid(),
      disc_master_brand: 'Stock Brand', // Stock value (should be overridden)
      disc_master_model: 'Stock Model', // Stock value (should be used)
      disc_master_speed: 12,
      disc_master_glide: 5,
      disc_master_turn: -1,
      disc_master_fade: 3,
      disc_master_approved: true,
      disc_master_added_by_id: chance.integer({ min: 1 }),
      disc_master_created_at: new Date(),
      disc_master_updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([mockContent]);

    const result = await getBagService(userId, bagId, false);

    expect(result.bag_contents[0].brand).toBe('Custom Brand'); // Custom used
    expect(result.bag_contents[0].model).toBe('Stock Model'); // Fallback used
  });

  test('should use all custom brand/model when both are provided', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockContent = {
      id: chance.guid(),
      user_id: userId,
      bag_id: bagId,
      disc_id: chance.guid(),
      notes: chance.sentence(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: 'New',
      plastic_type: 'Champion',
      color: 'Red',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
      brand: 'Beat-in Brand', // All custom values
      model: 'Seasoned Destroyer', // All custom values
      is_lost: false,
      created_at: new Date(),
      updated_at: new Date(),
      disc_master_id: chance.guid(),
      disc_master_brand: 'Innova', // Should be ignored
      disc_master_model: 'Destroyer', // Should be ignored
      disc_master_speed: 12,
      disc_master_glide: 5,
      disc_master_turn: -1,
      disc_master_fade: 3,
      disc_master_approved: true,
      disc_master_added_by_id: chance.integer({ min: 1 }),
      disc_master_created_at: new Date(),
      disc_master_updated_at: new Date(),
    };

    // Mock database calls
    mockDatabase.queryOne.mockResolvedValue(mockBag);
    mockDatabase.queryRows.mockResolvedValue([mockContent]);

    const result = await getBagService(userId, bagId, false);

    expect(result.bag_contents[0].brand).toBe('Beat-in Brand'); // All custom values used
    expect(result.bag_contents[0].model).toBe('Seasoned Destroyer');
  });
});
