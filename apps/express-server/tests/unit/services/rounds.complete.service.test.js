import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import roundsCompleteService from '../../../services/rounds.complete.service.js';
import { queryOne } from '../../../lib/database.js';

const chance = new Chance();

// Mock the database module
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  queryRows: vi.fn(),
}));

describe('roundsCompleteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a function', () => {
    expect(typeof roundsCompleteService).toBe('function');
  });

  it('should throw ValidationError if roundId is not provided', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(roundsCompleteService()).rejects.toThrow('Round ID is required');
    await expect(roundsCompleteService(null, userId)).rejects.toThrow('Round ID is required');
    await expect(roundsCompleteService(undefined, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if roundId is not a valid UUID', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(roundsCompleteService('not-a-uuid', userId)).rejects.toThrow('Round ID must be a valid UUID');
    await expect(roundsCompleteService('123', userId)).rejects.toThrow('Round ID must be a valid UUID');
    await expect(roundsCompleteService('invalid-format', userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if userId is not provided', async () => {
    const roundId = chance.guid();

    await expect(roundsCompleteService(roundId)).rejects.toThrow('User ID is required');
    await expect(roundsCompleteService(roundId, null)).rejects.toThrow('User ID is required');
    await expect(roundsCompleteService(roundId, undefined)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if userId is not a valid number', async () => {
    const roundId = chance.guid();

    await expect(roundsCompleteService(roundId, 'not-a-number')).rejects.toThrow('User ID must be a valid number');
    await expect(roundsCompleteService(roundId, 0)).rejects.toThrow('User ID must be a valid number');
    await expect(roundsCompleteService(roundId, -1)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw NotFoundError if round does not exist', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValueOnce(null); // Round not found

    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow('Round not found');
    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'NotFoundError',
      }),
    );
  });

  it('should throw AuthorizationError if user is not a participant in the round', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Round exists
    queryOne.mockResolvedValueOnce({ id: roundId, status: 'in_progress' });
    // User is not a participant
    queryOne.mockResolvedValueOnce(null);

    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow(
      'Permission denied: You are not a participant in this round',
    );

    // Reset mocks for second assertion
    queryOne.mockReset();
    queryOne.mockResolvedValueOnce({ id: roundId, status: 'in_progress' });
    queryOne.mockResolvedValueOnce(null);

    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'AuthorizationError',
      }),
    );
  });

  it('should throw ValidationError if round is not in progress', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Round exists but is already completed
    queryOne.mockResolvedValueOnce({ id: roundId, status: 'completed' });
    // User is a participant
    queryOne.mockResolvedValueOnce({ id: chance.guid() });

    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow(
      'Round must be in progress to be completed',
    );

    // Reset mocks for second assertion
    queryOne.mockReset();
    queryOne.mockResolvedValueOnce({ id: roundId, status: 'completed' });
    queryOne.mockResolvedValueOnce({ id: chance.guid() });

    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should throw ValidationError if not all players have completed scoring', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Round exists and is in progress
    queryOne.mockResolvedValueOnce({ id: roundId, status: 'in_progress' });
    // User is a participant
    queryOne.mockResolvedValueOnce({ id: chance.guid() });
    // Score completion check returns false
    queryOne.mockResolvedValueOnce({ all_players_complete: false });

    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow(
      'All players must complete scoring before the round can be completed',
    );

    // Reset mocks for second assertion
    queryOne.mockReset();
    queryOne.mockResolvedValueOnce({ id: roundId, status: 'in_progress' });
    queryOne.mockResolvedValueOnce({ id: chance.guid() });
    queryOne.mockResolvedValueOnce({ all_players_complete: false });

    await expect(roundsCompleteService(roundId, userId)).rejects.toThrow(
      expect.objectContaining({
        name: 'ValidationError',
      }),
    );
  });

  it('should successfully complete round and return comprehensive data', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    // Round exists and is in progress
    queryOne.mockResolvedValueOnce({ id: roundId, status: 'in_progress' });
    // User is a participant
    queryOne.mockResolvedValueOnce({ id: chance.guid() });
    // All players have completed scoring
    queryOne.mockResolvedValueOnce({ all_players_complete: true });
    // Mock updated round
    queryOne.mockResolvedValueOnce({
      id: roundId,
      status: 'completed',
      completed_at: '2025-01-01T12:00:00Z',
    });

    const result = await roundsCompleteService(roundId, userId);

    expect(result).toMatchObject({
      success: true,
      round: expect.objectContaining({
        id: roundId,
        status: 'completed',
      }),
    });
  });
});
