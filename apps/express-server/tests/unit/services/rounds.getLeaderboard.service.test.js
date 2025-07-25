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

describe('rounds.getLeaderboard.service.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const getLeaderboardService = await import('../../../services/rounds.getLeaderboard.service.js');
    expect(typeof getLeaderboardService.default).toBe('function');
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(getLeaderboardService(null, userId))
      .rejects.toThrow('Round ID is required');

    await expect(getLeaderboardService(undefined, userId))
      .rejects.toThrow('Round ID is required');

    await expect(getLeaderboardService('', userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId format is invalid', async () => {
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });
    const invalidRoundId = chance.word();

    await expect(getLeaderboardService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when userId is missing or invalid', async () => {
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;
    const validRoundId = chance.guid();

    await expect(getLeaderboardService(validRoundId, null))
      .rejects.toThrow('User ID is required');

    await expect(getLeaderboardService(validRoundId, undefined))
      .rejects.toThrow('User ID is required');

    await expect(getLeaderboardService(validRoundId, 0))
      .rejects.toThrow('User ID must be a valid number');

    await expect(getLeaderboardService(validRoundId, -1))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce(null); // Round not found

    await expect(getLeaderboardService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not participant', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 1001, max: 2000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId })
      .mockResolvedValueOnce(null); // User not a player

    await expect(getLeaderboardService(roundId, userId))
      .rejects.toThrow('You must be a participant in this round to view leaderboard');
  });

  test('should return leaderboard with players sorted by total strokes', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();

    // Mock round exists and user is creator
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
    });

    // Mock players
    queryRows.mockResolvedValueOnce([
      {
        id: playerId1, username: 'player1', guest_name: null, is_guest: false,
      },
      {
        id: playerId2, username: null, guest_name: 'Guest Player', is_guest: true,
      },
    ]);

    // Mock scores - player1 has 2 holes (7 strokes), player2 has 1 hole (5 strokes)
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

    const result = await getLeaderboardService(roundId, userId);

    expect(result).toEqual({
      players: [
        {
          playerId: playerId2,
          username: null,
          guestName: 'Guest Player',
          isGuest: true,
          position: 1,
          totalStrokes: 5,
          totalPar: 3,
          relativeScore: 2,
          holesCompleted: 1,
          currentHole: 2, // Next hole to play
          skinsWon: 0, // Placeholder
        },
        {
          playerId: playerId1,
          username: 'player1',
          guestName: null,
          isGuest: false,
          position: 2,
          totalStrokes: 7,
          totalPar: 7,
          relativeScore: 0,
          holesCompleted: 2,
          currentHole: 3, // Next hole to play
          skinsWon: 0, // Placeholder
        },
      ],
      roundSettings: {
        skinsEnabled: true,
        skinsValue: '5.00',
        currentCarryOver: 0, // Placeholder
      },
    });
  });
});
