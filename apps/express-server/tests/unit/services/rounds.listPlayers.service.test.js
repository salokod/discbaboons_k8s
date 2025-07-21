import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import listPlayersService from '../../../services/rounds.listPlayers.service.js';
import { queryRows, queryOne } from '../../../lib/database.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryRows: vi.fn(),
  queryOne: vi.fn(),
}));

describe('rounds.listPlayers.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof listPlayersService).toBe('function');
  });

  test('should accept roundId parameter', async () => {
    const roundId = chance.guid();
    const userId = chance.guid();

    queryOne.mockResolvedValue({ id: roundId, created_by_id: userId });
    queryRows.mockResolvedValue([]);

    const result = await listPlayersService(roundId, userId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    await expect(listPlayersService())
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = 'invalid-uuid';
    const userId = chance.guid();
    
    await expect(listPlayersService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should accept roundId and userId parameters', async () => {
    const roundId = chance.guid();
    const userId = chance.guid();

    queryOne.mockResolvedValue({ id: roundId, created_by_id: userId });
    queryRows.mockResolvedValue([]);

    const result = await listPlayersService(roundId, userId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when userId is missing', async () => {
    const roundId = chance.guid();

    await expect(listPlayersService(roundId))
      .rejects.toThrow('User ID is required');
  });

  test('should call database to get players', async () => {
    const roundId = chance.guid();
    const userId = chance.guid();

    queryOne.mockResolvedValue({ id: roundId, created_by_id: userId });
    queryRows.mockResolvedValue([]);

    await listPlayersService(roundId, userId);

    expect(queryRows).toHaveBeenCalled();
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const roundId = chance.guid();
    const userId = chance.guid();

    queryOne.mockResolvedValue(null);

    await expect(listPlayersService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not creator or player', async () => {
    const roundId = chance.guid();
    const userId = chance.guid();
    const creatorId = chance.guid();

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId })
      .mockResolvedValueOnce(null); // User is not a player

    await expect(listPlayersService(roundId, userId))
      .rejects.toThrow('You must be the round creator or a player to view players');
  });

  test('should return players with usernames from joined users table', async () => {
    const roundId = chance.guid();
    const userId = chance.guid();
    const username = chance.word();
    const guestName = chance.name();
    const mockPlayers = [
      {
        id: chance.guid(),
        round_id: roundId,
        user_id: chance.guid(),
        is_guest: false,
        guest_name: null,
        username,
      },
      {
        id: chance.guid(),
        round_id: roundId,
        user_id: null,
        is_guest: true,
        guest_name: guestName,
        username: null,
      },
    ];

    queryOne.mockResolvedValueOnce({ id: roundId, created_by_id: userId });
    queryRows.mockResolvedValue(mockPlayers);

    const result = await listPlayersService(roundId, userId);

    expect(result).toEqual(mockPlayers);
    expect(result[0].username).toBe(username);
    expect(result[1].guest_name).toBe(guestName);
  });
});
