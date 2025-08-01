import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import sideBetsCancelService from '../../../services/sideBets.cancel.service.js';
import { queryOne, query } from '../../../lib/database.js';

const chance = new Chance();

// Mock the database module
vi.mock('../../../lib/database.js', () => ({
  default: {
    connect: vi.fn(),
  },
  queryOne: vi.fn(),
  query: vi.fn(),
}));

describe('sideBetsCancelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export cancelSideBet function', () => {
    expect(sideBetsCancelService).toBeDefined();
    expect(typeof sideBetsCancelService).toBe('function');
  });

  it('should throw ValidationError if betId is not provided', async () => {
    await expect(sideBetsCancelService()).rejects.toThrow('Bet ID is required');
    await expect(sideBetsCancelService()).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if betId is not a valid UUID', async () => {
    await expect(sideBetsCancelService('not-a-uuid')).rejects.toThrow('Invalid bet ID format');
    await expect(sideBetsCancelService('123')).rejects.toThrow('Invalid bet ID format');
    await expect(sideBetsCancelService('not-a-uuid')).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if roundId is not provided', async () => {
    const validBetId = chance.guid();
    await expect(sideBetsCancelService(validBetId)).rejects.toThrow('Round ID is required');
    await expect(sideBetsCancelService(validBetId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if roundId is not a valid UUID', async () => {
    const validBetId = chance.guid();
    await expect(sideBetsCancelService(validBetId, 'not-a-uuid')).rejects.toThrow('Invalid round ID format');
    await expect(sideBetsCancelService(validBetId, '123')).rejects.toThrow('Invalid round ID format');
    await expect(sideBetsCancelService(validBetId, 'not-a-uuid')).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if userId is not provided', async () => {
    const validBetId = chance.guid();
    const validRoundId = chance.guid();
    await expect(sideBetsCancelService(validBetId, validRoundId)).rejects.toThrow('User ID is required');
    await expect(sideBetsCancelService(validBetId, validRoundId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw NotFoundError if bet does not exist', async () => {
    const validBetId = chance.guid();
    const validRoundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // First query (combined bet+player) returns null
    queryOne.mockResolvedValueOnce(null);
    // Second query (bet only) also returns null - bet doesn't exist
    queryOne.mockResolvedValueOnce(null);

    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow('Side bet not found');
    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'NotFoundError',
      }),
    );
  });

  it('should throw AuthorizationError if user is not a participant in the round', async () => {
    const validBetId = chance.guid();
    const validRoundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // First query (combined bet+player) returns null - user not authorized
    queryOne.mockResolvedValueOnce(null);
    // Second query (bet only) returns bet - so bet exists, user just not authorized
    queryOne.mockResolvedValueOnce({ id: validBetId });

    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow(
      'User must be a participant in this round',
    );

    // Reset mocks for second call
    queryOne.mockReset();
    queryOne.mockResolvedValueOnce(null);
    queryOne.mockResolvedValueOnce({ id: validBetId });

    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'AuthorizationError',
      }),
    );
  });

  it('should successfully cancel bet when all validations pass', async () => {
    const validBetId = chance.guid();
    const validRoundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    // Combined query returns bet and player info
    queryOne.mockResolvedValueOnce({
      bet_id: validBetId,
      player_id: playerId,
    });
    // Mock the update query
    query.mockResolvedValueOnce({ rowCount: 1 });

    const result = await sideBetsCancelService(validBetId, validRoundId, userId);

    expect(result).toEqual({ success: true });
    expect(query).toHaveBeenCalledWith(
      'UPDATE side_bets SET cancelled_at = NOW(), cancelled_by_id = $1, updated_at = NOW() WHERE id = $2 AND cancelled_at IS NULL',
      [playerId, validBetId],
    );
  });
});
