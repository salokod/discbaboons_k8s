import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  queryRows: vi.fn(),
}));

describe('sideBetsGetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a function', async () => {
    const sideBetsGetService = await import('../../../services/sideBets.get.service.js');
    expect(typeof sideBetsGetService.default).toBe('function');
  });

  it('should require betId', async () => {
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    await expect(sideBetsGetService()).rejects.toThrow('Bet ID is required');
  });

  it('should require roundId', async () => {
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;
    const betId = chance.guid();

    await expect(sideBetsGetService(betId)).rejects.toThrow('Round ID is required');
  });

  it('should require userId', async () => {
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;
    const betId = chance.guid();
    const roundId = chance.guid();

    await expect(sideBetsGetService(betId, roundId)).rejects.toThrow('User ID is required');
  });

  it('should validate betId is valid UUID', async () => {
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;
    const invalidBetId = 'not-a-valid-uuid';
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(sideBetsGetService(invalidBetId, roundId, userId))
      .rejects.toThrow('Invalid bet ID format');
  });

  it('should validate roundId is valid UUID', async () => {
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;
    const betId = chance.guid();
    const invalidRoundId = 'not-a-valid-uuid';
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(sideBetsGetService(betId, invalidRoundId, userId))
      .rejects.toThrow('Invalid round ID format');
  });

  it('should throw error when bet does not exist', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce(null);

    await expect(sideBetsGetService(betId, roundId, userId))
      .rejects.toThrow('Side bet not found');
  });

  it('should throw error when user is not round participant', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock bet exists
    queryOne.mockResolvedValueOnce({ id: betId, round_id: roundId });
    // Mock user not a participant
    queryOne.mockResolvedValueOnce(null);

    await expect(sideBetsGetService(betId, roundId, userId))
      .rejects.toThrow('You must be a participant in this round to view side bets');
  });

  it('should return bet details with participants', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const playerId2 = chance.guid();

    const mockBet = {
      id: betId,
      round_id: roundId,
      name: chance.sentence({ words: 3 }),
      description: chance.sentence(),
      amount: '10.00',
      bet_type: 'hole',
      hole_number: 5,
      created_by_id: playerId,
      created_at: new Date(),
      updated_at: new Date(),
      cancelled_at: null,
      cancelled_by_id: null,
    };

    // Mock bet exists
    queryOne.mockResolvedValueOnce(mockBet);
    // Mock user is participant
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock participants query
    queryRows.mockResolvedValueOnce([
      {
        player_id: playerId,
        user_id: userId,
        is_guest: false,
        display_name: chance.name(),
        is_winner: false,
        won_at: null,
        declared_by_id: null,
      },
      {
        player_id: playerId2,
        user_id: chance.integer({ min: 1001, max: 2000 }),
        is_guest: false,
        display_name: chance.name(),
        is_winner: false,
        won_at: null,
        declared_by_id: null,
      },
    ]);

    const result = await sideBetsGetService(betId, roundId, userId);

    expect(result).toEqual({
      id: betId,
      roundId,
      name: mockBet.name,
      description: mockBet.description,
      amount: mockBet.amount,
      betType: mockBet.bet_type,
      holeNumber: mockBet.hole_number,
      status: 'active',
      createdById: mockBet.created_by_id,
      createdAt: mockBet.created_at,
      updatedAt: mockBet.updated_at,
      cancelledAt: null,
      cancelledById: null,
      participants: expect.any(Array),
    });

    expect(result.participants).toHaveLength(2);
    const expectedBetAmount = -parseFloat(mockBet.amount);
    expect(result.participants[0]).toMatchObject({
      playerId,
      userId,
      displayName: expect.any(String),
      isWinner: false,
      wonAt: null,
      declaredById: null,
      betAmount: expectedBetAmount, // Non-winner owes the bet amount
    });
    expect(result.participants[1]).toMatchObject({
      betAmount: expectedBetAmount, // Non-winner owes the bet amount
    });
  });

  it('should correctly show status as completed when bet has winner', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const playerId2 = chance.guid();

    const mockBet = {
      id: betId,
      round_id: roundId,
      name: chance.sentence({ words: 3 }),
      amount: '10.00',
      bet_type: 'hole',
      hole_number: 5,
      created_by_id: playerId,
      cancelled_at: null,
    };

    // Mock bet exists
    queryOne.mockResolvedValueOnce(mockBet);
    // Mock user is participant
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock participants with winner
    queryRows.mockResolvedValueOnce([
      {
        player_id: playerId,
        user_id: userId,
        is_guest: false,
        display_name: chance.name(),
        is_winner: true,
        won_at: new Date(),
        declared_by_id: playerId2,
      },
      {
        player_id: playerId2,
        user_id: chance.integer({ min: 1001, max: 2000 }),
        is_guest: false,
        display_name: chance.name(),
        is_winner: false,
        won_at: null,
        declared_by_id: null,
      },
    ]);

    const result = await sideBetsGetService(betId, roundId, userId);

    expect(result.status).toBe('completed');
    expect(result.participants[0].isWinner).toBe(true);
    expect(result.participants[0].declaredById).toBe(playerId2);

    const betAmount = parseFloat(mockBet.amount);
    const participantCount = 2; // We mocked 2 participants
    const expectedWinnings = betAmount * (participantCount - 1);
    expect(result.participants[0].betAmount).toBe(expectedWinnings);
    expect(result.participants[1].betAmount).toBe(-betAmount); // Loser owes bet amount
  });

  it('should throw error when bet has no participants', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    const mockBet = {
      id: betId,
      round_id: roundId,
      name: chance.sentence({ words: 3 }),
      amount: '10.00',
      bet_type: 'hole',
      hole_number: 5,
      created_by_id: chance.guid(),
      cancelled_at: null,
    };

    // Mock bet exists
    queryOne.mockResolvedValueOnce(mockBet);
    // Mock user is participant
    queryOne.mockResolvedValueOnce({ id: chance.guid() });
    // Mock empty participants array
    queryRows.mockResolvedValueOnce([]);

    await expect(sideBetsGetService(betId, roundId, userId))
      .rejects.toThrow('Side bet participants not found');
  });

  it('should throw error when bet has multiple winners', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId1 = chance.guid();
    const playerId2 = chance.guid();

    const mockBet = {
      id: betId,
      round_id: roundId,
      name: chance.sentence({ words: 3 }),
      amount: '10.00',
      bet_type: 'hole',
      hole_number: 5,
      created_by_id: playerId1,
      cancelled_at: null,
    };

    // Mock bet exists
    queryOne.mockResolvedValueOnce(mockBet);
    // Mock user is participant
    queryOne.mockResolvedValueOnce({ id: playerId1 });

    // Mock participants with TWO winners
    queryRows.mockResolvedValueOnce([
      {
        player_id: playerId1,
        user_id: userId,
        is_guest: false,
        display_name: chance.name(),
        is_winner: true, // Winner 1
        won_at: new Date(),
        declared_by_id: playerId2,
      },
      {
        player_id: playerId2,
        user_id: chance.integer({ min: 1001, max: 2000 }),
        is_guest: false,
        display_name: chance.name(),
        is_winner: true, // Winner 2 (invalid!)
        won_at: new Date(),
        declared_by_id: playerId1,
      },
    ]);

    await expect(sideBetsGetService(betId, roundId, userId))
      .rejects.toThrow('Side bet cannot have multiple winners');
  });

  it('should throw error for invalid bet amount (NaN)', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    const mockBet = {
      id: betId,
      round_id: roundId,
      name: chance.sentence({ words: 3 }),
      amount: 'invalid-amount', // Invalid amount -> NaN
      bet_type: 'hole',
      hole_number: 5,
      created_by_id: playerId,
      cancelled_at: null,
    };

    // Mock bet exists
    queryOne.mockResolvedValueOnce(mockBet);
    // Mock user is participant
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock single participant
    queryRows.mockResolvedValueOnce([
      {
        player_id: playerId,
        user_id: userId,
        is_guest: false,
        display_name: chance.name(),
        is_winner: false,
        won_at: null,
        declared_by_id: null,
      },
    ]);

    await expect(sideBetsGetService(betId, roundId, userId))
      .rejects.toThrow('Invalid bet amount');
  });

  it('should throw error for negative bet amount', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    const mockBet = {
      id: betId,
      round_id: roundId,
      name: chance.sentence({ words: 3 }),
      amount: '-5.00', // Negative amount
      bet_type: 'hole',
      hole_number: 5,
      created_by_id: playerId,
      cancelled_at: null,
    };

    // Mock bet exists
    queryOne.mockResolvedValueOnce(mockBet);
    // Mock user is participant
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock single participant
    queryRows.mockResolvedValueOnce([
      {
        player_id: playerId,
        user_id: userId,
        is_guest: false,
        display_name: chance.name(),
        is_winner: false,
        won_at: null,
        declared_by_id: null,
      },
    ]);

    await expect(sideBetsGetService(betId, roundId, userId))
      .rejects.toThrow('Invalid bet amount');
  });

  it('should throw error for zero bet amount', async () => {
    const { queryOne, queryRows } = await import('../../../lib/database.js');
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;

    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    const mockBet = {
      id: betId,
      round_id: roundId,
      name: chance.sentence({ words: 3 }),
      amount: '0.00', // Zero amount
      bet_type: 'hole',
      hole_number: 5,
      created_by_id: playerId,
      cancelled_at: null,
    };

    // Mock bet exists
    queryOne.mockResolvedValueOnce(mockBet);
    // Mock user is participant
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock single participant
    queryRows.mockResolvedValueOnce([
      {
        player_id: playerId,
        user_id: userId,
        is_guest: false,
        display_name: chance.name(),
        is_winner: false,
        won_at: null,
        declared_by_id: null,
      },
    ]);

    await expect(sideBetsGetService(betId, roundId, userId))
      .rejects.toThrow('Invalid bet amount');
  });
});
