import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import bulkMarkDiscLostService from '../../../services/bag-contents.bulk-mark-lost.service.js';

const chance = new Chance();

describe('bulkMarkDiscLostService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDatabase.query.mockReset();
    mockDatabase.queryOne.mockReset();
  });

  test('should export a function', () => {
    expect(typeof bulkMarkDiscLostService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await bulkMarkDiscLostService(undefined, [chance.guid()], { lost_notes: 'test' });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if content_ids is missing', async () => {
    try {
      await bulkMarkDiscLostService(chance.integer({ min: 1 }), undefined, { lost_notes: 'test' });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/content_ids is required/i);
    }
  });

  test('should throw ValidationError if content_ids is not an array', async () => {
    try {
      await bulkMarkDiscLostService(chance.integer({ min: 1 }), 'not-an-array', { lost_notes: 'test' });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/content_ids must be an array/i);
    }
  });

  test('should throw ValidationError if content_ids array is empty', async () => {
    try {
      await bulkMarkDiscLostService(chance.integer({ min: 1 }), [], { lost_notes: 'test' });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/content_ids cannot be empty/i);
    }
  });

  test('should throw ValidationError if lostData is missing', async () => {
    try {
      await bulkMarkDiscLostService(chance.integer({ min: 1 }), [chance.guid()], undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/lostData is required/i);
    }
  });

  test('should throw ValidationError if lostData is not an object', async () => {
    try {
      await bulkMarkDiscLostService(chance.integer({ min: 1 }), [chance.guid()], 'not-an-object');
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/lostData must be an object/i);
    }
  });

  test('should throw ValidationError if lostData is an array', async () => {
    try {
      await bulkMarkDiscLostService(chance.integer({ min: 1 }), [chance.guid()], ['array']);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/lostData must be an object/i);
    }
  });

  test('should successfully mark multiple discs as lost with notes', async () => {
    const userId = chance.integer({ min: 1 });
    const contentIds = [chance.guid(), chance.guid(), chance.guid()];
    const lostNotes = 'Lost entire bag at tournament';

    const mockBagContents = contentIds.map((id) => ({
      id,
      user_id: userId,
      bag_id: chance.guid(),
      is_lost: false,
      speed: chance.integer({ min: 1, max: 15 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      brand: chance.company(),
      model: chance.word(),
    }));

    // Mock the database query to return the bag contents owned by user
    mockDatabase.query.mockResolvedValueOnce({ rows: mockBagContents });

    // Mock the bulk update query
    mockDatabase.query.mockResolvedValueOnce({ rowCount: mockBagContents.length });

    const result = await bulkMarkDiscLostService(
      userId,
      contentIds,
      { lost_notes: lostNotes },
      mockDatabase,
    );

    expect(result).toEqual({
      success: true,
      updated_count: contentIds.length,
      failed_ids: [],
    });

    // Verify the database calls
    expect(mockDatabase.query).toHaveBeenCalledTimes(2);

    // Check that it queries for all content IDs with user ownership validation
    expect(mockDatabase.query).toHaveBeenNthCalledWith(
      1,
      `SELECT id, user_id, bag_id, speed, glide, turn, fade, brand, model, is_lost, lost_notes, lost_at
     FROM bag_contents 
     WHERE id = ANY($1) AND user_id = $2`,
      [contentIds, userId],
    );

    // Check that it performs bulk update
    expect(mockDatabase.query).toHaveBeenNthCalledWith(
      2,
      `UPDATE bag_contents 
     SET is_lost = true, bag_id = NULL, lost_notes = $1, lost_at = $2, updated_at = $3
     WHERE id = ANY($4) AND user_id = $5`,
      [
        lostNotes,
        expect.any(Date),
        expect.any(Date),
        contentIds, // Should match foundIds which equals contentIds in this successful case
        userId,
      ],
    );
  });

  test('should handle partial success when some discs are not found or not owned', async () => {
    const userId = chance.integer({ min: 1 });
    const contentIds = [chance.guid(), chance.guid(), chance.guid()];
    const lostNotes = 'Lost some discs';

    // Only return 2 out of 3 discs (user owns only 2)
    const mockBagContents = [
      {
        id: contentIds[0],
        user_id: userId,
        bag_id: chance.guid(),
        is_lost: false,
      },
      {
        id: contentIds[1],
        user_id: userId,
        bag_id: chance.guid(),
        is_lost: false,
      },
    ];

    // Mock the database query to return only the owned discs
    mockDatabase.query.mockResolvedValueOnce({ rows: mockBagContents });

    // Mock the bulk update query - only 2 discs updated
    mockDatabase.query.mockResolvedValueOnce({ rowCount: 2 });

    const result = await bulkMarkDiscLostService(
      userId,
      contentIds,
      { lost_notes: lostNotes },
      mockDatabase,
    );

    expect(result).toEqual({
      success: true,
      updated_count: 2,
      failed_ids: [contentIds[2]], // The third disc was not found/owned
    });
  });

  test('should return error when no discs are found or owned by user', async () => {
    const userId = chance.integer({ min: 1 });
    const contentIds = [chance.guid(), chance.guid()];

    // Mock the database query to return no discs (user owns none)
    mockDatabase.query.mockResolvedValueOnce({ rows: [] });

    const result = await bulkMarkDiscLostService(
      userId,
      contentIds,
      { lost_notes: 'test' },
      mockDatabase,
    );

    expect(result).toEqual({
      success: false,
      message: 'No valid discs found for the provided content IDs',
      updated_count: 0,
      failed_ids: contentIds,
    });

    // Should only make one query (to find discs) and not attempt update
    expect(mockDatabase.query).toHaveBeenCalledTimes(1);
  });
});
