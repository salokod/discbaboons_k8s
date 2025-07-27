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

describe('sideBets.list.service.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const sideBetsListService = await import('../../../services/sideBets.list.service.js');
    expect(typeof sideBetsListService.default).toBe('function');
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(sideBetsListService(null, userId))
      .rejects.toThrow('Round ID is required');

    await expect(sideBetsListService(undefined, userId))
      .rejects.toThrow('Round ID is required');

    await expect(sideBetsListService('', userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId format is invalid', async () => {
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;
    const userId = chance.integer({ min: 1, max: 1000 });
    const invalidRoundId = chance.word();

    await expect(sideBetsListService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when userId is missing or invalid', async () => {
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;
    const validRoundId = chance.guid();

    await expect(sideBetsListService(validRoundId, null))
      .rejects.toThrow('User ID is required');

    await expect(sideBetsListService(validRoundId, undefined))
      .rejects.toThrow('User ID is required');

    await expect(sideBetsListService(validRoundId, 0))
      .rejects.toThrow('User ID must be a valid number');

    await expect(sideBetsListService(validRoundId, -1))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce(null); // Round not found

    await expect(sideBetsListService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not participant', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 1001, max: 2000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId })
      .mockResolvedValueOnce(null); // User not a player

    await expect(sideBetsListService(roundId, userId))
      .rejects.toThrow('You must be a participant in this round to view side bets');
  });

  test('should return basic structure when user is round creator', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock round exists and user is creator
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    // Mock empty side bets query
    queryRows
      .mockResolvedValueOnce([]) // Empty side bets
      .mockResolvedValueOnce([]); // Empty players

    const result = await sideBetsListService(roundId, userId);

    expect(result).toEqual({
      roundId,
      sideBets: [],
      playerSummary: [],
    });
  });

  test('should fetch and return side bets with participants and player summaries', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betId = chance.guid();
    const betName = chance.sentence({ words: 3 });
    const betAmount = '5.00';
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();
    const userId2 = chance.integer({ min: 1001, max: 2000 });

    // Mock round exists and user is creator
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    // Mock side bets query
    queryRows
      .mockResolvedValueOnce([
        {
          id: betId,
          name: betName,
          description: 'Test bet description',
          amount: betAmount,
          bet_type: 'hole',
          hole_number: 1,
          created_by_id: playerId1,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z',
          cancelled_at: null,
          cancelled_by_id: null,
        },
      ])
      .mockResolvedValueOnce([
        // Mock participants query for the bet
        {
          side_bet_id: betId,
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: 'Player One',
        },
        {
          side_bet_id: betId,
          player_id: playerId2,
          user_id: userId2,
          is_guest: false,
          display_name: 'Player Two',
        },
      ])
      .mockResolvedValueOnce([
        // Mock players query for this round
        {
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: 'Player One',
        },
        {
          player_id: playerId2,
          user_id: userId2,
          is_guest: false,
          display_name: 'Player Two',
        },
      ]);

    const result = await sideBetsListService(roundId, userId);

    expect(result.sideBets).toHaveLength(1);
    expect(result.sideBets[0]).toEqual({
      id: betId,
      name: betName,
      description: 'Test bet description',
      amount: betAmount,
      betType: 'hole',
      holeNumber: 1,
      status: 'active',
      createdById: playerId1,
      createdAt: '2025-01-27T10:00:00Z',
      updatedAt: '2025-01-27T10:00:00Z',
      cancelledAt: null,
      cancelledById: null,
      participants: [
        {
          playerId: playerId1,
          userId,
          displayName: 'Player One',
        },
        {
          playerId: playerId2,
          userId: userId2,
          displayName: 'Player Two',
        },
      ],
    });

    expect(result.playerSummary).toHaveLength(2);
    expect(result.playerSummary[0]).toEqual({
      playerId: playerId1,
      userId,
      displayName: 'Player One',
      moneyIn: '0.00',
      moneyOut: '5.00',
      total: '-5.00',
      betCount: 1,
    });
    expect(result.playerSummary[1]).toEqual({
      playerId: playerId2,
      userId: userId2,
      displayName: 'Player Two',
      moneyIn: '0.00',
      moneyOut: '5.00',
      total: '-5.00',
      betCount: 1,
    });
  });

  test('should handle cancelled bets correctly in status and money calculations', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betId = chance.guid();
    const playerId1 = chance.guid();

    // Mock round exists and user is creator
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    // Mock cancelled side bet
    queryRows
      .mockResolvedValueOnce([
        {
          id: betId,
          name: 'Cancelled Bet',
          description: null,
          amount: '10.00',
          bet_type: 'round',
          hole_number: null,
          created_by_id: playerId1,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T11:00:00Z',
          cancelled_at: '2025-01-27T11:00:00Z',
          cancelled_by_id: playerId1,
        },
      ])
      .mockResolvedValueOnce([
        // Mock participants query for cancelled bet
        {
          side_bet_id: betId,
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: 'Player One',
        },
      ])
      .mockResolvedValueOnce([
        // Mock round players query
        {
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: 'Player One',
        },
      ]);

    const result = await sideBetsListService(roundId, userId);

    expect(result.sideBets[0].status).toBe('cancelled');
    expect(result.sideBets[0].cancelledAt).toBe('2025-01-27T11:00:00Z');
    expect(result.sideBets[0].cancelledById).toBe(playerId1);
    expect(result.sideBets[0].participants).toEqual([
      {
        playerId: playerId1,
        userId,
        displayName: 'Player One',
      },
    ]);

    // Cancelled bets should not contribute to moneyOut or betCount
    expect(result.playerSummary[0]).toEqual({
      playerId: playerId1,
      userId,
      displayName: 'Player One',
      moneyIn: '0.00',
      moneyOut: '0.00',
      total: '0.00',
      betCount: 0,
    });
  });

  test('should include guest players in participants and player summary', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betId = chance.guid();
    const playerId1 = chance.guid(); // Regular user
    const playerId2 = chance.guid(); // Guest player

    // Mock round exists and user is creator
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    // Mock side bet with mixed participants (user + guest)
    queryRows
      .mockResolvedValueOnce([
        {
          id: betId,
          name: 'Mixed Player Bet',
          description: null,
          amount: '10.00',
          bet_type: 'round',
          hole_number: null,
          created_by_id: playerId1,
          created_at: '2025-01-27T10:00:00Z',
          updated_at: '2025-01-27T10:00:00Z',
          cancelled_at: null,
          cancelled_by_id: null,
        },
      ])
      .mockResolvedValueOnce([
        // Mock participants query with mixed player types
        {
          side_bet_id: betId,
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: 'Regular User',
        },
        {
          side_bet_id: betId,
          player_id: playerId2,
          user_id: null, // Guest players have null user_id
          is_guest: true,
          display_name: 'Guest Player',
        },
      ])
      .mockResolvedValueOnce([
        // Mock round players query with mixed player types
        {
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: 'Regular User',
        },
        {
          player_id: playerId2,
          user_id: null,
          is_guest: true,
          display_name: 'Guest Player',
        },
      ]);

    const result = await sideBetsListService(roundId, userId);

    expect(result.sideBets[0].participants).toEqual([
      {
        playerId: playerId1,
        userId,
        displayName: 'Regular User',
      },
      {
        playerId: playerId2,
        userId: null,
        displayName: 'Guest Player',
      },
    ]);

    // Both regular users and guests should appear in player summary
    expect(result.playerSummary).toHaveLength(2);
    expect(result.playerSummary).toEqual([
      {
        playerId: playerId1,
        userId,
        displayName: 'Regular User',
        moneyIn: '0.00',
        moneyOut: '10.00',
        total: '-10.00',
        betCount: 1,
      },
      {
        playerId: playerId2,
        userId: null,
        displayName: 'Guest Player',
        moneyIn: '0.00',
        moneyOut: '10.00',
        total: '-10.00',
        betCount: 1,
      },
    ]);
  });

  test('should count active bets correctly and exclude cancelled bets from betCount', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();
    const bet1Id = chance.guid();
    const bet2Id = chance.guid();
    const bet3Id = chance.guid();

    // Mock round exists and user is creator
    queryOne.mockResolvedValueOnce({
      id: roundId,
      created_by_id: userId,
    });

    // Mock multiple side bets: 2 active, 1 cancelled
    queryRows
      .mockResolvedValueOnce([
        {
          id: bet1Id,
          name: chance.sentence({ words: 3 }),
          description: chance.sentence(),
          amount: chance.floating({ min: 1, max: 50, fixed: 2 }),
          bet_type: chance.pickone(['hole', 'round']),
          hole_number: chance.integer({ min: 1, max: 18 }),
          created_by_id: playerId1,
          created_at: chance.date({ year: 2025 }).toISOString(),
          updated_at: chance.date({ year: 2025 }).toISOString(),
          cancelled_at: null, // Active
          cancelled_by_id: null,
        },
        {
          id: bet2Id,
          name: chance.sentence({ words: 3 }),
          description: chance.sentence(),
          amount: chance.floating({ min: 1, max: 50, fixed: 2 }),
          bet_type: chance.pickone(['hole', 'round']),
          hole_number: chance.integer({ min: 1, max: 18 }),
          created_by_id: playerId1,
          created_at: chance.date({ year: 2025 }).toISOString(),
          updated_at: chance.date({ year: 2025 }).toISOString(),
          cancelled_at: null, // Active
          cancelled_by_id: null,
        },
        {
          id: bet3Id,
          name: chance.sentence({ words: 3 }),
          description: chance.sentence(),
          amount: chance.floating({ min: 1, max: 50, fixed: 2 }),
          bet_type: chance.pickone(['hole', 'round']),
          hole_number: chance.integer({ min: 1, max: 18 }),
          created_by_id: playerId1,
          created_at: chance.date({ year: 2025 }).toISOString(),
          updated_at: chance.date({ year: 2025 }).toISOString(),
          cancelled_at: chance.date({ year: 2025 }).toISOString(), // Cancelled
          cancelled_by_id: playerId1,
        },
      ])
      .mockResolvedValueOnce([
        // Mock participants - player1 in all 3 bets, player2 in only 2 bets (including cancelled)
        {
          side_bet_id: bet1Id,
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: chance.name(),
        },
        {
          side_bet_id: bet1Id,
          player_id: playerId2,
          user_id: chance.integer({ min: 500, max: 1000 }),
          is_guest: false,
          display_name: chance.name(),
        },
        {
          side_bet_id: bet2Id,
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: chance.name(),
        },
        {
          side_bet_id: bet3Id,
          player_id: playerId1,
          user_id: userId,
          is_guest: false,
          display_name: chance.name(),
        },
        {
          side_bet_id: bet3Id,
          player_id: playerId2,
          user_id: chance.integer({ min: 500, max: 1000 }),
          is_guest: false,
          display_name: chance.name(),
        },
      ])
      .mockResolvedValueOnce([
        // Mock round players
        {
          player_id: playerId1, user_id: userId, is_guest: false, display_name: chance.name(),
        },
        {
          player_id: playerId2,
          user_id: chance.integer({ min: 500, max: 1000 }),
          is_guest: false,
          display_name: chance.name(),
        },
      ]);

    const result = await sideBetsListService(roundId, userId);

    expect(result.sideBets).toHaveLength(3);

    // Player 1 is in 2 active bets and 1 cancelled bet - betCount should be 2
    expect(result.playerSummary[0].betCount).toBe(2);

    // Player 2 is in 1 active bet and 1 cancelled bet - betCount should be 1
    expect(result.playerSummary[1].betCount).toBe(1);
  });
});
