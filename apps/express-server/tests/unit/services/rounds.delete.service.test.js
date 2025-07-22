import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import deleteRoundService from '../../../services/rounds.delete.service.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
}));

describe('rounds.delete.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof deleteRoundService).toBe('function');
  });

  test('should accept roundId and userId parameters', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue({ id: roundId, created_by_id: userId });

    const result = await deleteRoundService(roundId, userId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(deleteRoundService(null, userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(deleteRoundService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when userId is missing', async () => {
    const roundId = chance.guid();

    await expect(deleteRoundService(roundId, null))
      .rejects.toThrow('User ID is required');
  });

  test('should throw ValidationError when userId is not a valid number', async () => {
    const roundId = chance.guid();
    const invalidUserId = chance.word();

    await expect(deleteRoundService(roundId, invalidUserId))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should check if round exists', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(deleteRoundService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should check user permission to delete round', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const differentUserId = chance.integer({ min: 1001, max: 2000 });

    queryOne.mockResolvedValue({ id: roundId, created_by_id: differentUserId });

    await expect(deleteRoundService(roundId, userId))
      .rejects.toThrow('Permission denied: Only the round creator can delete the round');
  });

  test('should delete round successfully', async () => {
    const { queryOne, query } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue({ id: roundId, created_by_id: userId });
    query.mockResolvedValue({ rowCount: 1 });

    const result = await deleteRoundService(roundId, userId);

    expect(result).toEqual({ success: true });
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM rounds WHERE id = $1',
      [roundId],
    );
  });
});
