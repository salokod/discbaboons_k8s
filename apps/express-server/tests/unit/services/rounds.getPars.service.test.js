import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import getParsService from '../../../services/rounds.getPars.service.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
}));

describe('rounds.getPars.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof getParsService).toBe('function');
  });

  test('should accept roundId and requestingUserId parameters', async () => {
    const { queryOne, query } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId }) // Round exists
      .mockResolvedValueOnce({ id: 'player-id' }); // User is participant

    query.mockResolvedValue({ rows: [] }); // Empty pars

    const result = await getParsService(roundId, requestingUserId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(getParsService(null, requestingUserId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(getParsService(invalidRoundId, requestingUserId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when requestingUserId is missing', async () => {
    const roundId = chance.guid();

    await expect(getParsService(roundId, null))
      .rejects.toThrow('Requesting user ID is required');
  });

  test('should throw ValidationError when requestingUserId is not a valid number', async () => {
    const roundId = chance.guid();
    const invalidUserId = chance.word();

    await expect(getParsService(roundId, invalidUserId))
      .rejects.toThrow('Requesting user ID must be a valid number');
  });

  test('should check if round exists', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(getParsService(roundId, requestingUserId))
      .rejects.toThrow('Round not found');
  });

  test('should check if user is participant in round', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId }) // Round exists
      .mockResolvedValueOnce(null); // User not participant

    await expect(getParsService(roundId, requestingUserId))
      .rejects.toThrow('Permission denied: User is not a participant in this round');
  });

  test('should return pars data for the round', async () => {
    const { queryOne, query } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    queryOne
      .mockResolvedValueOnce({ id: roundId }) // Round exists
      .mockResolvedValueOnce({ id: playerId }); // User is participant

    const mockPars = [
      {
        hole_number: 1, par: 3, set_by_player_id: playerId, created_at: new Date(),
      },
      {
        hole_number: 2, par: 4, set_by_player_id: playerId, created_at: new Date(),
      },
      {
        hole_number: 5, par: 5, set_by_player_id: playerId, created_at: new Date(),
      },
    ];

    query.mockResolvedValue({ rows: mockPars });

    const result = await getParsService(roundId, requestingUserId);

    expect(result).toHaveProperty('1', 3);
    expect(result).toHaveProperty('2', 4);
    expect(result).toHaveProperty('5', 5);
    expect(result).not.toHaveProperty('3'); // No par set for hole 3
    expect(result).not.toHaveProperty('4'); // No par set for hole 4
  });
});
