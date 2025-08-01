import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import sideBetsCancelService from '../../../services/sideBets.cancel.service.js';
import { queryOne, query } from '../../../lib/database.js';

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
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    await expect(sideBetsCancelService(validUUID)).rejects.toThrow('Round ID is required');
    await expect(sideBetsCancelService(validUUID)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if roundId is not a valid UUID', async () => {
    const validBetId = '123e4567-e89b-12d3-a456-426614174000';
    await expect(sideBetsCancelService(validBetId, 'not-a-uuid')).rejects.toThrow('Invalid round ID format');
    await expect(sideBetsCancelService(validBetId, '123')).rejects.toThrow('Invalid round ID format');
    await expect(sideBetsCancelService(validBetId, 'not-a-uuid')).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if userId is not provided', async () => {
    const validBetId = '123e4567-e89b-12d3-a456-426614174000';
    const validRoundId = '223e4567-e89b-12d3-a456-426614174000';
    await expect(sideBetsCancelService(validBetId, validRoundId)).rejects.toThrow('User ID is required');
    await expect(sideBetsCancelService(validBetId, validRoundId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw NotFoundError if bet does not exist', async () => {
    const validBetId = '123e4567-e89b-12d3-a456-426614174000';
    const validRoundId = '223e4567-e89b-12d3-a456-426614174000';
    const userId = 123;

    queryOne.mockResolvedValue(null); // Bet not found

    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow('Side bet not found');
    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'NotFoundError',
      }),
    );
    expect(queryOne).toHaveBeenCalledWith(
      'SELECT * FROM side_bets WHERE id = $1 AND round_id = $2 AND cancelled_at IS NULL',
      [validBetId, validRoundId],
    );
  });

  it('should throw AuthorizationError if user is not a participant in the round', async () => {
    const validBetId = '123e4567-e89b-12d3-a456-426614174000';
    const validRoundId = '223e4567-e89b-12d3-a456-426614174000';
    const userId = 123;

    // Bet exists
    queryOne.mockResolvedValueOnce({ id: validBetId, round_id: validRoundId });
    // User is not a participant
    queryOne.mockResolvedValueOnce(null);

    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow(
      'User must be a participant in this round',
    );

    // Reset mocks for second call
    queryOne.mockReset();
    queryOne.mockResolvedValueOnce({ id: validBetId, round_id: validRoundId });
    queryOne.mockResolvedValueOnce(null);

    await expect(sideBetsCancelService(validBetId, validRoundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'AuthorizationError',
      }),
    );
  });

  it('should successfully cancel bet when all validations pass', async () => {
    const validBetId = '123e4567-e89b-12d3-a456-426614174000';
    const validRoundId = '223e4567-e89b-12d3-a456-426614174000';
    const userId = 123;
    const playerId = '323e4567-e89b-12d3-a456-426614174000';

    // Bet exists
    queryOne.mockResolvedValueOnce({ id: validBetId, round_id: validRoundId });
    // User is a participant
    queryOne.mockResolvedValueOnce({ id: playerId });
    // Mock the update query
    query.mockResolvedValueOnce({ rowCount: 1 });

    const result = await sideBetsCancelService(validBetId, validRoundId, userId);

    expect(result).toEqual({ success: true });
    expect(query).toHaveBeenCalledWith(
      'UPDATE side_bets SET cancelled_at = NOW(), cancelled_by_id = $1, updated_at = NOW() WHERE id = $2',
      [playerId, validBetId],
    );
  });
});
