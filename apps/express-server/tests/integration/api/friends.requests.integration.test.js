import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import { query } from '../setup.js';
import {
  createTestUser,
  cleanupUsers,
} from '../test-helpers.js';

describe('GET /api/friends/requests - Integration', () => {
  let userA; let userB; let
    userC;
  let tokenA; let tokenB; let
    tokenC;
  let requestId;
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];

    // Create users directly in DB for speed
    const testUserA = await createTestUser({ prefix: 'friendreqsA' });
    userA = testUserA.user;
    tokenA = testUserA.token;
    createdUserIds.push(userA.id);

    const testUserB = await createTestUser({ prefix: 'friendreqsB' });
    userB = testUserB.user;
    tokenB = testUserB.token;
    createdUserIds.push(userB.id);

    const testUserC = await createTestUser({ prefix: 'friendreqsC' });
    userC = testUserC.user;
    tokenC = testUserC.token;
    createdUserIds.push(userC.id);

    // Create friend request directly in DB
    const requestResult = await query(
      'INSERT INTO friendship_requests (requester_id, recipient_id, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [userA.id, userB.id, 'pending'],
    );
    requestId = requestResult.rows[0].id;
  });

  afterEach(async () => {
    // Clean up friendship requests first (FK constraint)
    if (createdUserIds.length > 0) {
      await query('DELETE FROM friendship_requests WHERE requester_id = ANY($1) OR recipient_id = ANY($1)', [createdUserIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    await request(app)
      .get('/api/friends/requests')
      .query({ type: 'incoming' })
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - incoming requests query with JOINs
  test('should return incoming friend requests with requester user data', async () => {
    const response = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`)
      .query({ type: 'incoming' })
      .expect(200);

    // Integration: Verify query returns correct requests with JOINed user data
    expect(response.body).toHaveProperty('requests');
    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(response.body.requests).toHaveLength(1);

    const friendRequest = response.body.requests[0];
    expect(friendRequest).toMatchObject({
      id: requestId,
      requester_id: userA.id,
      recipient_id: userB.id,
      status: 'pending',
      created_at: expect.any(String),
      requester: {
        id: userA.id,
        username: userA.username,
        email: userA.email,
      },
    });
  });

  // GOOD: Integration concern - outgoing requests query with JOINs
  test('should return outgoing friend requests with recipient user data', async () => {
    const response = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ type: 'outgoing' })
      .expect(200);

    // Integration: Verify query returns correct requests with JOINed user data
    expect(response.body).toHaveProperty('requests');
    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(response.body.requests).toHaveLength(1);

    const friendRequest = response.body.requests[0];
    expect(friendRequest).toMatchObject({
      id: requestId,
      requester_id: userA.id,
      recipient_id: userB.id,
      status: 'pending',
      recipient: {
        id: userB.id,
        username: userB.username,
        email: userB.email,
      },
    });
  });

  // GOOD: Integration concern - complex query combining incoming and outgoing
  test('should return all friend requests with appropriate user data', async () => {
    // Create additional request where userB is the requester
    await query(
      'INSERT INTO friendship_requests (requester_id, recipient_id, status, created_at) VALUES ($1, $2, $3, NOW())',
      [userB.id, userC.id, 'pending'],
    );

    const response = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`)
      .query({ type: 'all' })
      .expect(200);

    // Integration: Should return both incoming and outgoing requests
    expect(response.body.requests).toHaveLength(2);

    const requestIds = response.body.requests.map((r) => r.id);
    expect(requestIds).toContain(requestId); // Incoming request

    // Should include both incoming (as recipient) and outgoing (as requester)
    const incomingReq = response.body.requests.find((r) => r.recipient_id === userB.id);
    const outgoingReq = response.body.requests.find((r) => r.requester_id === userB.id);

    expect(incomingReq).toBeDefined();
    expect(outgoingReq).toBeDefined();

    // Incoming request should have requester data
    expect(incomingReq).toMatchObject({
      requester: {
        id: userA.id,
        username: userA.username,
        email: userA.email,
      },
    });

    // Outgoing request should have recipient data
    expect(outgoingReq).toMatchObject({
      recipient: {
        id: userC.id,
        username: userC.username,
        email: userC.email,
      },
    });
  });

  // GOOD: Integration concern - empty result set handling
  test('should return empty array when user has no friend requests', async () => {
    const response = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenC}`)
      .query({ type: 'incoming' })
      .expect(200);

    expect(response.body).toMatchObject({
      requests: [],
    });
  });

  // GOOD: Integration concern - request status filtering
  test('should handle different request statuses in database', async () => {
    // Create additional pending request
    await query(
      'INSERT INTO friendship_requests (requester_id, recipient_id, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [userC.id, userB.id, 'pending'],
    );

    const response = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`)
      .query({ type: 'incoming' })
      .expect(200);

    // Integration: Should return incoming requests (API may filter by status)
    expect(response.body.requests).toBeDefined();
    expect(Array.isArray(response.body.requests)).toBe(true);

    // Verify all returned requests are for the correct user
    response.body.requests.forEach((friendRequest) => {
      expect(friendRequest.recipient_id).toBe(userB.id);
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid type parameter values (unit test concern)
  // - Missing type parameter (unit test concern)
  // - Malformed query parameters (unit test concern)
  // These are all tested at the service unit test level
});
