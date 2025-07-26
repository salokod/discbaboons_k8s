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

describe('POST /api/friends/respond - Integration', () => {
  let userA; let
    userB;
  let tokenA; let
    tokenB;
  let requestId;
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];

    // Create users directly in DB for speed
    const testUserA = await createTestUser({ prefix: 'friendrespA' });
    userA = testUserA.user;
    tokenA = testUserA.token;
    createdUserIds.push(userA.id);

    const testUserB = await createTestUser({ prefix: 'friendrespB' });
    userB = testUserB.user;
    tokenB = testUserB.token;
    createdUserIds.push(userB.id);

    // Create a pending friend request directly in DB
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
      .post('/api/friends/respond')
      .send({ requestId, action: 'accept' })
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - permission validation against DB
  test('should prevent non-recipient from responding to friend request', async () => {
    const response = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenA}`) // requester, not recipient
      .send({ requestId, action: 'accept' })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not authorized|recipient/i),
    });
  });

  // GOOD: Integration concern - friend request acceptance and database update
  test('should accept friend request and update database status', async () => {
    const response = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'accept' })
      .expect(200);

    expect(response.body).toMatchObject({
      request: {
        id: requestId,
        status: 'accepted',
      },
    });

    // Integration: Verify database was updated
    const updatedRequest = await query(
      'SELECT * FROM friendship_requests WHERE id = $1',
      [requestId],
    );
    expect(updatedRequest.rows[0]).toMatchObject({
      status: 'accepted',
    });
  });

  // GOOD: Integration concern - friend request denial and database update
  test('should deny friend request and update database status', async () => {
    const response = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'deny' })
      .expect(200);

    expect(response.body).toMatchObject({
      request: {
        id: requestId,
        status: 'denied',
      },
    });

    // Integration: Verify database was updated
    const updatedRequest = await query(
      'SELECT * FROM friendship_requests WHERE id = $1',
      [requestId],
    );
    expect(updatedRequest.rows[0]).toMatchObject({
      status: 'denied',
    });
  });

  // GOOD: Integration concern - prevent responding to already processed request
  test('should prevent responding to non-pending request', async () => {
    // Accept the request first
    await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'accept' })
      .expect(200);

    // Try to respond again
    const response = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'deny' })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/pending|already/i),
    });
  });

  // GOOD: Integration concern - non-existent request handling
  test('should return 404 for non-existent friend request', async () => {
    const fakeRequestId = 999999; // Use numeric ID that doesn't exist

    const response = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId: fakeRequestId, action: 'accept' })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing requestId (unit test concern)
  // - Invalid action values (unit test concern)
  // - Invalid UUID format (unit test concern)
  // These are all tested at the service unit test level
});
