import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import submitScoresService from '../../../services/rounds.submitScores.service.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
}));

describe('rounds.submitScores.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof submitScoresService).toBe('function');
  });

  test('should accept roundId, scores array, and requestingUserId parameters', async () => {
    const { queryOne, query } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, hole_count: 18 }) // Round exists
      .mockResolvedValueOnce({ id: 'player-id' }); // User is participant

    query.mockResolvedValue({ rows: [] }); // Scores query

    const result = await submitScoresService(roundId, scores, requestingUserId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(submitScoresService(null, scores, requestingUserId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(submitScoresService(invalidRoundId, scores, requestingUserId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when scores array is missing', async () => {
    const roundId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(submitScoresService(roundId, null, requestingUserId))
      .rejects.toThrow('Scores array is required');
  });

  test('should throw ValidationError when scores array is empty', async () => {
    const roundId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(submitScoresService(roundId, [], requestingUserId))
      .rejects.toThrow('Scores array cannot be empty');
  });

  test('should throw ValidationError when requestingUserId is missing', async () => {
    const roundId = chance.guid();
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];

    await expect(submitScoresService(roundId, scores, null))
      .rejects.toThrow('Requesting user ID is required');
  });

  test('should throw ValidationError when requestingUserId is not a valid number', async () => {
    const roundId = chance.guid();
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];
    const invalidUserId = chance.word();

    await expect(submitScoresService(roundId, scores, invalidUserId))
      .rejects.toThrow('Requesting user ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null); // Round not found

    await expect(submitScoresService(roundId, scores, requestingUserId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not participant in round', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, hole_count: 18 }) // Round exists
      .mockResolvedValueOnce(null); // User not participant

    await expect(submitScoresService(roundId, scores, requestingUserId))
      .rejects.toThrow('Permission denied: User is not a participant in this round');
  });

  test('should throw ValidationError when score has invalid playerId', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const scores = [{ playerId: chance.word(), holeNumber: 1, strokes: 4 }]; // Invalid UUID
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, hole_count: 18 }) // Round exists
      .mockResolvedValueOnce({ id: 'player-id' }); // User is participant

    await expect(submitScoresService(roundId, scores, requestingUserId))
      .rejects.toThrow('Player ID must be a valid UUID');
  });

  test('should throw ValidationError when score has invalid hole number', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const scores = [{ playerId: chance.guid(), holeNumber: 0, strokes: 4 }]; // Invalid hole number
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, hole_count: 18 }) // Round exists
      .mockResolvedValueOnce({ id: 'player-id' }); // User is participant

    await expect(submitScoresService(roundId, scores, requestingUserId))
      .rejects.toThrow('Hole number must be between 1 and 50');
  });

  test('should throw ValidationError when score has invalid strokes', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 0 }]; // Invalid strokes
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, hole_count: 18 }) // Round exists
      .mockResolvedValueOnce({ id: 'player-id' }); // User is participant

    await expect(submitScoresService(roundId, scores, requestingUserId))
      .rejects.toThrow('Strokes must be between 1 and 20');
  });

  test('should submit scores successfully', async () => {
    const { queryOne, query } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const scores = [
      { playerId: chance.guid(), holeNumber: 1, strokes: 3 },
      { playerId: chance.guid(), holeNumber: 2, strokes: 4 },
    ];
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, hole_count: 18 }) // Round exists
      .mockResolvedValueOnce({ id: 'player-id' }); // User is participant

    query.mockResolvedValue({}); // Score upsert

    const result = await submitScoresService(roundId, scores, requestingUserId);

    expect(result).toEqual({ success: true, scoresSubmitted: 2 });
    expect(query).toHaveBeenCalledTimes(2); // One call per score
  });
});
