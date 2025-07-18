import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import listLostDiscsService from '../../../services/bag-contents.list-lost.service.js';

const chance = new Chance();

describe('listLostDiscsService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDatabase.queryOne.mockReset();
    mockDatabase.queryRows.mockReset();
  });
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
    const discId = chance.guid();
    const dmSpeed = chance.integer({ min: 1, max: 15 });
    const dmGlide = chance.integer({ min: 1, max: 7 });
    const dmTurn = chance.integer({ min: -5, max: 2 });
    const dmFade = chance.integer({ min: 0, max: 5 });
    const dmBrand = chance.company();
    const dmModel = chance.word();

    const mockLostDisc = {
      id: discId,
      user_id: userId,
      bag_id: null,
      disc_master_id: chance.guid(),
      color: chance.color(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: chance.pickone(['New', 'Lightly Used', 'Used', 'Well Used']),
      is_lost: true,
      lost_at: new Date(),
      lost_notes: chance.sentence(),
      created_at: new Date(),
      updated_at: new Date(),
      speed: null, // Will use dm_speed fallback
      glide: null, // Will use dm_glide fallback
      turn: null, // Will use dm_turn fallback
      fade: null, // Will use dm_fade fallback
      brand: null, // Will use dm_brand fallback
      model: null, // Will use dm_model fallback
      // Disc master fields from JOIN
      dm_speed: dmSpeed,
      dm_glide: dmGlide,
      dm_turn: dmTurn,
      dm_fade: dmFade,
      dm_brand: dmBrand,
      dm_model: dmModel,
      dm_approved: true,
    };

    // Mock the database calls
    mockDatabase.queryOne.mockResolvedValue({ count: '1' }); // Count query
    mockDatabase.queryRows.mockResolvedValue([mockLostDisc]); // Lost discs query

    const result = await listLostDiscsService(userId, {}, mockDatabase);

    expect(result.lost_discs).toHaveLength(1);
    expect(result.lost_discs[0]).toMatchObject({
      id: discId,
      user_id: userId,
      is_lost: true,
      speed: dmSpeed, // Uses fallback
      glide: dmGlide, // Uses fallback
      turn: dmTurn, // Uses fallback
      fade: dmFade, // Uses fallback
      brand: dmBrand, // Uses fallback
      model: dmModel, // Uses fallback
    });

    expect(result.pagination).toEqual({
      total: 1,
      limit: 30,
      offset: 0,
      has_more: false,
    });

    // Verify database calls
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `
    SELECT COUNT(*) as count
    FROM bag_contents 
    WHERE user_id = $1 AND is_lost = true
  `,
      [userId],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
    SELECT 
      bc.*,
      dm.speed as dm_speed,
      dm.glide as dm_glide,
      dm.turn as dm_turn,
      dm.fade as dm_fade,
      dm.brand as dm_brand,
      dm.model as dm_model,
      dm.approved as dm_approved
    FROM bag_contents bc
    LEFT JOIN disc_master dm ON bc.disc_id = dm.id
    WHERE bc.user_id = $1 AND bc.is_lost = true
    ORDER BY bc.lost_at DESC
    LIMIT $2 OFFSET $3
  `,
      [userId, 30, 0],
    );
  });

  test('should merge custom flight numbers and disc names with disc_master fallbacks', async () => {
    const userId = chance.integer({ min: 1 });
    const customSpeed = chance.integer({ min: 1, max: 15 });
    const customTurn = chance.integer({ min: -5, max: 2 });
    const customBrand = chance.company();
    const stockGlide = chance.integer({ min: 1, max: 7 });
    const stockFade = chance.integer({ min: 0, max: 5 });
    const stockModel = chance.word();

    const mockLostDisc = {
      id: chance.guid(),
      user_id: userId,
      bag_id: null,
      disc_master_id: chance.guid(),
      color: chance.color(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: chance.pickone(['New', 'Lightly Used', 'Used', 'Well Used']),
      is_lost: true,
      lost_at: new Date(),
      lost_notes: chance.sentence(),
      created_at: new Date(),
      updated_at: new Date(),
      speed: customSpeed, // Custom override
      glide: null, // Use disc_master fallback
      turn: customTurn, // Custom override
      fade: null, // Use disc_master fallback
      brand: customBrand, // Custom override
      model: null, // Use disc_master fallback
      // Disc master fields from JOIN
      dm_speed: chance.integer({ min: 1, max: 15 }), // Should be overridden
      dm_glide: stockGlide, // Should be used
      dm_turn: chance.integer({ min: -5, max: 2 }), // Should be overridden
      dm_fade: stockFade, // Should be used
      dm_brand: chance.company(), // Should be overridden
      dm_model: stockModel, // Should be used
      dm_approved: true,
    };

    // Mock the database calls
    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue([mockLostDisc]);

    const result = await listLostDiscsService(userId, {}, mockDatabase);

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

    // Mock the database calls
    mockDatabase.queryOne.mockResolvedValue({ count: '0' });
    mockDatabase.queryRows.mockResolvedValue([]);

    const options = { limit: customLimit, offset: customOffset };
    const result = await listLostDiscsService(userId, options, mockDatabase);

    expect(result.pagination.limit).toBe(customLimit);
    expect(result.pagination.offset).toBe(customOffset);

    // Verify the database calls with custom pagination
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
    SELECT 
      bc.*,
      dm.speed as dm_speed,
      dm.glide as dm_glide,
      dm.turn as dm_turn,
      dm.fade as dm_fade,
      dm.brand as dm_brand,
      dm.model as dm_model,
      dm.approved as dm_approved
    FROM bag_contents bc
    LEFT JOIN disc_master dm ON bc.disc_id = dm.id
    WHERE bc.user_id = $1 AND bc.is_lost = true
    ORDER BY bc.lost_at DESC
    LIMIT $2 OFFSET $3
  `,
      [userId, customLimit, customOffset],
    );
  });

  test('should handle custom sorting options', async () => {
    const userId = chance.integer({ min: 1 });
    const sortField = 'lost_at';
    const sortOrder = 'asc';

    // Mock the database calls
    mockDatabase.queryOne.mockResolvedValue({ count: '0' });
    mockDatabase.queryRows.mockResolvedValue([]);

    const options = { sort: sortField, order: sortOrder };
    const result = await listLostDiscsService(userId, options, mockDatabase);

    expect(result.lost_discs).toEqual([]);

    // Verify the database calls with custom sorting
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
    SELECT 
      bc.*,
      dm.speed as dm_speed,
      dm.glide as dm_glide,
      dm.turn as dm_turn,
      dm.fade as dm_fade,
      dm.brand as dm_brand,
      dm.model as dm_model,
      dm.approved as dm_approved
    FROM bag_contents bc
    LEFT JOIN disc_master dm ON bc.disc_id = dm.id
    WHERE bc.user_id = $1 AND bc.is_lost = true
    ORDER BY bc.lost_at ASC
    LIMIT $2 OFFSET $3
  `,
      [userId, 30, 0],
    );
  });

  test('should return empty results when user has no lost discs', async () => {
    const userId = chance.integer({ min: 1 });

    // Mock the database calls
    mockDatabase.queryOne.mockResolvedValue({ count: '0' });
    mockDatabase.queryRows.mockResolvedValue([]);

    const result = await listLostDiscsService(userId, {}, mockDatabase);

    expect(result).toEqual({
      lost_discs: [],
      pagination: {
        total: 0,
        limit: 30,
        offset: 0,
        has_more: false,
      },
    });

    // Verify database calls were made
    expect(mockDatabase.queryOne).toHaveBeenCalled();
    expect(mockDatabase.queryRows).toHaveBeenCalled();
  });

  test('should set has_more flag correctly based on total count', async () => {
    const userId = chance.integer({ min: 1 });
    const limit = 5;
    const totalCount = 10; // More than limit

    // Mock exactly limit number of results
    const mockLostDiscs = Array.from({ length: limit }, () => ({
      id: chance.guid(),
      user_id: userId,
      bag_id: null,
      disc_master_id: chance.guid(),
      color: chance.color(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: chance.pickone(['New', 'Lightly Used', 'Used', 'Well Used']),
      is_lost: true,
      lost_at: new Date(),
      lost_notes: chance.sentence(),
      created_at: new Date(),
      updated_at: new Date(),
      speed: null,
      glide: null,
      turn: null,
      fade: null,
      brand: null,
      model: null,
      // Disc master fields from JOIN
      dm_speed: chance.integer({ min: 1, max: 15 }),
      dm_glide: chance.integer({ min: 1, max: 7 }),
      dm_turn: chance.integer({ min: -5, max: 2 }),
      dm_fade: chance.integer({ min: 0, max: 5 }),
      dm_brand: chance.company(),
      dm_model: chance.word(),
      dm_approved: true,
    }));

    // Mock the database calls
    mockDatabase.queryOne.mockResolvedValue({ count: totalCount.toString() });
    mockDatabase.queryRows.mockResolvedValue(mockLostDiscs);

    const result = await listLostDiscsService(userId, { limit }, mockDatabase);

    expect(result.pagination.has_more).toBe(true);
    expect(result.pagination.total).toBe(totalCount);
  });

  test('should set has_more to false when limit equals total count', async () => {
    const userId = chance.integer({ min: 1 });
    const limit = 2;
    const totalCount = 2; // Exactly the limit

    const mockLostDiscs = Array.from({ length: limit }, () => ({
      id: chance.guid(),
      user_id: userId,
      bag_id: null,
      disc_master_id: chance.guid(),
      color: chance.color(),
      weight: chance.integer({ min: 150, max: 180 }),
      condition: chance.pickone(['New', 'Lightly Used', 'Used', 'Well Used']),
      is_lost: true,
      lost_at: new Date(),
      lost_notes: chance.sentence(),
      created_at: new Date(),
      updated_at: new Date(),
      speed: null,
      glide: null,
      turn: null,
      fade: null,
      brand: null,
      model: null,
      // Disc master fields from JOIN
      dm_speed: chance.integer({ min: 1, max: 15 }),
      dm_glide: chance.integer({ min: 1, max: 7 }),
      dm_turn: chance.integer({ min: -5, max: 2 }),
      dm_fade: chance.integer({ min: 0, max: 5 }),
      dm_brand: chance.company(),
      dm_model: chance.word(),
      dm_approved: true,
    }));

    // Mock the database calls
    mockDatabase.queryOne.mockResolvedValue({ count: totalCount.toString() });
    mockDatabase.queryRows.mockResolvedValue(mockLostDiscs);

    const result = await listLostDiscsService(userId, { limit }, mockDatabase);

    expect(result.pagination.has_more).toBe(false);
    expect(result.pagination.total).toBe(totalCount);
  });
});
