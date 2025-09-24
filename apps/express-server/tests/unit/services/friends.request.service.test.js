import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import friendsRequestService from '../../../services/friends.request.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

describe('friendsRequestService', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
  });

  test('should export a function', () => {
    expect(typeof friendsRequestService).toBe('function');
  });

  test('should throw if requesterId is missing', async () => {
    await expect(friendsRequestService()).rejects.toThrow('Requester ID is required');
    await expect(friendsRequestService(null, chance.integer({ min: 2, max: 1000 }))).rejects.toThrow('Requester ID is required');
  });

  test('should throw if recipientId is missing', async () => {
    await expect(friendsRequestService(chance.integer({ min: 1, max: 1000 }))).rejects.toThrow('Recipient ID is required');
    await expect(friendsRequestService(chance.integer({ min: 1, max: 1000 }), null)).rejects.toThrow('Recipient ID is required');
  });

  test('should throw if requesterId and recipientId are the same', async () => {
    const id = chance.integer({ min: 1, max: 1000 });
    await expect(friendsRequestService(id, id)).rejects.toThrow('Cannot send friend request to yourself');
  });

  test('should throw if a request already exists between users', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    mockDatabase.queryOne.mockResolvedValue({ id: chance.integer({ min: 1001, max: 2000 }), status: 'pending' });
    await expect(friendsRequestService(requesterId, recipientId)).rejects.toThrow('Friend request already exists');

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [requesterId, recipientId],
    );
  });

  test('should create and return a new friend request if none exists', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    const fakeRequest = {
      id: chance.integer({ min: 1001, max: 2000 }),
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No direct request exists
      .mockResolvedValueOnce(null) // No reverse request exists
      .mockResolvedValueOnce(fakeRequest); // Create new request

    const result = await friendsRequestService(requesterId, recipientId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [requesterId, recipientId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [recipientId, requesterId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'INSERT INTO friendship_requests (requester_id, recipient_id, status) VALUES ($1, $2, $3) RETURNING *',
      [requesterId, recipientId, 'pending'],
    );
    expect(result).toEqual(fakeRequest);
  });

  test('should throw if a reverse request already exists between users', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    // Simulate no direct request, but a reverse request exists
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No direct request
      .mockResolvedValueOnce({ id: chance.integer({ min: 2001, max: 3000 }), status: 'pending' }); // Reverse request exists

    await expect(friendsRequestService(requesterId, recipientId)).rejects.toThrow('Friend request already exists');

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [requesterId, recipientId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [recipientId, requesterId],
    );
  });

  test('should allow a new request if reverse request was denied', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    const fakeRequest = {
      id: chance.integer({ min: 3001, max: 4000 }),
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No direct request
      .mockResolvedValueOnce({ id: chance.integer({ min: 2001, max: 3000 }), status: 'denied' }) // Reverse denied
      .mockResolvedValueOnce(fakeRequest); // Create new request

    const result = await friendsRequestService(requesterId, recipientId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [requesterId, recipientId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [recipientId, requesterId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'INSERT INTO friendship_requests (requester_id, recipient_id, status) VALUES ($1, $2, $3) RETURNING *',
      [requesterId, recipientId, 'pending'],
    );
    expect(result).toEqual(fakeRequest);
  });

  test('should throw if a reverse request is already accepted', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No direct request
      .mockResolvedValueOnce({ id: chance.integer({ min: 2001, max: 3000 }), status: 'accepted' }); // Reverse accepted

    await expect(friendsRequestService(requesterId, recipientId)).rejects.toThrow('Friend request already exists');

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [requesterId, recipientId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [recipientId, requesterId],
    );
  });

  test('should allow a new request if direct request was canceled', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    const existingRequestId = chance.integer({ min: 1001, max: 2000 });
    const fakeUpdatedRequest = {
      id: existingRequestId,
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: existingRequestId, status: 'canceled' }) // Direct canceled
      .mockResolvedValueOnce(null) // No reverse request
      .mockResolvedValueOnce(fakeUpdatedRequest); // Update existing request

    const result = await friendsRequestService(requesterId, recipientId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [requesterId, recipientId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [recipientId, requesterId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'UPDATE friendship_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['pending', existingRequestId],
    );
    expect(result).toEqual(fakeUpdatedRequest);
  });

  test('should allow a new request if reverse request was canceled', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    const fakeRequest = {
      id: chance.integer({ min: 5001, max: 6000 }),
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No direct request
      .mockResolvedValueOnce({ id: chance.integer({ min: 2001, max: 3000 }), status: 'canceled' }) // Reverse canceled
      .mockResolvedValueOnce(fakeRequest); // Create new request

    const result = await friendsRequestService(requesterId, recipientId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [requesterId, recipientId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
      [recipientId, requesterId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'INSERT INTO friendship_requests (requester_id, recipient_id, status) VALUES ($1, $2, $3) RETURNING *',
      [requesterId, recipientId, 'pending'],
    );
    expect(result).toEqual(fakeRequest);
  });
});
