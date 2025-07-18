import {
  describe, test, expect, beforeEach,
} from 'vitest';
import respondToFriendRequestService from '../../../services/friends.respond.service.js';
import mockDatabase from '../setup.js';

describe('respondToFriendRequestService', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
  });
  test('should be a function', () => {
    expect(typeof respondToFriendRequestService).toBe('function');
  });

  test('should throw if requestId is missing', async () => {
    await expect(respondToFriendRequestService(undefined, 1, 'accept'))
      .rejects
      .toThrow(/request id is required/i);
  });

  test('should throw if userId is missing', async () => {
    await expect(respondToFriendRequestService(1, undefined, 'accept'))
      .rejects
      .toThrow(/user id is required/i);
  });

  test('should throw if action is missing', async () => {
    await expect(respondToFriendRequestService(1, 2, undefined))
      .rejects
      .toThrow(/action must be "accept" or "deny"/i);
  });

  test('should throw if action is invalid', async () => {
    await expect(respondToFriendRequestService(1, 2, 'foobar'))
      .rejects
      .toThrow(/action must be "accept" or "deny"/i);
  });

  test('should throw if friend request does not exist', async () => {
    const fakeRequestId = 99999;
    const fakeUserId = 1;
    const action = 'accept';

    mockDatabase.queryOne.mockResolvedValue(null);

    await expect(respondToFriendRequestService(fakeRequestId, fakeUserId, action))
      .rejects
      .toThrow(/friend request not found/i);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, recipient_id, status FROM friendship_requests WHERE id = $1',
      [fakeRequestId],
    );
  });

  test('should throw if user is not the recipient', async () => {
    // Mock a found request with recipient_id = 42
    mockDatabase.queryOne.mockResolvedValue({
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'pending',
    });

    // Try to respond as a different user
    await expect(respondToFriendRequestService(1, 99, 'accept'))
      .rejects
      .toThrow(/not authorized/i);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, recipient_id, status FROM friendship_requests WHERE id = $1',
      [1],
    );
  });

  test('should throw if request is not pending', async () => {
    // Mock a found request with status 'accepted'
    mockDatabase.queryOne.mockResolvedValue({
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'accepted',
    });

    await expect(respondToFriendRequestService(1, 42, 'accept'))
      .rejects
      .toThrow(/request is not pending/i);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, recipient_id, status FROM friendship_requests WHERE id = $1',
      [1],
    );
  });

  test('should update status to accepted and return updated request', async () => {
    const pendingRequest = {
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'pending',
    };

    const updatedRequest = {
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'accepted',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(pendingRequest) // Find the request
      .mockResolvedValueOnce(updatedRequest); // Update the request

    const result = await respondToFriendRequestService(1, 42, 'accept');

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, recipient_id, status FROM friendship_requests WHERE id = $1',
      [1],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'UPDATE friendship_requests SET status = $1 WHERE id = $2 RETURNING *',
      ['accepted', 1],
    );
    expect(result).toEqual(updatedRequest);
  });

  test('should update status to denied and return updated request', async () => {
    const pendingRequest = {
      id: 2,
      requester_id: 11,
      recipient_id: 43,
      status: 'pending',
    };

    const updatedRequest = {
      id: 2,
      requester_id: 11,
      recipient_id: 43,
      status: 'denied',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(pendingRequest) // Find the request
      .mockResolvedValueOnce(updatedRequest); // Update the request

    const result = await respondToFriendRequestService(2, 43, 'deny');

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, recipient_id, status FROM friendship_requests WHERE id = $1',
      [2],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'UPDATE friendship_requests SET status = $1 WHERE id = $2 RETURNING *',
      ['denied', 2],
    );
    expect(result).toEqual(updatedRequest);
  });
});
