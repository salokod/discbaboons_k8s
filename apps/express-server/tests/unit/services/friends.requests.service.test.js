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

  test('should return incoming requests with requester user data', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requesterId1 = chance.integer({ min: 1, max: 1000 });
    const requesterId2 = chance.integer({ min: 1, max: 1000 });

    const fakeRequestsWithUserData = [
      {
        id: chance.integer({ min: 1000, max: 2000 }),
        requester_id: requesterId1,
        recipient_id: userId,
        status: 'pending',
        created_at: new Date().toISOString(),
        requester_user_id: requesterId1,
        requester_username: 'user1',
        requester_email: 'user1@example.com',
      },
      {
        id: chance.integer({ min: 2001, max: 3000 }),
        requester_id: requesterId2,
        recipient_id: userId,
        status: 'pending',
        created_at: new Date().toISOString(),
        requester_user_id: requesterId2,
        requester_username: 'user2',
        requester_email: 'user2@example.com',
      },
    ];

    const expectedTransformedResult = [
      {
        id: fakeRequestsWithUserData[0].id,
        requester_id: requesterId1,
        recipient_id: userId,
        status: 'pending',
        created_at: fakeRequestsWithUserData[0].created_at,
        requester: {
          id: requesterId1,
          username: 'user1',
          email: 'user1@example.com',
        },
      },
      {
        id: fakeRequestsWithUserData[1].id,
        requester_id: requesterId2,
        recipient_id: userId,
        status: 'pending',
        created_at: fakeRequestsWithUserData[1].created_at,
        requester: {
          id: requesterId2,
          username: 'user2',
          email: 'user2@example.com',
        },
      },
    ];

    mockDatabase.queryRows.mockResolvedValue(fakeRequestsWithUserData);

    const result = await getFriendRequestsService(userId, 'incoming');
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
      SELECT fr.*, u.id as requester_user_id, u.username as requester_username, u.email as requester_email
      FROM friendship_requests fr
      JOIN users u ON fr.requester_id = u.id
      WHERE fr.recipient_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `,
      [userId],
    );
    expect(result).toEqual(expectedTransformedResult);
  });

  test('should return outgoing requests with recipient user data', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const recipientId1 = chance.integer({ min: 1, max: 1000 });
    const recipientId2 = chance.integer({ min: 1, max: 1000 });

    const fakeRequestsWithUserData = [
      {
        id: chance.integer({ min: 3001, max: 4000 }),
        requester_id: userId,
        recipient_id: recipientId1,
        status: 'pending',
        created_at: new Date().toISOString(),
        recipient_user_id: recipientId1,
        recipient_username: 'recipient1',
        recipient_email: 'recipient1@example.com',
      },
      {
        id: chance.integer({ min: 4001, max: 5000 }),
        requester_id: userId,
        recipient_id: recipientId2,
        status: 'pending',
        created_at: new Date().toISOString(),
        recipient_user_id: recipientId2,
        recipient_username: 'recipient2',
        recipient_email: 'recipient2@example.com',
      },
    ];

    const expectedTransformedResult = [
      {
        id: fakeRequestsWithUserData[0].id,
        requester_id: userId,
        recipient_id: recipientId1,
        status: 'pending',
        created_at: fakeRequestsWithUserData[0].created_at,
        recipient: {
          id: recipientId1,
          username: 'recipient1',
          email: 'recipient1@example.com',
        },
      },
      {
        id: fakeRequestsWithUserData[1].id,
        requester_id: userId,
        recipient_id: recipientId2,
        status: 'pending',
        created_at: fakeRequestsWithUserData[1].created_at,
        recipient: {
          id: recipientId2,
          username: 'recipient2',
          email: 'recipient2@example.com',
        },
      },
    ];

    mockDatabase.queryRows.mockResolvedValue(fakeRequestsWithUserData);

    const result = await getFriendRequestsService(userId, 'outgoing');
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
      SELECT fr.*, u.id as recipient_user_id, u.username as recipient_username, u.email as recipient_email
      FROM friendship_requests fr
      JOIN users u ON fr.recipient_id = u.id
      WHERE fr.requester_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `,
      [userId],
    );
    expect(result).toEqual(expectedTransformedResult);
  });

  test('should return empty array if no requests found', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    const userId = chance.integer({ min: 1, max: 1000 });

    const result = await getFriendRequestsService(userId, 'incoming');
    expect(result).toEqual([]);
  });

  test('should return all requests (incoming and outgoing) with proper user data', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requesterId = chance.integer({ min: 1, max: 1000 });
    const recipientId = chance.integer({ min: 1, max: 1000 });

    const fakeRequestsWithUserData = [
      {
        id: chance.integer({ min: 5001, max: 6000 }),
        requester_id: requesterId,
        recipient_id: userId,
        status: 'pending',
        created_at: new Date().toISOString(),
        requester_user_id: requesterId,
        requester_username: 'incoming_user',
        requester_email: 'incoming@example.com',
        recipient_user_id: null,
        recipient_username: null,
        recipient_email: null,
      }, // incoming request
      {
        id: chance.integer({ min: 6001, max: 7000 }),
        requester_id: userId,
        recipient_id: recipientId,
        status: 'pending',
        created_at: new Date().toISOString(),
        requester_user_id: null,
        requester_username: null,
        requester_email: null,
        recipient_user_id: recipientId,
        recipient_username: 'outgoing_user',
        recipient_email: 'outgoing@example.com',
      }, // outgoing request
    ];

    const expectedTransformedResult = [
      {
        id: fakeRequestsWithUserData[0].id,
        requester_id: requesterId,
        recipient_id: userId,
        status: 'pending',
        created_at: fakeRequestsWithUserData[0].created_at,
        requester: {
          id: requesterId,
          username: 'incoming_user',
          email: 'incoming@example.com',
        },
      },
      {
        id: fakeRequestsWithUserData[1].id,
        requester_id: userId,
        recipient_id: recipientId,
        status: 'pending',
        created_at: fakeRequestsWithUserData[1].created_at,
        recipient: {
          id: recipientId,
          username: 'outgoing_user',
          email: 'outgoing@example.com',
        },
      },
    ];

    mockDatabase.queryRows.mockResolvedValue(fakeRequestsWithUserData);

    const result = await getFriendRequestsService(userId, 'all');
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      `
      SELECT fr.*,
        CASE WHEN fr.recipient_id = $1 THEN req_u.id ELSE NULL END as requester_user_id,
        CASE WHEN fr.recipient_id = $1 THEN req_u.username ELSE NULL END as requester_username,
        CASE WHEN fr.recipient_id = $1 THEN req_u.email ELSE NULL END as requester_email,
        CASE WHEN fr.requester_id = $1 THEN rec_u.id ELSE NULL END as recipient_user_id,
        CASE WHEN fr.requester_id = $1 THEN rec_u.username ELSE NULL END as recipient_username,
        CASE WHEN fr.requester_id = $1 THEN rec_u.email ELSE NULL END as recipient_email
      FROM friendship_requests fr
      LEFT JOIN users req_u ON fr.requester_id = req_u.id
      LEFT JOIN users rec_u ON fr.recipient_id = rec_u.id
      WHERE fr.status = 'pending'
        AND (fr.recipient_id = $1 OR fr.requester_id = $1)
      ORDER BY fr.created_at DESC
    `,
      [userId],
    );
    expect(result).toEqual(expectedTransformedResult);
  });
});
