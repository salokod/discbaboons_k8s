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

describe('skins.calculate.service.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const skinsCalculateService = await import('../../../services/skins.calculate.service.js');
    expect(typeof skinsCalculateService.default).toBe('function');
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(skinsCalculateService(null, userId))
      .rejects.toThrow('Round ID is required');

    await expect(skinsCalculateService(undefined, userId))
      .rejects.toThrow('Round ID is required');

    await expect(skinsCalculateService('', userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId format is invalid', async () => {
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });
    const invalidRoundId = chance.word();

    await expect(skinsCalculateService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when userId is missing or invalid', async () => {
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const validRoundId = chance.guid();

    await expect(skinsCalculateService(validRoundId, null))
      .rejects.toThrow('User ID is required');

    await expect(skinsCalculateService(validRoundId, undefined))
      .rejects.toThrow('User ID is required');

    await expect(skinsCalculateService(validRoundId, 0))
      .rejects.toThrow('User ID must be a valid number');

    await expect(skinsCalculateService(validRoundId, -1))
      .rejects.toThrow('User ID must be a valid number');

    await expect(skinsCalculateService(validRoundId, 'invalid'))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(skinsCalculateService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not a participant', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 1001, max: 2000 }); // Different from userId

    const mockRound = {
      id: roundId,
      created_by_id: creatorId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: 1,
      hole_count: 18,
    };

    queryOne
      .mockResolvedValueOnce(mockRound) // First call for round check
      .mockResolvedValueOnce(null); // Second call for player check

    await expect(skinsCalculateService(roundId, userId))
      .rejects.toThrow('You must be a participant in this round to view skins');
  });

  test('should calculate basic skins results for simple hole wins', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    const mockRound = {
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: 1,
      hole_count: 9,
    };

    const mockPlayers = [
      {
        id: 'player1', user_id: userId, guest_name: null, is_guest: false, username: 'user1',
      },
      {
        id: 'player2', user_id: 999, guest_name: null, is_guest: false, username: 'user2',
      },
    ];

    const mockScores = [
      { player_id: 'player1', hole_number: 1, strokes: 3 },
      { player_id: 'player2', hole_number: 1, strokes: 4 },
      { player_id: 'player1', hole_number: 2, strokes: 4 },
      { player_id: 'player2', hole_number: 2, strokes: 3 },
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 3 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers) // Players query
      .mockResolvedValueOnce(mockScores) // Scores query
      .mockResolvedValueOnce(mockPars); // Pars query

    const result = await skinsCalculateService(roundId, userId);

    expect(result).toEqual({
      roundId,
      skinsEnabled: true,
      skinsValue: '5.00',
      holes: {
        1: {
          winner: 'player1',
          winnerScore: 3,
          skinsValue: '5.00',
          carriedOver: 0,
        },
        2: {
          winner: 'player2',
          winnerScore: 3,
          skinsValue: '5.00',
          carriedOver: 0,
        },
      },
      playerSummary: {
        player1: { skinsWon: 1, totalValue: '5.00' },
        player2: { skinsWon: 1, totalValue: '5.00' },
      },
      totalCarryOver: 0,
    });
  });

  test('should handle carry-over when holes tie', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    const mockRound = {
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: 1,
      hole_count: 9,
    };

    const mockPlayers = [
      {
        id: 'player1', user_id: userId, guest_name: null, is_guest: false, username: 'user1',
      },
      {
        id: 'player2', user_id: 999, guest_name: null, is_guest: false, username: 'user2',
      },
    ];

    const mockScores = [
      { player_id: 'player1', hole_number: 1, strokes: 3 }, // Tie
      { player_id: 'player2', hole_number: 1, strokes: 3 }, // Tie
      { player_id: 'player1', hole_number: 2, strokes: 4 },
      { player_id: 'player2', hole_number: 2, strokes: 3 }, // Wins with 2 skins
      { player_id: 'player1', hole_number: 3, strokes: 3 }, // Tie
      { player_id: 'player2', hole_number: 3, strokes: 3 }, // Tie
      { player_id: 'player1', hole_number: 4, strokes: 2 }, // Wins with 2 skins
      { player_id: 'player2', hole_number: 4, strokes: 4 },
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 3 },
      { hole_number: 3, par: 3 },
      { hole_number: 4, par: 3 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers) // Players query
      .mockResolvedValueOnce(mockScores) // Scores query
      .mockResolvedValueOnce(mockPars); // Pars query

    const result = await skinsCalculateService(roundId, userId);

    expect(result).toEqual({
      roundId,
      skinsEnabled: true,
      skinsValue: '5.00',
      holes: {
        1: {
          winner: null,
          tied: true,
          tiedScore: 3,
          skinsValue: '5.00',
          carriedOver: 1,
        },
        2: {
          winner: 'player2',
          winnerScore: 3,
          skinsValue: '10.00', // 5.00 + 5.00 carry-over
          carriedOver: 1,
        },
        3: {
          winner: null,
          tied: true,
          tiedScore: 3,
          skinsValue: '5.00',
          carriedOver: 1,
        },
        4: {
          winner: 'player1',
          winnerScore: 2,
          skinsValue: '10.00', // 5.00 + 5.00 carry-over
          carriedOver: 1,
        },
      },
      playerSummary: {
        player1: { skinsWon: 2, totalValue: '10.00' },
        player2: { skinsWon: 2, totalValue: '10.00' },
      },
      totalCarryOver: 0,
    });
  });

  test('should calculate skins in correct order when round starts on different hole', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const startingHole = chance.integer({ min: 3, max: 7 });

    const mockRound = {
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: startingHole,
      hole_count: 9,
    };

    const mockPlayers = [
      {
        id: 'player1', user_id: userId, guest_name: null, is_guest: false, username: 'user1',
      },
      {
        id: 'player2', user_id: chance.integer({ min: 100, max: 200 }), guest_name: null, is_guest: false, username: 'user2',
      },
    ];

    // Create scores for all holes but with player1 winning the starting hole
    const mockScores = [];
    const mockPars = [];
    for (let hole = 1; hole <= 9; hole += 1) {
      const player1Strokes = hole === startingHole ? 2 : 4; // player1 wins starting hole
      const player2Strokes = hole === startingHole ? 3 : 4; // player2 loses starting hole

      mockScores.push(
        { player_id: 'player1', hole_number: hole, strokes: player1Strokes },
        { player_id: 'player2', hole_number: hole, strokes: player2Strokes },
      );
      mockPars.push({ hole_number: hole, par: 3 });
    }

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(roundId, userId);

    // player1 should win the first skin (on the starting hole)
    expect(result.holes[startingHole]).toEqual({
      winner: 'player1',
      winnerScore: 2,
      skinsValue: '5.00',
      carriedOver: 0,
    });

    // player1 should have 1 skin, player2 should have 0
    expect(result.playerSummary.player1.skinsWon).toBe(1);
    expect(result.playerSummary.player2.skinsWon).toBe(0);
  });
});
