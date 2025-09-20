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

describe('POST /api/friends/request - Integration', () => {
  let userA; let
    userB;
  let tokenA; let
    tokenB;
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];

    // Create users directly in DB for speed
    const testUserA = await createTestUser({ prefix: 'friendreqA' });
    userA = testUserA.user;
    tokenA = testUserA.token;
    createdUserIds.push(userA.id);

    const testUserB = await createTestUser({ prefix: 'friendreqB' });
    userB = testUserB.user;
    tokenB = testUserB.token;
    createdUserIds.push(userB.id);
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
      .post('/api/friends/request')
      .send({ recipientId: userB.id })
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - business logic validation
  test('should prevent sending friend request to self', async () => {
    const response = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userA.id })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/yourself/i),
    });
  });

  // GOOD: Integration concern - friend request creation and database persistence
  test('should create friend request and persist to database', async () => {
    const response = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      request: {
        id: expect.any(Number),
        requester_id: userA.id,
        recipient_id: userB.id,
        status: 'pending',
        created_at: expect.any(String),
      },
    });

    // Integration: Verify persistence to database
    const savedRequest = await query(
      'SELECT * FROM friendship_requests WHERE id = $1',
      [response.body.request.id],
    );
    expect(savedRequest.rows).toHaveLength(1);
    expect(savedRequest.rows[0]).toMatchObject({
      requester_id: userA.id,
      recipient_id: userB.id,
      status: 'pending',
    });
  });

  // GOOD: Integration concern - duplicate request prevention
  test('should prevent duplicate friend requests in database', async () => {
    // First request
    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(201);

    // Duplicate request
    const response = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/already exists/i),
    });
  });

  // GOOD: Integration concern - bidirectional request prevention
  test('should prevent reverse friend request when pending exists', async () => {
    // User A requests User B
    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(201);

    // User B tries to request User A (reverse)
    const response = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ recipientId: userA.id })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/already exists/i),
    });
  });

  // GOOD: Integration concern - denied request handling
  test('should allow new request after previous was denied', async () => {
    // User B requests User A first
    const firstRequest = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ recipientId: userA.id })
      .expect(201);

    // Set request as denied directly in DB
    await query(
      'UPDATE friendship_requests SET status = $1 WHERE id = $2',
      ['denied', firstRequest.body.request.id],
    );

    // Now User A can request User B
    const response = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      request: {
        requester_id: userA.id,
        recipient_id: userB.id,
        status: 'pending',
      },
    });
  });

  // GOOD: Integration concern - accepted request handling
  test('should prevent new request when users are already friends', async () => {
    // User B requests User A first
    const firstRequest = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ recipientId: userA.id })
      .expect(201);

    // Set request as accepted directly in DB
    await query(
      'UPDATE friendship_requests SET status = $1 WHERE id = $2',
      ['accepted', firstRequest.body.request.id],
    );

    // Now User A cannot request User B (they're already friends)
    const response = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/already exists/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing recipientId (unit test concern)
  // - Invalid recipientId format (unit test concern)
  // - Non-existent recipient user (unit test concern)
  // These are all tested at the service unit test level
});
