import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import roundsListService from '../../../services/rounds.list.service.js';

const chance = new Chance();

describe('roundsListService', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
    mockDatabase.queryRows.mockClear();
  });

  test('should export a function', () => {
    expect(typeof roundsListService).toBe('function');
  });

  test('should accept userId parameter and return user rounds', async () => {
    const userId = chance.integer({ min: 1 });
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        course_id: chance.word(),
        status: 'in_progress',
        created_at: new Date().toISOString(),
      },
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        course_id: chance.word(),
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '2' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) FROM rounds WHERE created_by_id = $1'),
      [userId],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [userId, 50, 0],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: 2,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should throw ValidationError when userId is missing', async () => {
    await expect(roundsListService())
      .rejects
      .toThrow('User ID is required');
  });

  test('should throw ValidationError when userId is null', async () => {
    await expect(roundsListService(null))
      .rejects
      .toThrow('User ID is required');
  });

  test('should accept optional status filter', async () => {
    const userId = chance.integer({ min: 1 });
    const status = 'in_progress';
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        course_id: chance.word(),
        status: 'in_progress',
        created_at: new Date().toISOString(),
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { status });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND status = $2'),
      [userId, status, 50, 0],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should work without status filter', async () => {
    const userId = chance.integer({ min: 1 });
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        course_id: chance.word(),
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, {});

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 ORDER BY'),
      [userId, 50, 0],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should accept is_private filter', async () => {
    const userId = chance.integer({ min: 1 });
    const isPrivate = chance.bool();
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        is_private: isPrivate,
        status: chance.pickone(['in_progress', 'completed', 'cancelled']),
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { is_private: isPrivate });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND is_private = $2'),
      [userId, isPrivate, 50, 0],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should accept skins_enabled filter', async () => {
    const userId = chance.integer({ min: 1 });
    const skinsEnabled = chance.bool();
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        skins_enabled: skinsEnabled,
        skins_value: skinsEnabled
          ? chance.floating({ min: 1, max: 50, fixed: 2 }).toString()
          : null,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { skins_enabled: skinsEnabled });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND skins_enabled = $2'),
      [userId, skinsEnabled, 50, 0],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should accept name filter for partial text search', async () => {
    const userId = chance.integer({ min: 1 });
    const nameSearch = chance.word();
    const fullRoundName = `${nameSearch} ${chance.sentence({ words: 2 })}`;
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: fullRoundName,
        status: chance.pickone(['in_progress', 'completed', 'cancelled']),
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { name: nameSearch });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND name ILIKE $2'),
      [userId, `%${nameSearch}%`, 50, 0],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should accept pagination with limit and offset', async () => {
    const userId = chance.integer({ min: 1 });
    const limit = chance.integer({ min: 1, max: 100 });
    const offset = chance.integer({ min: 0, max: 50 });
    const totalCount = offset + limit + chance.integer({ min: 1, max: 50 });
    const mockRounds = Array.from({ length: limit }, () => ({
      id: chance.guid({ version: 4 }),
      name: chance.sentence({ words: 3 }),
      status: chance.pickone(['in_progress', 'completed', 'cancelled']),
      created_at: chance.date().toISOString(),
    }));

    mockDatabase.queryOne.mockResolvedValueOnce({ count: totalCount.toString() });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { limit, offset });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [userId, limit, offset],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: totalCount,
      limit,
      offset,
      hasMore: true,
    });
  });

  test('should use default pagination when not specified', async () => {
    const userId = chance.integer({ min: 1 });
    const mockRounds = Array.from({ length: 50 }, () => ({
      id: chance.guid({ version: 4 }),
      name: chance.sentence({ words: 3 }),
      status: chance.pickone(['in_progress', 'completed', 'cancelled']),
    }));

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '50' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, {});

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [userId, 50, 0],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: 50,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should return pagination metadata with total count and hasMore', async () => {
    const userId = chance.integer({ min: 1 });
    const limit = chance.integer({ min: 1, max: 20 });
    const offset = chance.integer({ min: 0, max: 10 });
    const totalCount = offset + limit + chance.integer({ min: 1, max: 50 });

    const mockRounds = Array.from({ length: limit }, () => ({
      id: chance.guid({ version: 4 }),
      name: chance.sentence({ words: 3 }),
      status: chance.pickone(['in_progress', 'completed', 'cancelled']),
    }));

    // Mock count query first, then data query
    mockDatabase.queryOne.mockResolvedValueOnce({ count: totalCount.toString() });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { limit, offset });

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) FROM rounds WHERE created_by_id = $1'),
      [userId],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT'),
      [userId, limit, offset],
    );
    expect(result).toEqual({
      rounds: mockRounds,
      total: totalCount,
      limit,
      offset,
      hasMore: true,
    });
  });

  test('should throw ValidationError for invalid status filter', async () => {
    const userId = chance.integer({ min: 1 });

    await expect(roundsListService(userId, { status: 'invalid_status' }))
      .rejects
      .toThrow('Status must be one of: in_progress, completed, cancelled');
  });

  test('should throw ValidationError for invalid is_private filter', async () => {
    const userId = chance.integer({ min: 1 });

    await expect(roundsListService(userId, { is_private: 'invalid_boolean' }))
      .rejects
      .toThrow('is_private must be a boolean value (true or false)');
  });

  test('should throw ValidationError for invalid skins_enabled filter', async () => {
    const userId = chance.integer({ min: 1 });

    await expect(roundsListService(userId, { skins_enabled: '7000' }))
      .rejects
      .toThrow('skins_enabled must be a boolean value (true or false)');
  });

  test('should convert string "true" to boolean true for is_private', async () => {
    const userId = chance.integer({ min: 1 });
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        is_private: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { is_private: 'true' });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND is_private = $2'),
      [userId, true, 50, 0],
    );
    expect(result.rounds).toEqual(mockRounds);
  });

  test('should convert string "false" to boolean false for is_private', async () => {
    const userId = chance.integer({ min: 1 });
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        is_private: false,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { is_private: 'false' });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND is_private = $2'),
      [userId, false, 50, 0],
    );
    expect(result.rounds).toEqual(mockRounds);
  });

  test('should convert string "true" to boolean true for skins_enabled', async () => {
    const userId = chance.integer({ min: 1 });
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        skins_enabled: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { skins_enabled: 'true' });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND skins_enabled = $2'),
      [userId, true, 50, 0],
    );
    expect(result.rounds).toEqual(mockRounds);
  });

  test('should convert string "false" to boolean false for skins_enabled', async () => {
    const userId = chance.integer({ min: 1 });
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        skins_enabled: false,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { skins_enabled: 'false' });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND skins_enabled = $2'),
      [userId, false, 50, 0],
    );
    expect(result.rounds).toEqual(mockRounds);
  });

  test('should accept valid status value: in_progress', async () => {
    const userId = chance.integer({ min: 1 });
    const status = 'in_progress';
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        status,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { status });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND status = $2'),
      [userId, status, 50, 0],
    );
    expect(result.rounds).toEqual(mockRounds);
  });

  test('should accept valid status value: completed', async () => {
    const userId = chance.integer({ min: 1 });
    const status = 'completed';
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        status,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { status });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND status = $2'),
      [userId, status, 50, 0],
    );
    expect(result.rounds).toEqual(mockRounds);
  });

  test('should accept valid status value: cancelled', async () => {
    const userId = chance.integer({ min: 1 });
    const status = 'cancelled';
    const mockRounds = [
      {
        id: chance.guid({ version: 4 }),
        name: chance.sentence({ words: 3 }),
        status,
      },
    ];

    mockDatabase.queryOne.mockResolvedValueOnce({ count: '1' });
    mockDatabase.queryRows.mockResolvedValueOnce(mockRounds);

    const result = await roundsListService(userId, { status });

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE created_by_id = $1 AND status = $2'),
      [userId, status, 50, 0],
    );
    expect(result.rounds).toEqual(mockRounds);
  });
});
