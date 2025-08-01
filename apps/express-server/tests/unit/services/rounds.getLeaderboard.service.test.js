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

// Mock the skins calculate service
vi.mock('../../../services/skins.calculate.service.js', () => ({
  default: vi.fn(),
}));

// Mock the side bets list service
vi.mock('../../../services/sideBets.list.service.js', () => ({
  default: vi.fn(),
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
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId, hole_count: 18 })
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
      hole_count: 18,
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
          moneyIn: 0,
          moneyOut: 0,
          total: 0,
          sideBetsWon: 0,
          sideBetsNetGain: 0,
          overallNetGain: 0,
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
          moneyIn: 0,
          moneyOut: 0,
          total: 0,
          sideBetsWon: 0,
          sideBetsNetGain: 0,
          overallNetGain: 0,
        },
      ],
      roundSettings: {
        skinsEnabled: true,
        skinsValue: '5.00',
        currentCarryOver: 0, // Placeholder
      },
    });
  });

  test('should integrate skins data into player objects when skins are enabled', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 }).toString();
    const player1SkinsWon = chance.integer({ min: 1, max: 5 });
    const player2SkinsWon = chance.integer({ min: 1, max: 5 });
    const carryOver = chance.integer({ min: 0, max: 3 });

    // Mock skins calculation response
    const mockSkinsResult = {
      roundId,
      skinsEnabled: true,
      skinsValue,
      playerSummary: {
        [playerId1]: {
          skinsWon: player1SkinsWon,
          totalValue: (parseFloat(skinsValue) * player1SkinsWon).toFixed(2),
          moneyIn: parseFloat(skinsValue) * player1SkinsWon,
          moneyOut: -5,
          total: (parseFloat(skinsValue) * player1SkinsWon) - 5,
        },
        [playerId2]: {
          skinsWon: player2SkinsWon,
          totalValue: (parseFloat(skinsValue) * player2SkinsWon).toFixed(2),
          moneyIn: parseFloat(skinsValue) * player2SkinsWon,
          moneyOut: 2.5,
          total: (parseFloat(skinsValue) * player2SkinsWon) + 2.5,
        },
      },
      totalCarryOver: carryOver,
    };

    skinsCalculateService.mockResolvedValueOnce(mockSkinsResult);

    // Mock round with skins enabled
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: skinsValue,
      hole_count: 9,
    });

    // Mock players
    const player1Username = chance.word();
    const player2GuestName = `${chance.first()} ${chance.last()}`;
    queryRows.mockResolvedValueOnce([
      {
        id: playerId1, username: player1Username, guest_name: null, is_guest: false,
      },
      {
        id: playerId2, username: null, guest_name: player2GuestName, is_guest: true,
      },
    ]);

    // Mock scores - simple one hole each
    queryRows.mockResolvedValueOnce([
      { player_id: playerId1, hole_number: 1, strokes: 3 },
      { player_id: playerId2, hole_number: 1, strokes: 4 },
    ]);

    // Mock pars
    queryRows.mockResolvedValueOnce([
      { hole_number: 1, par: 3 },
    ]);

    const result = await getLeaderboardService(roundId, userId);

    // Verify skins data is integrated into player objects
    expect(result.players[0].skinsWon).toBe(player1SkinsWon);
    expect(result.players[1].skinsWon).toBe(player2SkinsWon);

    // Verify money flow is included in player objects
    expect(result.players[0].moneyIn).toBe(parseFloat(skinsValue) * player1SkinsWon);
    expect(result.players[0].moneyOut).toBe(-5);
    expect(result.players[0].total).toBe((parseFloat(skinsValue) * player1SkinsWon) - 5);
    expect(result.players[1].moneyIn).toBe(parseFloat(skinsValue) * player2SkinsWon);
    expect(result.players[1].moneyOut).toBe(2.5);
    expect(result.players[1].total).toBe((parseFloat(skinsValue) * player2SkinsWon) + 2.5);

    // Verify round settings include real carry-over
    expect(result.roundSettings.currentCarryOver).toBe(carryOver);
  });

  test('should call skins calculation service when skins are enabled', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 }).toString();

    // Mock skins calculation response
    const mockSkinsResult = {
      roundId,
      skinsEnabled: true,
      skinsValue,
      playerSummary: {
        [playerId1]: {
          skinsWon: 2,
          totalValue: (parseFloat(skinsValue) * 2).toFixed(2),
          moneyIn: parseFloat(skinsValue) * 2,
          moneyOut: 0,
          total: parseFloat(skinsValue) * 2,
        },
        [playerId2]: {
          skinsWon: 1,
          totalValue: skinsValue,
          moneyIn: parseFloat(skinsValue),
          moneyOut: -2.5,
          total: parseFloat(skinsValue) - 2.5,
        },
      },
      totalCarryOver: 0,
    };

    skinsCalculateService.mockResolvedValueOnce(mockSkinsResult);

    // Mock round with skins enabled
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: skinsValue,
      hole_count: 9,
    });

    // Mock players
    queryRows.mockResolvedValueOnce([
      {
        id: playerId1, username: chance.word(), guest_name: null, is_guest: false,
      },
      {
        id: playerId2, username: chance.word(), guest_name: null, is_guest: false,
      },
    ]);

    // Mock empty scores and pars
    queryRows.mockResolvedValueOnce([]);
    queryRows.mockResolvedValueOnce([]);

    await getLeaderboardService(roundId, userId);

    // Verify skins service was called with correct parameters
    expect(skinsCalculateService).toHaveBeenCalledWith(roundId, userId);
  });

  test('should not call skins service when skins are disabled', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    // Mock round with skins DISABLED
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: false,
      skins_value: null,
      hole_count: 9,
    });

    // Mock player
    queryRows.mockResolvedValueOnce([
      {
        id: playerId, username: chance.word(), guest_name: null, is_guest: false,
      },
    ]);

    // Mock empty scores and pars
    queryRows.mockResolvedValueOnce([]);
    queryRows.mockResolvedValueOnce([]);

    const result = await getLeaderboardService(roundId, userId);

    // Verify skins service was NOT called
    expect(skinsCalculateService).not.toHaveBeenCalled();

    // Verify default values are used
    expect(result.players[0].skinsWon).toBe(0);
    expect(result.roundSettings.currentCarryOver).toBe(0);
  });

  test('should handle skins calculation failure gracefully', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    // Mock skins calculation to throw error
    skinsCalculateService.mockRejectedValueOnce(new Error('Skins calculation failed'));

    // Mock round with skins enabled
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      hole_count: 9,
    });

    // Mock player
    queryRows.mockResolvedValueOnce([
      {
        id: playerId, username: chance.word(), guest_name: null, is_guest: false,
      },
    ]);

    // Mock empty scores and pars
    queryRows.mockResolvedValueOnce([]);
    queryRows.mockResolvedValueOnce([]);

    const result = await getLeaderboardService(roundId, userId);

    // Should not throw, but use default values
    expect(result.players[0].skinsWon).toBe(0);
    expect(result.roundSettings.currentCarryOver).toBe(0);
  });

  test('should integrate side bet data into leaderboard players', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();

    // Mock side bets response
    const mockSideBetsResult = {
      roundId,
      sideBets: [
        {
          id: chance.guid(),
          name: 'Test Bet',
          amount: '10.00',
          status: 'completed',
          participants: [
            { playerId: playerId1, isWinner: true },
            { playerId: playerId2, isWinner: false },
          ],
        },
      ],
      playerSummary: [
        {
          playerId: playerId1,
          moneyIn: '10.00',
          moneyOut: '0.00',
          total: '10.00',
          betCount: 1,
        },
        {
          playerId: playerId2,
          moneyIn: '0.00',
          moneyOut: '10.00',
          total: '-10.00',
          betCount: 1,
        },
      ],
    };

    sideBetsListService.mockResolvedValueOnce(mockSideBetsResult);

    // Mock round without skins
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: false,
      skins_value: null,
      hole_count: 9,
    });

    // Mock players
    queryRows.mockResolvedValueOnce([
      {
        id: playerId1, username: 'player1', guest_name: null, is_guest: false,
      },
      {
        id: playerId2, username: 'player2', guest_name: null, is_guest: false,
      },
    ]);

    // Mock empty scores and pars
    queryRows.mockResolvedValueOnce([]);
    queryRows.mockResolvedValueOnce([]);

    const result = await getLeaderboardService(roundId, userId);

    // Verify side bet data is integrated
    expect(result.players[0]).toMatchObject({
      sideBetsWon: 1,
      sideBetsNetGain: 10.00,
      overallNetGain: 10.00, // No skins, so same as side bet gain
    });
    expect(result.players[1]).toMatchObject({
      sideBetsWon: 0,
      sideBetsNetGain: -10.00,
      overallNetGain: -10.00,
    });
  });

  test('should combine skins and side bet gains in overallNetGain', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();

    // Mock skins response
    const mockSkinsResult = {
      roundId,
      skinsEnabled: true,
      skinsValue: '5.00',
      playerSummary: {
        [playerId1]: {
          skinsWon: 2,
          totalValue: '10.00',
          moneyIn: 10,
          moneyOut: -3,
          total: 7, // Net +7 from skins
        },
      },
      totalCarryOver: 0,
    };

    // Mock side bets response
    const mockSideBetsResult = {
      roundId,
      sideBets: [
        {
          id: chance.guid(),
          name: 'Test Bet',
          amount: '15.00',
          status: 'completed',
          participants: [
            { playerId: playerId1, isWinner: true },
          ],
        },
      ],
      playerSummary: [
        {
          playerId: playerId1,
          moneyIn: '15.00',
          moneyOut: '0.00',
          total: '15.00', // Net +15 from side bets
          betCount: 1,
        },
      ],
    };

    skinsCalculateService.mockResolvedValueOnce(mockSkinsResult);
    sideBetsListService.mockResolvedValueOnce(mockSideBetsResult);

    // Mock round with skins enabled
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      hole_count: 9,
    });

    // Mock player
    queryRows.mockResolvedValueOnce([
      {
        id: playerId1, username: 'player1', guest_name: null, is_guest: false,
      },
    ]);

    // Mock empty scores and pars
    queryRows.mockResolvedValueOnce([]);
    queryRows.mockResolvedValueOnce([]);

    const result = await getLeaderboardService(roundId, userId);

    // Verify combined gains
    expect(result.players[0]).toMatchObject({
      skinsWon: 2,
      total: 7, // Skins net gain
      sideBetsWon: 1,
      sideBetsNetGain: 15, // Side bet net gain
      overallNetGain: 22, // 7 + 15 = 22 total
    });
  });

  test('should cap currentHole at course hole count when round is complete', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const holeCount = chance.integer({ min: 6, max: 12 });
    const username = chance.word();
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 }).toString();

    // Mock course with random hole count
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
      skins_enabled: chance.bool(),
      skins_value: skinsValue,
      hole_count: holeCount,
    });

    // Mock player
    queryRows.mockResolvedValueOnce([
      {
        id: playerId, username, guest_name: null, is_guest: false,
      },
    ]);

    // Mock scores - player completed all holes
    const scores = [];
    let totalStrokes = 0;
    for (let hole = 1; hole <= holeCount; hole += 1) {
      const strokes = chance.integer({ min: 1, max: 7 });
      scores.push({ player_id: playerId, hole_number: hole, strokes });
      totalStrokes += strokes;
    }
    queryRows.mockResolvedValueOnce(scores);

    // Mock pars for all holes
    const pars = [];
    let totalPar = 0;
    for (let hole = 1; hole <= holeCount; hole += 1) {
      const par = chance.integer({ min: 3, max: 5 });
      pars.push({ hole_number: hole, par });
      totalPar += par;
    }
    queryRows.mockResolvedValueOnce(pars);

    const result = await getLeaderboardService(roundId, userId);

    expect(result.players[0]).toEqual({
      playerId,
      username,
      guestName: null,
      isGuest: false,
      position: 1,
      totalStrokes,
      totalPar,
      relativeScore: totalStrokes - totalPar,
      holesCompleted: holeCount,
      currentHole: holeCount, // Should cap at holeCount, not exceed it
      skinsWon: 0,
      moneyIn: 0,
      moneyOut: 0,
      total: 0,
      sideBetsWon: 0,
      sideBetsNetGain: 0,
      overallNetGain: 0,
    });
  });
});
