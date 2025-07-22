import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import updateRoundService from '../../../services/rounds.update.service.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
}));

describe('rounds.update.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof updateRoundService).toBe('function');
  });

  test('should accept roundId, updateData, and userId parameters', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce({ id: roundId })
      .mockResolvedValueOnce({ id: chance.guid() })
      .mockResolvedValueOnce({
        id: roundId,
        name: updateData.name,
      });

    const result = await updateRoundService(roundId, updateData, userId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(null, updateData, userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(invalidRoundId, updateData, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when updateData is missing', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, null, userId))
      .rejects.toThrow('Update data is required');
  });

  test('should throw ValidationError when updateData is empty', async () => {
    const roundId = chance.guid();
    const updateData = {};
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Update data cannot be empty');
  });

  test('should throw ValidationError when userId is missing', async () => {
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    await expect(updateRoundService(roundId, updateData, null))
      .rejects.toThrow('User ID is required');
  });

  test('should throw ValidationError when userId is not a valid number', async () => {
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };
    const invalidUserId = chance.word();

    await expect(updateRoundService(roundId, updateData, invalidUserId))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should validate allowed fields only', async () => {
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
      status: 'completed',
      starting_hole: chance.integer({ min: 1, max: 18 }),
      is_private: chance.bool(),
      skins_enabled: chance.bool(),
      skins_value: chance.floating({ min: 1, max: 100, fixed: 2 }).toString(),
      not_allowed_field: 'should be removed',
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Invalid update fields: not_allowed_field');
  });

  test('should validate name is a string when provided', async () => {
    const roundId = chance.guid();
    const updateData = {
      name: 123, // Invalid - should be string
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Name must be a string');
  });

  test('should validate status is valid when provided', async () => {
    const roundId = chance.guid();
    const updateData = {
      status: 'invalid_status',
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Status must be one of: in_progress, completed, cancelled');
  });

  test('should validate starting_hole is a valid number when provided', async () => {
    const roundId = chance.guid();
    const updateData = {
      starting_hole: 'not a number',
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Starting hole must be a positive integer');
  });

  test('should validate is_private is boolean when provided', async () => {
    const roundId = chance.guid();
    const updateData = {
      is_private: 'not a boolean',
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Is private must be a boolean');
  });

  test('should validate skins_enabled is boolean when provided', async () => {
    const roundId = chance.guid();
    const updateData = {
      skins_enabled: 'not a boolean',
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Skins enabled must be a boolean');
  });

  test('should validate skins_value is valid decimal when provided', async () => {
    const roundId = chance.guid();
    const updateData = {
      skins_value: 'not a number',
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Skins value must be a valid decimal number');
  });

  test('should check if round exists', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Round not found');
  });

  test('should check user permission to update round', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce({ id: roundId })
      .mockResolvedValueOnce(null);

    await expect(updateRoundService(roundId, updateData, userId))
      .rejects.toThrow('Permission denied: You are not a participant in this round');
  });

  test('should update round with provided data', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
      status: 'completed',
      starting_hole: chance.integer({ min: 1, max: 18 }),
      is_private: chance.bool(),
      skins_enabled: chance.bool(),
      skins_value: chance.floating({ min: 1, max: 100, fixed: 2 }).toString(),
    };
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce({ id: roundId })
      .mockResolvedValueOnce({ id: chance.guid() })
      .mockResolvedValueOnce({
        id: roundId,
        name: updateData.name,
        status: updateData.status,
        starting_hole: updateData.starting_hole,
        is_private: updateData.is_private,
        skins_enabled: updateData.skins_enabled,
        skins_value: parseFloat(updateData.skins_value),
      });

    const result = await updateRoundService(roundId, updateData, userId);

    expect(result).toBeDefined();
    expect(result.id).toBe(roundId);
    expect(result.name).toBe(updateData.name);
    expect(result.status).toBe(updateData.status);
  });
});
