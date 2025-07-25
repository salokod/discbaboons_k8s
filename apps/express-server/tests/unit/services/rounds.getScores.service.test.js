import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { Chance } from 'chance';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  queryRows: vi.fn(),
}));

describe('rounds.getScores.service.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const getScoresService = await import('../../../services/rounds.getScores.service.js');
    expect(typeof getScoresService.default).toBe('function');
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const getScoresService = (await import('../../../services/rounds.getScores.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(getScoresService(null, userId))
      .rejects.toThrow('Round ID is required');

    await expect(getScoresService(undefined, userId))
      .rejects.toThrow('Round ID is required');

    await expect(getScoresService('', userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId format is invalid', async () => {
    const getScoresService = (await import('../../../services/rounds.getScores.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });
    const invalidRoundId = chance.word();

    await expect(getScoresService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when userId is missing or invalid', async () => {
    const getScoresService = (await import('../../../services/rounds.getScores.service.js')).default;
    const validRoundId = chance.guid();

    await expect(getScoresService(validRoundId, null))
      .rejects.toThrow('User ID is required');

    await expect(getScoresService(validRoundId, undefined))
      .rejects.toThrow('User ID is required');

    await expect(getScoresService(validRoundId, 0))
      .rejects.toThrow('User ID must be a valid number');

    await expect(getScoresService(validRoundId, -1))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const getScoresService = (await import('../../../services/rounds.getScores.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce(null); // Round not found

    await expect(getScoresService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not participant', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const getScoresService = (await import('../../../services/rounds.getScores.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 1001, max: 2000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId }) //
      .mockResolvedValueOnce(null); // User not a player

    await expect(getScoresService(roundId, userId))
      .rejects.toThrow('You must be a participant in this round to view scores');
  });

  test('should return scores with dynamic par lookup for round creator', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const getScoresService = (await import('../../../services/rounds.getScores.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();

    // Mock round exists and user is creator
    queryOne.mockResolvedValueOnce({ id: roundId, created_by_id: userId });

    // Mock players
    queryRows.mockResolvedValueOnce([
      {
        id: playerId1, username: 'player1', guest_name: null, is_guest: false,
      },
      {
        id: playerId2, username: null, guest_name: 'Guest Player', is_guest: true,
      },
    ]);

    // Mock scores
    queryRows.mockResolvedValueOnce([
      { player_id: playerId1, hole_number: 1, strokes: 4 },
      { player_id: playerId1, hole_number: 2, strokes: 3 },
      { player_id: playerId2, hole_number: 1, strokes: 5 },
    ]);

    // Mock pars
    queryRows.mockResolvedValueOnce([
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 4 },
    ]);

    const result = await getScoresService(roundId, userId);

    expect(result).toEqual({
      [playerId1]: {
        username: 'player1',
        guestName: null,
        isGuest: false,
        holes: {
          1: { strokes: 4, par: 3, relative: 1 },
          2: { strokes: 3, par: 4, relative: -1 },
        },
        total: 7,
        totalPar: 7,
        relativeScore: 0,
      },
      [playerId2]: {
        username: null,
        guestName: 'Guest Player',
        isGuest: true,
        holes: {
          1: { strokes: 5, par: 3, relative: 2 },
        },
        total: 5,
        totalPar: 3,
        relativeScore: 2,
      },
    });
  });
});
