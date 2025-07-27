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
    const player1Id = chance.string({ length: 10 });
    const player2Id = chance.string({ length: 10 });
    const player2UserId = chance.integer({ min: 1001, max: 2000 });
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 }).toString();
    const holeCount = chance.integer({ min: 9, max: 18 });
    const username1 = chance.word();
    const username2 = chance.word();

    const mockRound = {
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: skinsValue,
      starting_hole: 1,
      hole_count: holeCount,
    };

    const mockPlayers = [
      {
        id: player1Id, user_id: userId, guest_name: null, is_guest: false, username: username1,
      },
      {
        id: player2Id,
        user_id: player2UserId,
        guest_name: null,
        is_guest: false,
        username: username2,
      },
    ];

    const player1Hole1 = chance.integer({ min: 2, max: 4 });
    const player2Hole1 = player1Hole1 + 1; // player1 wins hole 1
    const player1Hole2 = chance.integer({ min: 3, max: 5 });
    const player2Hole2 = player1Hole2 - 1; // player2 wins hole 2
    const par1 = chance.integer({ min: 3, max: 5 });
    const par2 = chance.integer({ min: 3, max: 5 });

    const mockScores = [
      { player_id: player1Id, hole_number: 1, strokes: player1Hole1 },
      { player_id: player2Id, hole_number: 1, strokes: player2Hole1 },
      { player_id: player1Id, hole_number: 2, strokes: player1Hole2 },
      { player_id: player2Id, hole_number: 2, strokes: player2Hole2 },
    ];

    const mockPars = [
      { hole_number: 1, par: par1 },
      { hole_number: 2, par: par2 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers) // Players query
      .mockResolvedValueOnce(mockScores) // Scores query
      .mockResolvedValueOnce(mockPars); // Pars query

    const result = await skinsCalculateService(roundId, userId);

    const formattedSkinsValue = parseFloat(skinsValue).toFixed(2);

    expect(result).toEqual({
      roundId,
      skinsEnabled: true,
      skinsValue,
      holes: {
        1: {
          winner: player1Id,
          winnerScore: player1Hole1,
          skinsValue: formattedSkinsValue,
          carriedOver: 0,
        },
        2: {
          winner: player2Id,
          winnerScore: player2Hole2,
          skinsValue: formattedSkinsValue,
          carriedOver: 0,
        },
      },
      playerSummary: {
        [player1Id]: {
          skinsWon: 1,
          totalValue: formattedSkinsValue,
          moneyIn: parseFloat(skinsValue), // Won from 1 other player
          moneyOut: -parseFloat(skinsValue), // Paid to other player
          total: 0, // Won $X, paid $X = $0
        },
        [player2Id]: {
          skinsWon: 1,
          totalValue: formattedSkinsValue,
          moneyIn: parseFloat(skinsValue), // Won from 1 other player
          moneyOut: -parseFloat(skinsValue), // Paid to other player
          total: 0, // Won $X, paid $X = $0
        },
      },
      totalCarryOver: 0,
    });
  });

  test('should handle carry-over when holes tie', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const player1Id = chance.string({ length: 10 });
    const player2Id = chance.string({ length: 10 });
    const player2UserId = chance.integer({ min: 1001, max: 2000 });
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 }).toString();
    const holeCount = chance.integer({ min: 9, max: 18 });
    const username1 = chance.word();
    const username2 = chance.word();

    const mockRound = {
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: skinsValue,
      starting_hole: 1,
      hole_count: holeCount,
    };

    const mockPlayers = [
      {
        id: player1Id, user_id: userId, guest_name: null, is_guest: false, username: username1,
      },
      {
        id: player2Id,
        user_id: player2UserId,
        guest_name: null,
        is_guest: false,
        username: username2,
      },
    ];

    const tiedScore = chance.integer({ min: 3, max: 5 });
    const player2WinScore = chance.integer({ min: 2, max: 4 });
    const player1WinScore = chance.integer({ min: 2, max: 4 });
    const player2LoseScore = player1WinScore + chance.integer({ min: 1, max: 2 });
    const player1LoseScore = player2WinScore + chance.integer({ min: 1, max: 2 });

    const mockScores = [
      { player_id: player1Id, hole_number: 1, strokes: tiedScore }, // Tie
      { player_id: player2Id, hole_number: 1, strokes: tiedScore }, // Tie
      { player_id: player1Id, hole_number: 2, strokes: player1LoseScore },
      { player_id: player2Id, hole_number: 2, strokes: player2WinScore }, // Wins with 2 skins
      { player_id: player1Id, hole_number: 3, strokes: tiedScore }, // Tie
      { player_id: player2Id, hole_number: 3, strokes: tiedScore }, // Tie
      { player_id: player1Id, hole_number: 4, strokes: player1WinScore }, // Wins with 2 skins
      { player_id: player2Id, hole_number: 4, strokes: player2LoseScore },
    ];

    const mockPars = [
      { hole_number: 1, par: chance.integer({ min: 3, max: 5 }) },
      { hole_number: 2, par: chance.integer({ min: 3, max: 5 }) },
      { hole_number: 3, par: chance.integer({ min: 3, max: 5 }) },
      { hole_number: 4, par: chance.integer({ min: 3, max: 5 }) },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers) // Players query
      .mockResolvedValueOnce(mockScores) // Scores query
      .mockResolvedValueOnce(mockPars); // Pars query

    const result = await skinsCalculateService(roundId, userId);

    const baseSkinsValue = parseFloat(skinsValue);
    const numberOfPlayers = mockPlayers.length; // 2 players in this test
    const otherPlayers = numberOfPlayers - 1; // 1 other player
    // When winning with 1 carry-over: get money from other players + carry-over money
    const moneyFromCurrentHole = baseSkinsValue * otherPlayers; // $X from 1 other player
    const carryOverMoney = 1 * baseSkinsValue * otherPlayers; // 1 carry-over * $X * 1 other player
    const carryOverValue = moneyFromCurrentHole + carryOverMoney;

    const formattedBaseSkinsValue = parseFloat(skinsValue).toFixed(2);

    expect(result).toEqual({
      roundId,
      skinsEnabled: true,
      skinsValue,
      holes: {
        1: {
          winner: null,
          tied: true,
          tiedScore,
          skinsValue: formattedBaseSkinsValue,
          carriedOver: 0,
        },
        2: {
          winner: player2Id,
          winnerScore: player2WinScore,
          skinsValue: carryOverValue.toFixed(2), // base + carry-over
          carriedOver: 1,
        },
        3: {
          winner: null,
          tied: true,
          tiedScore,
          skinsValue: formattedBaseSkinsValue,
          carriedOver: 0,
        },
        4: {
          winner: player1Id,
          winnerScore: player1WinScore,
          skinsValue: carryOverValue.toFixed(2), // base + carry-over
          carriedOver: 1,
        },
      },
      playerSummary: {
        [player1Id]: {
          skinsWon: 2,
          totalValue: carryOverValue.toFixed(2),
          moneyIn: carryOverValue, // Won 2 skins from other player on hole 4 (1 + 1 carry-over)
          moneyOut: -carryOverValue, // Paid for 2 skins when losing hole 2 (1 + 1 carry-over)
          total: 0, // Perfect balance: moneyIn + moneyOut = 0
        },
        [player2Id]: {
          skinsWon: 2,
          totalValue: carryOverValue.toFixed(2),
          moneyIn: carryOverValue, // Won 2 skins from other player on hole 2 (1 + 1 carry-over)
          moneyOut: -carryOverValue, // Paid for 2 skins when losing hole 4 (1 + 1 carry-over)
          total: 0, // Perfect balance: moneyIn + moneyOut = 0
        },
      },
      totalCarryOver: 0,
    });
  });

  test('should properly reset carry-over when player wins after multiple ties', async () => {
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
      {
        id: 'player3', user_id: 888, guest_name: null, is_guest: true, username: null,
      },
    ];

    // Reproduce the exact scenario: win, win, tie, tie, win
    const mockScores = [
      { player_id: 'player1', hole_number: 1, strokes: 2 }, // player1 wins hole 1
      { player_id: 'player2', hole_number: 1, strokes: 3 },
      { player_id: 'player3', hole_number: 1, strokes: 4 },

      { player_id: 'player1', hole_number: 2, strokes: 2 }, // player1 wins hole 2
      { player_id: 'player2', hole_number: 2, strokes: 3 },
      { player_id: 'player3', hole_number: 2, strokes: 4 },

      { player_id: 'player1', hole_number: 3, strokes: 3 }, // TIE on hole 3
      { player_id: 'player2', hole_number: 3, strokes: 3 },
      { player_id: 'player3', hole_number: 3, strokes: 4 },

      { player_id: 'player1', hole_number: 4, strokes: 3 }, // TIE on hole 4
      { player_id: 'player2', hole_number: 4, strokes: 3 },
      { player_id: 'player3', hole_number: 4, strokes: 4 },

      { player_id: 'player1', hole_number: 5, strokes: 3 },
      { player_id: 'player2', hole_number: 5, strokes: 2 }, // player2 wins hole 5 with carry-over
      { player_id: 'player3', hole_number: 5, strokes: 4 },
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 3 },
      { hole_number: 3, par: 3 },
      { hole_number: 4, par: 3 },
      { hole_number: 5, par: 3 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(roundId, userId);

    // Check that carry-over is properly reset to 0
    expect(result.totalCarryOver).toBe(0);

    // Check that player2 got 3 skins total (1 + 2 carry-over)
    expect(result.playerSummary.player2.skinsWon).toBe(3);

    // Check that player1 got 2 skins
    expect(result.playerSummary.player1.skinsWon).toBe(2);

    // Check that player3 got 0 skins
    expect(result.playerSummary.player3.skinsWon).toBe(0);
  });

  test('should reproduce user exact bug: salokod vs john doe skins scenario', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = '9e6b12e8-97f2-405e-a028-3e9141acdb3b';
    const userId = chance.integer({ min: 1, max: 1000 });
    const salokodId = 'e9cc7f50-53ab-4bdc-ba3d-241a9a5ab413';
    const johnDoeId = '9d9910ae-3710-45cc-9774-de004a888013';
    const johnDo2eId = '31362bb1-b717-45da-a5c6-a51f56601994';

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
        id: salokodId, user_id: userId, guest_name: null, is_guest: false, username: 'salokod',
      },
      {
        id: johnDoeId, user_id: chance.integer({ min: 1001, max: 2000 }), guest_name: 'John Doe', is_guest: true, username: null,
      },
      {
        id: johnDo2eId, user_id: chance.integer({ min: 2001, max: 3000 }), guest_name: 'John Do2e', is_guest: true, username: null,
      },
    ];

    // Exact scores from user's data
    const mockScores = [
      { player_id: salokodId, hole_number: 1, strokes: 2 }, // salokod wins hole 1
      { player_id: johnDoeId, hole_number: 1, strokes: 3 },

      { player_id: salokodId, hole_number: 2, strokes: 2 }, // salokod wins hole 2
      { player_id: johnDoeId, hole_number: 2, strokes: 3 },

      { player_id: salokodId, hole_number: 3, strokes: 3 }, // TIE on hole 3
      { player_id: johnDoeId, hole_number: 3, strokes: 3 },

      { player_id: salokodId, hole_number: 4, strokes: 3 }, // TIE on hole 4
      { player_id: johnDoeId, hole_number: 4, strokes: 3 },

      { player_id: salokodId, hole_number: 5, strokes: 3 },
      { player_id: johnDoeId, hole_number: 5, strokes: 2 },
      // NOTE: John Do2e has NO scores for any hole
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 3 },
      { hole_number: 3, par: 3 },
      { hole_number: 4, par: 3 },
      { hole_number: 5, par: 3 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(roundId, userId);

    // EXPECTED CORRECT RESULTS:
    // After john doe wins hole 5, carry-over should be 0
    expect(result.totalCarryOver).toBe(0);

    // John doe should get 3 skins total (1 + 2 carry-over)
    expect(result.playerSummary[johnDoeId].skinsWon).toBe(3);
    expect(result.playerSummary[johnDoeId].totalValue).toBe('15.00'); // 5 + 10 carry-over

    // Salokod should have 2 skins from holes 1 and 2
    expect(result.playerSummary[salokodId].skinsWon).toBe(2);
    expect(result.playerSummary[salokodId].totalValue).toBe('10.00');

    // John Do2e should have 0 skins (no scores)
    expect(result.playerSummary[johnDo2eId].skinsWon).toBe(0);

    // Hole 5 should show correct carry-over and value
    expect(result.holes[5]).toEqual({
      winner: johnDoeId,
      winnerScore: 2,
      skinsValue: '15.00', // 5 + 10 carry-over
      carriedOver: 2, // 2 skins carried into this hole
    });
  });

  test('should debug carry-over bug: 3 players, 1 with no scores, carry-over scenario', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const salokodId = chance.string({ length: 10, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const johnDoeId = chance.string({ length: 10, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const johnDo2eId = chance.string({ length: 10, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const johnDoeUserId = chance.integer({ min: 1001, max: 2000 });
    const johnDo2eUserId = chance.integer({ min: 2001, max: 3000 });

    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 }).toString();
    const startingHole = 1;
    const holeCount = chance.integer({ min: 9, max: 18 });
    const username1 = chance.word();
    const guestName1 = chance.name();
    const guestName2 = chance.name();

    const mockRound = {
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: skinsValue,
      starting_hole: startingHole,
      hole_count: holeCount,
    };

    const mockPlayers = [
      {
        id: salokodId, user_id: userId, guest_name: null, is_guest: false, username: username1,
      },
      {
        id: johnDoeId,
        user_id: johnDoeUserId,
        guest_name: guestName1,
        is_guest: true,
        username: null,
      },
      {
        id: johnDo2eId,
        user_id: johnDo2eUserId,
        guest_name: guestName2,
        is_guest: true,
        username: null,
      },
    ];

    // Exact scenario: player1 wins 1+2, tie on 3+4 (only player1 vs player2), player2 wins 5
    // Player3 has NO scores at all
    const player1Hole1 = chance.integer({ min: 2, max: 4 });
    const player2Hole1 = player1Hole1 + 1;
    const player1Hole2 = chance.integer({ min: 2, max: 4 });
    const player2Hole2 = player1Hole2 + 1;
    const tiedHole3Score = chance.integer({ min: 3, max: 5 });
    const tiedHole4Score = chance.integer({ min: 2, max: 4 });
    const player2Hole5 = chance.integer({ min: 2, max: 4 });
    const player1Hole5 = player2Hole5 + 1;

    const mockScores = [
      { player_id: salokodId, hole_number: 1, strokes: player1Hole1 }, // player1 wins hole 1
      { player_id: johnDoeId, hole_number: 1, strokes: player2Hole1 },

      { player_id: salokodId, hole_number: 2, strokes: player1Hole2 }, // player1 wins hole 2
      { player_id: johnDoeId, hole_number: 2, strokes: player2Hole2 },

      { player_id: salokodId, hole_number: 3, strokes: tiedHole3Score }, // TIE on hole 3
      { player_id: johnDoeId, hole_number: 3, strokes: tiedHole3Score },

      { player_id: salokodId, hole_number: 4, strokes: tiedHole4Score },
      { player_id: johnDoeId, hole_number: 4, strokes: tiedHole4Score },

      { player_id: salokodId, hole_number: 5, strokes: player1Hole5 },
      { player_id: johnDoeId, hole_number: 5, strokes: player2Hole5 },
      // NOTE: Player3 has NO scores for any hole
    ];

    const mockPars = [
      { hole_number: 1, par: chance.integer({ min: 3, max: 5 }) },
      { hole_number: 2, par: chance.integer({ min: 3, max: 5 }) },
      { hole_number: 3, par: chance.integer({ min: 3, max: 5 }) },
      { hole_number: 4, par: chance.integer({ min: 3, max: 5 }) },
      { hole_number: 5, par: chance.integer({ min: 3, max: 5 }) },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(roundId, userId);

    // After john doe wins hole 5, carry-over should be 0
    expect(result.totalCarryOver).toBe(0);

    const baseSkinsValue = parseFloat(skinsValue);
    const carryOverValue = baseSkinsValue * 2; // 2 skins carried over
    const totalHole5Value = baseSkinsValue + carryOverValue;

    // Player2 should get 3 skins total (1 + 2 carry-over)
    expect(result.playerSummary[johnDoeId].skinsWon).toBe(3);
    expect(result.playerSummary[johnDoeId].totalValue).toBe(totalHole5Value.toFixed(2));

    // Player1 should have 2 skins from holes 1 and 2
    expect(result.playerSummary[salokodId].skinsWon).toBe(2);

    // Player3 should have 0 skins (no scores)
    expect(result.playerSummary[johnDo2eId].skinsWon).toBe(0);

    // Hole 5 should show correct carry-over and value
    expect(result.holes[5]).toEqual({
      winner: johnDoeId,
      winnerScore: player2Hole5,
      skinsValue: totalHole5Value.toFixed(2),
      carriedOver: 2,
    });
  });

  test('should correctly show carriedOver value of 1 for each tied hole', async () => {
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
      { player_id: 'player1', hole_number: 2, strokes: 3 }, // Tie
      { player_id: 'player2', hole_number: 2, strokes: 3 }, // Tie
      { player_id: 'player1', hole_number: 3, strokes: 4 },
      { player_id: 'player2', hole_number: 3, strokes: 2 }, // Wins with 3 total skins
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 3 },
      { hole_number: 3, par: 3 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(roundId, userId);

    // Each tied hole should show carriedOver: number of skins carried INTO it
    expect(result.holes[1]).toEqual({
      winner: null,
      tied: true,
      tiedScore: 3,
      skinsValue: '5.00',
      carriedOver: 0, // First hole, no skins carried in
    });

    expect(result.holes[2]).toEqual({
      winner: null,
      tied: true,
      tiedScore: 3,
      skinsValue: '5.00',
      carriedOver: 1, // 1 skin carried in from hole 1
    });

    // The winning hole should get all 3 skins (base + 2 carried)
    expect(result.holes[3]).toEqual({
      winner: 'player2',
      winnerScore: 2,
      skinsValue: '15.00', // 5.00 base + 10.00 carried (2 skins * 5.00)
      carriedOver: 2, // Shows how many skins were carried INTO this hole
    });

    // Player summary should reflect 3 total skins won
    expect(result.playerSummary.player2.skinsWon).toBe(3);
    expect(result.playerSummary.player2.totalValue).toBe('15.00');
    expect(result.playerSummary.player1.skinsWon).toBe(0);
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

    // player1 should have 9 skins (1 direct win + 8 carry-overs), player2 should have 0
    // All carry-overs go to player1 since they're the only winner at end of round
    expect(result.playerSummary.player1.skinsWon).toBe(9);
    expect(result.playerSummary.player2.skinsWon).toBe(0);

    // All carry-overs should be distributed at end of round
    expect(result.totalCarryOver).toBe(0);
  });

  test('should handle carry-over correctly for round starting on hole 5 with ties and wins', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;

    const roundId = '109d3d4e-99ac-46af-b33a-3ab4823d2c0b';
    const userId = 4;
    const player1Id = '8a0603d7-f157-4333-9572-ff6b312744a4'; // salokod
    const player2Id = '985b3e8d-842d-4b42-8503-6c65bbc23e55'; // John Doe
    const player3Id = '4ac0a791-33b7-44c2-916c-3f1e249e2b6c'; // John Do2e

    const mockRound = {
      id: roundId,
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: 5,
      hole_count: 9,
    };

    const mockPlayers = [
      {
        id: player1Id, user_id: userId, guest_name: null, is_guest: false, username: 'salokod',
      },
      {
        id: player2Id, user_id: null, guest_name: 'John Doe', is_guest: true, username: null,
      },
      {
        id: player3Id, user_id: null, guest_name: 'John Do2e', is_guest: true, username: null,
      },
    ];

    // Scores from user's actual data
    const mockScores = [
      // Hole 1: Tie between players 2 and 3 (both 3)
      { player_id: player2Id, hole_number: 1, strokes: 3 },
      { player_id: player3Id, hole_number: 1, strokes: 3 },

      // Hole 2: Tie between players 2 and 3 (both 3)
      { player_id: player2Id, hole_number: 2, strokes: 3 },
      { player_id: player3Id, hole_number: 2, strokes: 3 },

      // Hole 3: Player 2 wins with 3, player 3 gets 4
      { player_id: player2Id, hole_number: 3, strokes: 3 },
      { player_id: player3Id, hole_number: 3, strokes: 4 },

      // Hole 5: Player 3 wins with 2, player 2 gets 3
      { player_id: player2Id, hole_number: 5, strokes: 3 },
      { player_id: player3Id, hole_number: 5, strokes: 2 },

      // Hole 6: Player 3 wins with 2, player 2 gets 3
      { player_id: player2Id, hole_number: 6, strokes: 3 },
      { player_id: player3Id, hole_number: 6, strokes: 2 },

      // Hole 7: Tie between players 2 and 3 (both 3)
      { player_id: player2Id, hole_number: 7, strokes: 3 },
      { player_id: player3Id, hole_number: 7, strokes: 3 },

      // Hole 8: Player 2 wins with 2, player 3 gets 3
      { player_id: player2Id, hole_number: 8, strokes: 2 },
      { player_id: player3Id, hole_number: 8, strokes: 3 },

      // Hole 9: Tie between players 2 and 3 (both 3)
      { player_id: player2Id, hole_number: 9, strokes: 3 },
      { player_id: player3Id, hole_number: 9, strokes: 3 },
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 3 },
      { hole_number: 3, par: 3 },
      { hole_number: 5, par: 3 },
      { hole_number: 6, par: 3 },
      { hole_number: 7, par: 3 },
      { hole_number: 8, par: 3 },
      { hole_number: 9, par: 3 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(roundId, userId);

    // Play order: 5→6→7→8→9→1→2→3
    // Expected results:
    // Hole 5: Player 3 wins (no carry-over)
    expect(result.holes[5]).toEqual({
      winner: player3Id,
      winnerScore: 2,
      skinsValue: '5.00',
      carriedOver: 0,
    });

    // Hole 6: Player 3 wins (no carry-over)
    expect(result.holes[6]).toEqual({
      winner: player3Id,
      winnerScore: 2,
      skinsValue: '5.00',
      carriedOver: 0,
    });

    // Hole 7: Tie, carries 0 skins into it, carries 1 to hole 8
    expect(result.holes[7]).toEqual({
      winner: null,
      tied: true,
      tiedScore: 3,
      skinsValue: '5.00',
      carriedOver: 0, // No skins carried INTO hole 7
    });

    // Hole 8: Player 2 wins with carry-over from hole 7
    expect(result.holes[8]).toEqual({
      winner: player2Id,
      winnerScore: 2,
      skinsValue: '10.00', // 5.00 + 5.00 carry-over
      carriedOver: 1, // 1 skin carried INTO hole 8 from hole 7
    });

    // Hole 9: Tie, carries 0 skins into it, carries 1 to hole 1
    expect(result.holes[9]).toEqual({
      winner: null,
      tied: true,
      tiedScore: 3,
      skinsValue: '5.00',
      carriedOver: 0, // No skins carried INTO hole 9
    });

    // Hole 1: Tie, receives 1 from hole 9, carries 2 to hole 2
    expect(result.holes[1]).toEqual({
      winner: null,
      tied: true,
      tiedScore: 3,
      skinsValue: '5.00',
      carriedOver: 1, // 1 skin carried INTO this hole from hole 9
    });

    // Hole 2: Tie, receives 2 from hole 1, carries 3 to hole 3
    expect(result.holes[2]).toEqual({
      winner: null,
      tied: true,
      tiedScore: 3,
      skinsValue: '5.00',
      carriedOver: 2, // 2 skins carried INTO this hole from hole 1
    });

    // Hole 3: Player 2 wins with all carried over skins
    expect(result.holes[3]).toEqual({
      winner: player2Id,
      winnerScore: 3,
      skinsValue: '20.00', // 5.00 + 15.00 carry-over (3 skins)
      carriedOver: 3,
    });

    // Player summary
    expect(result.playerSummary[player1Id]).toEqual({
      skinsWon: 0,
      totalValue: '0.00',
      moneyIn: 0, // Won nothing
      moneyOut: 0, // Paid nothing (didn't play any holes)
      total: 0, // $0
    });

    expect(result.playerSummary[player2Id]).toEqual({
      skinsWon: 6, // 2 from hole 8 + 4 from hole 3
      totalValue: '30.00', // 10.00 + 20.00
      moneyIn: 30, // Won $10 on hole 8 + $20 on hole 3 (with carries)
      moneyOut: -10, // Paid $5 on hole 5 + $5 on hole 6 (when losing to player3)
      total: 20, // $30 - $10 = $20
    });

    expect(result.playerSummary[player3Id]).toEqual({
      skinsWon: 2, // 1 from hole 5 + 1 from hole 6
      totalValue: '10.00', // 5.00 + 5.00
      moneyIn: 10, // Won money on holes 5 and 6 (actual calculation)
      moneyOut: -30, // Paid for losses on holes 8 and 3 (actual calculation)
      total: -20, // $10 - $30 = -$20 (balances the round: $0 + $20 + (-$20) = $0)
    });

    expect(result.totalCarryOver).toBe(0);
  });

  test('should include moneyIn, moneyOut, and total in playerSummary', async () => {
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const { queryOne, queryRows } = await import('../../../lib/database.js');

    const userId = 123;
    const mockRound = {
      id: 'round-123',
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: 1,
      hole_count: 9,
    };
    const mockPlayers = [
      { id: 'player1', user_id: userId, guest_name: null },
      { id: 'player2', user_id: 456, guest_name: null },
    ];

    const mockScores = [
      { player_id: 'player1', hole_number: 1, strokes: 3 },
      { player_id: 'player2', hole_number: 1, strokes: 4 }, // player1 wins
    ];

    const mockPars = [{ hole_number: 1, par: 3 }];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(chance.guid(), userId);

    // Check that moneyIn, moneyOut, and total exist in playerSummary
    expect(result.playerSummary.player1).toHaveProperty('moneyIn');
    expect(result.playerSummary.player1).toHaveProperty('moneyOut');
    expect(result.playerSummary.player1).toHaveProperty('total');
    expect(result.playerSummary.player2).toHaveProperty('moneyIn');
    expect(result.playerSummary.player2).toHaveProperty('moneyOut');
    expect(result.playerSummary.player2).toHaveProperty('total');
  });

  test('should calculate money flow correctly with moneyIn and moneyOut', async () => {
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const { queryOne, queryRows } = await import('../../../lib/database.js');

    const userId = 123;
    const mockRound = {
      id: chance.guid(),
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: 1,
      hole_count: 2,
    };
    const mockPlayers = [
      { id: 'player1', user_id: userId, guest_name: null },
      { id: 'player2', user_id: 456, guest_name: null },
    ];

    const mockScores = [
      { player_id: 'player1', hole_number: 1, strokes: 3 },
      { player_id: 'player2', hole_number: 1, strokes: 4 }, // player1 wins hole 1
      { player_id: 'player1', hole_number: 2, strokes: 4 },
      { player_id: 'player2', hole_number: 2, strokes: 3 }, // player2 wins hole 2
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 3 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(mockRound.id, userId);

    // Player 1: Won $5 on hole 1, paid $5 on hole 2
    expect(result.playerSummary.player1.moneyIn).toBe(5);
    expect(result.playerSummary.player1.moneyOut).toBe(-5);
    expect(result.playerSummary.player1.total).toBe(0);

    // Player 2: Won $5 on hole 2, paid $5 on hole 1
    expect(result.playerSummary.player2.moneyIn).toBe(5);
    expect(result.playerSummary.player2.moneyOut).toBe(-5);
    expect(result.playerSummary.player2.total).toBe(0);
  });

  test('should award end-of-round carry-over to leading player', async () => {
    const skinsCalculateService = (await import('../../../services/skins.calculate.service.js')).default;
    const { queryOne, queryRows } = await import('../../../lib/database.js');

    const userId = 123;
    const mockRound = {
      id: chance.guid(),
      created_by_id: userId,
      skins_enabled: true,
      skins_value: '5.00',
      starting_hole: 1,
      hole_count: 3,
    };

    const player1Id = 'player1';
    const player2Id = 'player2';

    const mockPlayers = [
      { id: player1Id, user_id: userId, guest_name: null },
      { id: player2Id, user_id: 456, guest_name: null },
    ];

    // Player 1 wins holes 1&2, hole 3 ties (carry-over should go to player 1 who has 2+ skins)
    const mockScores = [
      { player_id: player1Id, hole_number: 1, strokes: 3 },
      { player_id: player2Id, hole_number: 1, strokes: 4 }, // player1 wins hole 1
      { player_id: player1Id, hole_number: 2, strokes: 3 },
      { player_id: player2Id, hole_number: 2, strokes: 4 }, // player1 wins hole 2
      { player_id: player1Id, hole_number: 3, strokes: 4 },
      { player_id: player2Id, hole_number: 3, strokes: 4 }, // tie on hole 3 (final hole)
    ];

    const mockPars = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 4 },
      { hole_number: 3, par: 4 },
    ];

    queryOne.mockResolvedValueOnce(mockRound);
    queryRows
      .mockResolvedValueOnce(mockPlayers)
      .mockResolvedValueOnce(mockScores)
      .mockResolvedValueOnce(mockPars);

    const result = await skinsCalculateService(mockRound.id, userId);

    // Player 1 should get: 2 skins from holes 1&2 + 1 carry-over skin from hole 3 = 3 total
    expect(result.playerSummary[player1Id].skinsWon).toBe(3);
    expect(result.playerSummary[player1Id].totalValue).toBe('15.00'); // 3 skins × $5
    expect(result.playerSummary[player1Id].moneyIn).toBe(10); // Won money from holes 1&2
    expect(result.playerSummary[player1Id].moneyOut).toBe(0); // Never lost a hole, so no money out
    expect(result.playerSummary[player1Id].total).toBe(10); // $10 - $0 = $10

    // Player 2 should get nothing
    expect(result.playerSummary[player2Id].skinsWon).toBe(0);
    expect(result.playerSummary[player2Id].totalValue).toBe('0.00');
    expect(result.playerSummary[player2Id].moneyIn).toBe(0); // Won nothing
    expect(result.playerSummary[player2Id].moneyOut).toBe(-10);
    expect(result.playerSummary[player2Id].total).toBe(-10); // $0 - $10 = -$10

    // Total carry-over should be 0 (all distributed)
    expect(result.totalCarryOver).toBe(0);
  });
});
