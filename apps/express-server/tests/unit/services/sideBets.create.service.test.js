import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import pool, { queryOne } from '../../../lib/database.js';
import sideBetsCreateService from '../../../services/sideBets.create.service.js';

const chance = new Chance();

vi.mock('../../../lib/database.js', () => ({
  default: {
    connect: vi.fn(),
  },
  queryOne: vi.fn(),
  queryRows: vi.fn(),
}));

describe('sideBetsCreateService', () => {
  let mockClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  it('should export a function', () => {
    expect(typeof sideBetsCreateService).toBe('function');
  });

  it('should require betData', async () => {
    await expect(sideBetsCreateService()).rejects.toThrow('Bet data is required');
  });

  it('should require roundId', async () => {
    await expect(sideBetsCreateService({})).rejects.toThrow('Round ID is required');
  });

  it('should require userId', async () => {
    const roundId = chance.guid();
    await expect(sideBetsCreateService({}, roundId)).rejects.toThrow('User ID is required');
  });

  it('should require bet name', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    await expect(sideBetsCreateService({}, roundId, userId)).rejects.toThrow('Bet name is required');
  });

  it('should require bet amount', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betData = { name: chance.word() };
    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Bet amount is required');
  });

  it('should require bet type', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
    };
    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Bet type is required');
  });

  it('should require valid bet type', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'invalid-type',
    };
    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Bet type must be either "hole" or "round"');
  });

  it('should require hole number for hole bets', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'hole',
    };
    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Hole number is required for hole bets');
  });

  it('should reject hole number for round bets', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      holeNumber: 5,
    };
    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Hole number should not be provided for round bets');
  });

  it('should require positive amount', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betData = {
      name: chance.word(),
      amount: 0,
      betType: 'round',
    };
    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Bet amount must be positive');
  });

  it('should require participants array', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
    };

    // Mock finding the player (user is participant)
    queryOne.mockResolvedValueOnce({ id: playerId });

    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Participants array is required');
  });

  it('should require non-empty participants array', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: [],
    };

    // Mock finding the player (user is participant)
    queryOne.mockResolvedValueOnce({ id: playerId });

    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('Participants array is required');
  });

  it('should require at least 2 participants', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: [playerId], // Only 1 participant
    };

    // Mock finding the player (user is participant)
    queryOne.mockResolvedValueOnce({ id: playerId });

    await expect(sideBetsCreateService(betData, roundId, userId)).rejects.toThrow('At least 2 participants are required for a bet');
  });

  it('should create a hole bet with valid data', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const otherPlayerId = chance.guid();
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'hole',
      holeNumber: chance.integer({ min: 1, max: 18 }),
      participants: [playerId, otherPlayerId], // At least 2 participants
    };

    // Mock finding the player
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock participant validation
    const { queryRows } = await import('../../../lib/database.js');
    queryRows.mockResolvedValueOnce([
      { id: playerId },
      { id: otherPlayerId },
    ]);

    // Mock bet creation
    const mockBet = {
      id: chance.guid(),
      round_id: roundId,
      name: betData.name,
      amount: betData.amount,
      bet_type: betData.betType,
      hole_number: betData.holeNumber,
      created_by_id: playerId,
    };

    // Mock transaction calls
    mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [mockBet] }); // INSERT bet
    mockClient.query.mockResolvedValueOnce(undefined); // INSERT participant 1
    mockClient.query.mockResolvedValueOnce(undefined); // INSERT participant 2
    mockClient.query.mockResolvedValueOnce(undefined); // COMMIT

    const result = await sideBetsCreateService(betData, roundId, userId);

    expect(result).toEqual(mockBet);
  });

  it('should create a round bet with valid data', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const otherPlayerId = chance.guid();
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: [playerId, otherPlayerId], // At least 2 participants
    };

    // Mock finding the player
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock participant validation
    const { queryRows } = await import('../../../lib/database.js');
    queryRows.mockResolvedValueOnce([
      { id: playerId },
      { id: otherPlayerId },
    ]);

    // Mock bet creation
    const mockBet = {
      id: chance.guid(),
      round_id: roundId,
      name: betData.name,
      amount: betData.amount,
      bet_type: betData.betType,
      hole_number: null,
      created_by_id: playerId,
    };

    // Mock transaction calls
    mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [mockBet] }); // INSERT bet
    mockClient.query.mockResolvedValueOnce(undefined); // INSERT participant 1
    mockClient.query.mockResolvedValueOnce(undefined); // INSERT participant 2
    mockClient.query.mockResolvedValueOnce(undefined); // COMMIT

    const result = await sideBetsCreateService(betData, roundId, userId);

    expect(result).toEqual(mockBet);
  });

  it('should create bet with specified participants', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const otherPlayerId1 = chance.guid();
    const otherPlayerId2 = chance.guid();

    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: [playerId, otherPlayerId1, otherPlayerId2], // Include creator + others
    };

    // Mock finding the creator player
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock participant validation - all 3 participants are valid
    const { queryRows } = await import('../../../lib/database.js');
    queryRows.mockResolvedValueOnce([
      { id: playerId },
      { id: otherPlayerId1 },
      { id: otherPlayerId2 },
    ]);

    // Mock bet creation
    const mockBet = {
      id: chance.guid(),
      round_id: roundId,
      name: betData.name,
      amount: betData.amount,
      bet_type: betData.betType,
      hole_number: null,
      created_by_id: playerId,
    };

    // Mock transaction calls
    mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [mockBet] }); // INSERT bet
    mockClient.query.mockResolvedValueOnce(undefined); // INSERT participant 1
    mockClient.query.mockResolvedValueOnce(undefined); // INSERT participant 2
    mockClient.query.mockResolvedValueOnce(undefined); // INSERT participant 3
    mockClient.query.mockResolvedValueOnce(undefined); // COMMIT

    const result = await sideBetsCreateService(betData, roundId, userId);

    expect(result).toEqual(mockBet);
    // BEGIN + INSERT bet + 3 participants + COMMIT
    expect(mockClient.query).toHaveBeenCalledTimes(6);
  });

  it('should validate all participants are in the round', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const invalidPlayerId = chance.guid();

    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: [playerId, invalidPlayerId],
    };

    // Mock finding the creator player (success)
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock participant validation - only 1 valid participant (not 2)
    const { queryRows } = await import('../../../lib/database.js');
    queryRows.mockResolvedValueOnce([{ id: playerId }]); // Only creator found, not invalidPlayerId

    await expect(sideBetsCreateService(betData, roundId, userId))
      .rejects.toThrow('All participants must be players in this round');
  });
});
