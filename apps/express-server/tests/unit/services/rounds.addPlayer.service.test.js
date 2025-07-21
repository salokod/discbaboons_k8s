import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import { addPlayerToRound } from '../../../services/rounds.addPlayer.service.js';

// Mock the pool module
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

vi.mock('../../../lib/database.js', () => ({
  default: {
    connect: vi.fn(() => Promise.resolve(mockClient)),
  },
}));

const chance = new Chance();

describe('addPlayerToRound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof addPlayerToRound).toBe('function');
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const players = [{ userId: chance.integer({ min: 1 }) }];
    const requestingUserId = chance.integer({ min: 1 });

    await expect(addPlayerToRound(null, players, requestingUserId))
      .rejects
      .toThrow('Round ID is required');
  });

  test('should throw ValidationError when players array is missing', async () => {
    const roundId = chance.guid({ version: 4 });
    const requestingUserId = chance.integer({ min: 1 });

    await expect(addPlayerToRound(roundId, null, requestingUserId))
      .rejects
      .toThrow('Players array is required and must contain at least one player');
  });

  test('should throw ValidationError when players array is empty', async () => {
    const roundId = chance.guid({ version: 4 });
    const requestingUserId = chance.integer({ min: 1 });

    await expect(addPlayerToRound(roundId, [], requestingUserId))
      .rejects
      .toThrow('Players array is required and must contain at least one player');
  });

  test('should throw ValidationError when requestingUserId is missing', async () => {
    const roundId = chance.guid({ version: 4 });
    const players = [{ userId: chance.integer({ min: 1 }) }];

    await expect(addPlayerToRound(roundId, players, null))
      .rejects
      .toThrow('Requesting user ID is required');
  });

  test('should throw ValidationError when player has neither userId nor guestName', async () => {
    const roundId = chance.guid({ version: 4 });
    const players = [{}]; // Empty player object
    const requestingUserId = chance.integer({ min: 1 });

    await expect(addPlayerToRound(roundId, players, requestingUserId))
      .rejects
      .toThrow('Player at index 0 must include either userId or guestName');
  });

  test('should throw ValidationError when player has both userId and guestName', async () => {
    const roundId = chance.guid({ version: 4 });
    const players = [{
      userId: chance.integer({ min: 1 }),
      guestName: chance.name(),
    }];
    const requestingUserId = chance.integer({ min: 1 });

    await expect(addPlayerToRound(roundId, players, requestingUserId))
      .rejects
      .toThrow('Player at index 0 cannot have both userId and guestName');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const roundId = chance.guid({ version: 4 });
    const players = [{ userId: chance.integer({ min: 1 }) }];
    const requestingUserId = chance.integer({ min: 1 });

    // Mock transaction and round lookup returning empty result
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // Round lookup - empty result

    await expect(addPlayerToRound(roundId, players, requestingUserId))
      .rejects
      .toThrow('Round not found');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should throw AuthorizationError when user is not creator or existing player', async () => {
    const roundId = chance.guid({ version: 4 });
    const roundCreatorId = chance.integer({ min: 1 });
    const requestingUserId = chance.integer({ min: 1 });
    const players = [{ userId: chance.integer({ min: 1 }) }];

    // Mock transaction and queries
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: roundId, created_by_id: roundCreatorId }],
      }) // Round lookup
      .mockResolvedValueOnce({ rows: [] }); // Player check - user not found

    await expect(addPlayerToRound(roundId, players, requestingUserId))
      .rejects
      .toThrow('You must be the round creator or a player to add new players');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should throw ConflictError when user is already in the round', async () => {
    const roundId = chance.guid({ version: 4 });
    const requestingUserId = chance.integer({ min: 1 });
    const existingUserId = chance.integer({ min: 1 });
    const players = [{ userId: existingUserId }];

    // Mock transaction and queries
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: roundId, created_by_id: requestingUserId }],
      }) // Round lookup - user is creator
      .mockResolvedValueOnce({ rows: [{ user_id: existingUserId }] }); // Existing players

    await expect(addPlayerToRound(roundId, players, requestingUserId))
      .rejects
      .toThrow(`User ${existingUserId} is already a player in this round`);

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should throw ValidationError when duplicate userId in batch', async () => {
    const roundId = chance.guid({ version: 4 });
    const requestingUserId = chance.integer({ min: 1 });
    const duplicateUserId = chance.integer({ min: 1 });
    const players = [
      { userId: duplicateUserId },
      { userId: duplicateUserId },
    ];

    // Mock transaction and queries
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: roundId, created_by_id: requestingUserId }],
      }) // Round lookup
      .mockResolvedValueOnce({ rows: [] }); // Existing players

    await expect(addPlayerToRound(roundId, players, requestingUserId))
      .rejects
      .toThrow(`Duplicate userId ${duplicateUserId} found in players array`);

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('should successfully add multiple players (users and guests)', async () => {
    const roundId = chance.guid({ version: 4 });
    const requestingUserId = chance.integer({ min: 1 });
    const userId1 = chance.integer({ min: 1 });
    const userId2 = chance.integer({ min: 1 });
    const guestName1 = chance.name();
    const guestName2 = chance.name();

    const players = [
      { userId: userId1 },
      { guestName: guestName1 },
      { userId: userId2 },
      { guestName: guestName2 },
    ];

    const expectedPlayers = [
      {
        id: chance.guid(), round_id: roundId, user_id: userId1, guest_name: null, is_guest: false,
      },
      {
        id: chance.guid(), round_id: roundId, user_id: null, guest_name: guestName1, is_guest: true,
      },
      {
        id: chance.guid(), round_id: roundId, user_id: userId2, guest_name: null, is_guest: false,
      },
      {
        id: chance.guid(), round_id: roundId, user_id: null, guest_name: guestName2, is_guest: true,
      },
    ];

    // Mock transaction and all queries
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: roundId, created_by_id: requestingUserId }],
      }) // Round lookup
      .mockResolvedValueOnce({ rows: [] }) // Existing players
      .mockResolvedValueOnce({ rows: [expectedPlayers[0]] }) // Insert user 1
      .mockResolvedValueOnce({ rows: [expectedPlayers[1]] }) // Insert guest 1
      .mockResolvedValueOnce({ rows: [expectedPlayers[2]] }) // Insert user 2
      .mockResolvedValueOnce({ rows: [expectedPlayers[3]] }) // Insert guest 2
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await addPlayerToRound(roundId, players, requestingUserId);

    expect(result).toEqual(expectedPlayers);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.query).toHaveBeenCalledTimes(8);
    // BEGIN + round lookup + existing players + 4 inserts + COMMIT
  });

  test('should allow existing player to add new players', async () => {
    const roundId = chance.guid({ version: 4 });
    const roundCreatorId = chance.integer({ min: 1 });
    const requestingUserId = chance.integer({ min: 1 });
    const newUserId = chance.integer({ min: 1 });
    const players = [{ userId: newUserId }];

    const expectedPlayer = {
      id: chance.guid(),
      round_id: roundId,
      user_id: newUserId,
      guest_name: null,
      is_guest: false,
    };

    // Mock transaction and queries
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: roundId, created_by_id: roundCreatorId }],
      }) // Round lookup - different creator
      .mockResolvedValueOnce({ rows: [{ id: 'player1' }] }) // Player check
      .mockResolvedValueOnce({ rows: [] }) // Existing players
      .mockResolvedValueOnce({ rows: [expectedPlayer] }) // Insert new user
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await addPlayerToRound(roundId, players, requestingUserId);

    expect(result).toEqual([expectedPlayer]);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  test('should add single player when only one is provided', async () => {
    const roundId = chance.guid({ version: 4 });
    const requestingUserId = chance.integer({ min: 1 });
    const newUserId = chance.integer({ min: 1 });
    const players = [{ userId: newUserId }];

    const expectedPlayer = {
      id: chance.guid(),
      round_id: roundId,
      user_id: newUserId,
      guest_name: null,
      is_guest: false,
    };

    // Mock transaction and queries
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: roundId, created_by_id: requestingUserId }],
      }) // Round lookup - user is creator
      .mockResolvedValueOnce({ rows: [] }) // Existing players
      .mockResolvedValueOnce({ rows: [expectedPlayer] }) // Insert user
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await addPlayerToRound(roundId, players, requestingUserId);

    expect(result).toEqual([expectedPlayer]);
    expect(result).toHaveLength(1);
  });
});
