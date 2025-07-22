import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import removePlayerService from '../../../services/rounds.removePlayer.service.js';
import { queryOne, query } from '../../../lib/database.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryRows: vi.fn(),
  queryOne: vi.fn(),
  query: vi.fn(),
}));

describe('rounds.removePlayer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof removePlayerService).toBe('function');
  });

  test('should accept roundId, playerId, and requestingUserId parameters', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue({ id: roundId, created_by_id: requestingUserId });

    const result = await removePlayerService(roundId, playerId, requestingUserId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(removePlayerService(null, playerId, requestingUserId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(removePlayerService(invalidRoundId, playerId, requestingUserId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when playerId is missing', async () => {
    const roundId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(removePlayerService(roundId, null, requestingUserId))
      .rejects.toThrow('Player ID is required');
  });

  test('should throw ValidationError when playerId is not a valid UUID', async () => {
    const roundId = chance.guid();
    const invalidPlayerId = chance.word();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(removePlayerService(roundId, invalidPlayerId, requestingUserId))
      .rejects.toThrow('Player ID must be a valid UUID');
  });

  test('should throw ValidationError when requestingUserId is missing', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();

    await expect(removePlayerService(roundId, playerId, null))
      .rejects.toThrow('Requesting user ID is required');
  });

  test('should throw ValidationError when requestingUserId is not a valid number', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();
    const invalidUserId = chance.word();

    await expect(removePlayerService(roundId, playerId, invalidUserId))
      .rejects.toThrow('Requesting user ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(removePlayerService(roundId, playerId, requestingUserId))
      .rejects.toThrow('Round not found');
  });

  test('should throw NotFoundError when player does not exist in round', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: requestingUserId })
      .mockResolvedValueOnce(null); // Player not found

    await expect(removePlayerService(roundId, playerId, requestingUserId))
      .rejects.toThrow('Player not found in this round');
  });

  test('should throw AuthorizationError when user is not creator and not the player being removed', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 1001, max: 2000 });
    const playerUserId = chance.integer({ min: 2001, max: 3000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId })
      .mockResolvedValueOnce({ id: playerId, user_id: playerUserId, is_guest: false });

    await expect(removePlayerService(roundId, playerId, requestingUserId))
      .rejects.toThrow('You can only remove yourself or you must be the round creator');
  });

  test('should successfully remove player when user is the round creator', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });
    const playerUserId = chance.integer({ min: 2001, max: 3000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: requestingUserId })
      .mockResolvedValueOnce({ id: playerId, user_id: playerUserId, is_guest: false });
    query.mockResolvedValue();

    const result = await removePlayerService(roundId, playerId, requestingUserId);

    expect(result).toEqual({ success: true });
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM round_players WHERE id = $1 AND round_id = $2',
      [playerId, roundId],
    );
  });

  test('should successfully remove player when user is removing themselves', async () => {
    const roundId = chance.guid();
    const playerId = chance.guid();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 2001, max: 3000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId })
      .mockResolvedValueOnce({ id: playerId, user_id: requestingUserId, is_guest: false });
    query.mockResolvedValue();

    const result = await removePlayerService(roundId, playerId, requestingUserId);

    expect(result).toEqual({ success: true });
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM round_players WHERE id = $1 AND round_id = $2',
      [playerId, roundId],
    );
  });
});
