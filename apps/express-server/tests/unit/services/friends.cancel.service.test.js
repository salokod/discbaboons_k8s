import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import cancelFriendRequestService from '../../../services/friends.cancel.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
});

describe('cancelFriendRequestService', () => {
  test('should be a function', () => {
    expect(typeof cancelFriendRequestService).toBe('function');
  });

  test('should throw if userId is missing', async () => {
    const requestId = chance.integer({ min: 1, max: 1000 });
    await expect(cancelFriendRequestService(undefined, requestId))
      .rejects
      .toThrow(/user id is required/i);
  });

  test('should throw if requestId is missing', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    await expect(cancelFriendRequestService(userId, undefined))
      .rejects
      .toThrow(/request id is required/i);
  });

  test('should throw if request does not exist', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestId = chance.integer({ min: 1, max: 1000 });

    mockDatabase.queryOne.mockResolvedValue(null);

    await expect(cancelFriendRequestService(userId, requestId))
      .rejects
      .toThrow(/friend request not found/i);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM friendship_requests WHERE id = $1',
      [requestId],
    );
  });

  test('should throw if user is not the requester', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestId = chance.integer({ min: 1, max: 1000 });
    const differentUserId = chance.integer({ min: 1001, max: 2000 });

    const fakeRequest = {
      id: requestId,
      requester_id: differentUserId,
      recipient_id: chance.integer({ min: 1, max: 1000 }),
      status: 'pending',
    };

    mockDatabase.queryOne.mockResolvedValueOnce(fakeRequest);

    await expect(cancelFriendRequestService(userId, requestId))
      .rejects
      .toThrow(/you can only cancel your own friend requests/i);
  });

  test('should throw if request is not pending', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestId = chance.integer({ min: 1, max: 1000 });

    const fakeRequest = {
      id: requestId,
      requester_id: userId,
      recipient_id: chance.integer({ min: 1, max: 1000 }),
      status: 'accepted',
    };

    mockDatabase.queryOne.mockResolvedValueOnce(fakeRequest);

    await expect(cancelFriendRequestService(userId, requestId))
      .rejects
      .toThrow(/only pending requests can be canceled/i);
  });

  test('should cancel pending request successfully', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestId = chance.integer({ min: 1, max: 1000 });

    const fakeRequest = {
      id: requestId,
      requester_id: userId,
      recipient_id: chance.integer({ min: 1, max: 1000 }),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updatedRequest = {
      ...fakeRequest,
      status: 'canceled',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(fakeRequest)
      .mockResolvedValueOnce(updatedRequest);

    const result = await cancelFriendRequestService(userId, requestId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM friendship_requests WHERE id = $1',
      [requestId],
    );

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'UPDATE friendship_requests SET status = $1 WHERE id = $2 RETURNING *',
      ['canceled', requestId],
    );

    expect(result).toEqual(updatedRequest);
  });

  test('should handle database errors gracefully', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestId = chance.integer({ min: 1, max: 1000 });

    const dbError = new Error('Database connection failed');
    mockDatabase.queryOne.mockRejectedValue(dbError);

    await expect(cancelFriendRequestService(userId, requestId))
      .rejects
      .toThrow('Database connection failed');
  });
});
