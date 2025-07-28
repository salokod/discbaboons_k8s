import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import pool, { queryOne } from '../../../lib/database.js';
import sideBetsUpdateService from '../../../services/sideBets.update.service.js';

const chance = new Chance();

vi.mock('../../../lib/database.js', () => ({
  default: {
    connect: vi.fn(),
  },
  queryOne: vi.fn(),
  queryRows: vi.fn(),
}));

describe('sideBetsUpdateService', () => {
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
    expect(typeof sideBetsUpdateService).toBe('function');
  });

  it('should require betId', async () => {
    await expect(sideBetsUpdateService()).rejects.toThrow('Bet ID is required');
  });

  it('should require roundId', async () => {
    const betId = chance.guid();
    await expect(sideBetsUpdateService(betId)).rejects.toThrow('Round ID is required');
  });

  it('should require userId', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    await expect(sideBetsUpdateService(betId, roundId)).rejects.toThrow('User ID is required');
  });

  it('should require updateData', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    await expect(sideBetsUpdateService(betId, roundId, userId)).rejects.toThrow('Update data is required');
  });

  it('should throw error when bet does not exist', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const updateData = { name: chance.word() };

    queryOne.mockResolvedValueOnce(null);

    await expect(sideBetsUpdateService(betId, roundId, userId, updateData))
      .rejects.toThrow('Side bet not found');
  });

  it('should throw error when user is not round participant', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const updateData = { name: chance.word() };

    // Mock bet exists but user not in round
    queryOne.mockResolvedValueOnce({ id: betId, round_id: roundId });
    queryOne.mockResolvedValueOnce(null);

    await expect(sideBetsUpdateService(betId, roundId, userId, updateData))
      .rejects.toThrow('User must be a participant in this round');
  });

  it('should update bet name and description', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const newName = chance.sentence({ words: 3 });
    const newDescription = chance.sentence();
    const updateData = { name: newName, description: newDescription };

    const originalBet = {
      id: betId,
      round_id: roundId,
      name: chance.word(),
      description: chance.sentence(),
      amount: '10.00',
      bet_type: 'round',
      hole_number: null,
      created_by_id: playerId,
    };

    const updatedBet = {
      ...originalBet,
      name: newName,
      description: newDescription,
    };

    // Mock bet exists and user is participant
    queryOne.mockResolvedValueOnce(originalBet);
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock transaction
    mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [updatedBet] }); // UPDATE
    mockClient.query.mockResolvedValueOnce(undefined); // COMMIT

    const result = await sideBetsUpdateService(betId, roundId, userId, updateData);

    expect(result).toEqual(updatedBet);
    expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, UPDATE, COMMIT
  });

  it('should declare winner when winnerId provided', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const winnerId = chance.guid();
    const updateData = { winnerId };

    const originalBet = {
      id: betId,
      round_id: roundId,
      name: chance.word(),
      amount: '10.00',
      bet_type: 'round',
      hole_number: null,
    };

    // Mock bet exists and user is participant
    queryOne.mockResolvedValueOnce(originalBet);
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock transaction - clearing old winners and setting new winner
    mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
    mockClient.query.mockResolvedValueOnce(undefined); // UPDATE all participants to clear is_winner
    // UPDATE specific participant to be winner (success)
    mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
    mockClient.query.mockResolvedValueOnce({ rows: [originalBet] }); // SELECT bet to return
    mockClient.query.mockResolvedValueOnce(undefined); // COMMIT

    const result = await sideBetsUpdateService(betId, roundId, userId, updateData);

    expect(result).toEqual(originalBet);
    expect(mockClient.query).toHaveBeenCalledTimes(5); // BEGIN, CLEAR, SET WINNER, SELECT, COMMIT
  });

  it('should reactivate bet when winnerId is null', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const updateData = { winnerId: null };

    const originalBet = {
      id: betId,
      round_id: roundId,
      name: chance.word(),
      amount: '10.00',
      bet_type: 'round',
      hole_number: null,
    };

    // Mock bet exists and user is participant
    queryOne.mockResolvedValueOnce(originalBet);
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock transaction - clearing all winners
    mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
    mockClient.query.mockResolvedValueOnce(undefined); // UPDATE all participants to clear is_winner
    mockClient.query.mockResolvedValueOnce({ rows: [originalBet] }); // SELECT bet to return
    mockClient.query.mockResolvedValueOnce(undefined); // COMMIT

    const result = await sideBetsUpdateService(betId, roundId, userId, updateData);

    expect(result).toEqual(originalBet);
    expect(mockClient.query).toHaveBeenCalledTimes(4); // BEGIN, CLEAR, SELECT, COMMIT
  });

  it('should validate winnerId is a valid participant', async () => {
    const betId = chance.guid();
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();
    const invalidWinnerId = chance.guid();
    const updateData = { winnerId: invalidWinnerId };

    const originalBet = {
      id: betId,
      round_id: roundId,
      name: chance.word(),
      amount: '10.00',
      bet_type: 'round',
      hole_number: null,
    };

    // Mock bet exists and user is participant
    queryOne.mockResolvedValueOnce(originalBet);
    queryOne.mockResolvedValueOnce({ id: playerId });

    // Mock transaction - clear old winners succeeds, but setting new winner fails (no rows)
    mockClient.query.mockResolvedValueOnce(undefined); // BEGIN
    // UPDATE all participants to clear is_winner
    mockClient.query.mockResolvedValueOnce(undefined);
    // UPDATE specific participant (no rows = invalid player)
    mockClient.query.mockResolvedValueOnce({ rowCount: 0 });

    await expect(sideBetsUpdateService(betId, roundId, userId, updateData))
      .rejects.toThrow('Invalid winnerId: player not found in this bet');
  });
});
