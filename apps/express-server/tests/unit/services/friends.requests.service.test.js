import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import getFriendRequestsService from '../../../services/friends.requests.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryRows.mockClear();
});

describe('getFriendRequestsService', () => {
  test('should be a function', () => {
    expect(typeof getFriendRequestsService).toBe('function');
  });

  test('should throw if userId is missing', async () => {
    await expect(getFriendRequestsService(undefined, 'incoming'))
      .rejects
      .toThrow(/user id is required/i);
  });

  test('should throw if type is missing', async () => {
    await expect(getFriendRequestsService(1))
      .rejects
      .toThrow(/type is required/i);
  });

  test('should throw if type is invalid', async () => {
    await expect(getFriendRequestsService(1, chance.word()))
      .rejects
      .toThrow(/type must be "incoming", "outgoing", or "all"/i);
  });

  test('should return incoming requests', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeRequests = [
      {
        id: chance.integer({ min: 1000, max: 2000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'pending',
      },
      {
        id: chance.integer({ min: 2001, max: 3000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'pending',
      },
    ];
    mockDatabase.queryRows.mockResolvedValue(fakeRequests);

    const result = await getFriendRequestsService(userId, 'incoming');
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
      SELECT * FROM friendship_requests 
      WHERE recipient_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `,
      [userId],
    );
    expect(result).toEqual(fakeRequests);
  });

  test('should return outgoing requests', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeRequests = [
      {
        id: chance.integer({ min: 3001, max: 4000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'pending',
      },
      {
        id: chance.integer({ min: 4001, max: 5000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'pending',
      },
    ];
    mockDatabase.queryRows.mockResolvedValue(fakeRequests);

    const result = await getFriendRequestsService(userId, 'outgoing');
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
      SELECT * FROM friendship_requests 
      WHERE requester_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `,
      [userId],
    );
    expect(result).toEqual(fakeRequests);
  });

  test('should return empty array if no requests found', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    const userId = chance.integer({ min: 1, max: 1000 });

    const result = await getFriendRequestsService(userId, 'incoming');
    expect(result).toEqual([]);
  });

  test('should return all requests (incoming and outgoing)', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeRequests = [
      {
        id: chance.integer({ min: 5001, max: 6000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'pending',
      }, // incoming
      {
        id: chance.integer({ min: 6001, max: 7000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'pending',
      }, // outgoing
    ];
    mockDatabase.queryRows.mockResolvedValue(fakeRequests);

    const result = await getFriendRequestsService(userId, 'all');
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
      SELECT * FROM friendship_requests 
      WHERE status = 'pending' 
        AND (recipient_id = $1 OR requester_id = $1)
      ORDER BY created_at DESC
    `,
      [userId],
    );
    expect(result).toEqual(fakeRequests);
  });
});
