import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';
import {
  createTestUser,
  createFriendship,
  cleanupUsers,
} from '../test-helpers.js';

const chance = new Chance();

describe('GET /api/friends - Integration', () => {
  let userA; let userB; let
    userC;
  let tokenA; let tokenB; let
    tokenC;
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];

    // Create users directly in DB for speed
    const testUserA = await createTestUser({ prefix: 'friendslistA' });
    userA = testUserA.user;
    tokenA = testUserA.token;
    createdUserIds.push(userA.id);

    const testUserB = await createTestUser({ prefix: 'friendslistB' });
    userB = testUserB.user;
    tokenB = testUserB.token;
    createdUserIds.push(userB.id);

    const testUserC = await createTestUser({ prefix: 'friendslistC' });
    userC = testUserC.user;
    tokenC = testUserC.token;
    createdUserIds.push(userC.id);

    // Create friendship between A and B directly in DB
    await createFriendship(userA.id, userB.id);
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
      .get('/api/friends')
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - complex friends query with JOINs and aggregations
  test('should return accepted friends with bag statistics from database', async () => {
    const response = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Integration: Verify complex friend data structure with JOINs
    expect(response.body).toHaveProperty('friends');
    expect(Array.isArray(response.body.friends)).toBe(true);
    expect(response.body.friends).toHaveLength(1);

    const friend = response.body.friends[0];
    expect(friend).toMatchObject({
      id: userB.id,
      username: userB.username,
      email: userB.email,
      friendship: {
        status: 'accepted',
        created_at: expect.any(String),
      },
      bag_stats: {
        total_bags: expect.any(Number),
        visible_bags: expect.any(Number),
        public_bags: expect.any(Number),
      },
    });
  });

  // GOOD: Integration concern - bilateral friendship verification
  test('should show friendship from both perspectives', async () => {
    // User A should see User B as friend
    const responseA = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(responseA.body.friends).toHaveLength(1);
    expect(responseA.body.friends[0].id).toBe(userB.id);

    // User B should see User A as friend
    const responseB = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(responseB.body.friends).toHaveLength(1);
    expect(responseB.body.friends[0].id).toBe(userA.id);
  });

  // GOOD: Integration concern - empty friends list
  test('should return empty array when user has no accepted friends', async () => {
    const response = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenC}`)
      .expect(200);

    expect(response.body).toMatchObject({
      friends: [],
    });
  });

  // GOOD: Integration concern - bag statistics aggregation
  test('should include accurate bag statistics aggregation from database', async () => {
    // Create a bag for userB to test aggregation
    const bagResult = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, 'Test bag', true, true) RETURNING id`,
      [userB.id, chance.word()],
    );

    const response = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    // Integration: Verify bag stats reflect actual DB data
    const friend = response.body.friends[0];
    expect(friend.bag_stats.total_bags).toBeGreaterThanOrEqual(1);
    expect(friend.bag_stats.public_bags).toBeGreaterThanOrEqual(1);

    // Cleanup the bag we created
    await query('DELETE FROM bag_contents WHERE bag_id = $1', [bagResult.rows[0].id]);
    await query('DELETE FROM bags WHERE id = $1', [bagResult.rows[0].id]);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid user ID format (unit test concern)
  // - Missing authentication token format (unit test concern)
  // These are tested at the service unit test level
});
