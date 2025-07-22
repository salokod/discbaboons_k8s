import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import getRoundService from '../../../services/rounds.get.service.js';
import { queryOne, queryRows } from '../../../lib/database.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  queryRows: vi.fn(),
}));

describe('rounds.get.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof getRoundService).toBe('function');
  });

  test('should accept roundId and userId parameters', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue({ id: roundId, created_by_id: userId });
    queryRows.mockResolvedValue([]);

    const result = await getRoundService(roundId, userId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(getRoundService(null, userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(getRoundService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when userId is missing', async () => {
    const roundId = chance.guid();

    await expect(getRoundService(roundId, null))
      .rejects.toThrow('User ID is required');
  });

  test('should throw ValidationError when userId is not a valid number', async () => {
    const roundId = chance.guid();
    const invalidUserId = chance.word();

    await expect(getRoundService(roundId, invalidUserId))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(getRoundService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not a participant', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 2001, max: 3000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId })
      .mockResolvedValueOnce(null); // User is not a player

    await expect(getRoundService(roundId, userId))
      .rejects.toThrow('You must be a participant in this round to view details');
  });

  test('should return round details with players when user is participant', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const roundName = chance.sentence({ words: 3 });
    const courseId = chance.word();
    const mockRound = {
      id: roundId,
      created_by_id: userId,
      course_id: courseId,
      name: roundName,
      start_time: new Date(),
      starting_hole: 1,
      is_private: false,
      skins_enabled: false,
      skins_value: null,
      status: 'in_progress',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockPlayers = [
      {
        id: chance.guid(),
        round_id: roundId,
        user_id: userId,
        is_guest: false,
        guest_name: null,
        username: chance.word(),
        joined_at: new Date(),
      },
    ];

    queryOne.mockResolvedValue(mockRound);
    queryRows.mockResolvedValue(mockPlayers);

    const result = await getRoundService(roundId, userId);

    expect(result).toEqual({
      ...mockRound,
      players: mockPlayers,
    });
  });
});
