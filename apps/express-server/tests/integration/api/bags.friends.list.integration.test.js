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

describe('GET /api/bags/friends/:friendUserId - Integration', () => {
  let userA;
  let userB;
  let userC;
  let tokenA;
  let tokenB;
  let createdUserIds = [];
  let createdBagIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];

    // Create users directly in DB for speed
    const testUserA = await createTestUser({ prefix: 'friendbagsA' });
    userA = testUserA.user;
    tokenA = testUserA.token;
    createdUserIds.push(userA.id);

    const testUserB = await createTestUser({ prefix: 'friendbagsB' });
    userB = testUserB.user;
    tokenB = testUserB.token;
    createdUserIds.push(userB.id);

    const testUserC = await createTestUser({ prefix: 'friendbagsC' });
    userC = testUserC.user;
    createdUserIds.push(userC.id);

    // Create friendship between A and B directly in DB
    await createFriendship(userA.id, userB.id);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdBagIds.length > 0) {
      await query('DELETE FROM bag_contents WHERE bag_id = ANY($1)', [createdBagIds]);
      await query('DELETE FROM bags WHERE id = ANY($1)', [createdBagIds]);
    }
    if (createdUserIds.length > 0) {
      await query('DELETE FROM friendship_requests WHERE requester_id = ANY($1) OR recipient_id = ANY($1)', [createdUserIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    await request(app)
      .get(`/api/bags/friends/${userB.id}`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - friendship validation
  test('should return 403 when users are not friends', async () => {
    const response = await request(app)
      .get(`/api/bags/friends/${userC.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not friends/i),
    });
  });

  // GOOD: Integration concern - bag visibility filtering with aggregation
  test('should return only visible bags with disc counts from database', async () => {
    // Create bags directly in DB with different visibility settings
    const publicBag = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userB.id, chance.word(), chance.sentence(), true, false],
    );
    createdBagIds.push(publicBag.rows[0].id);

    const friendsBag = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userB.id, chance.word(), chance.sentence(), false, true],
    );
    createdBagIds.push(friendsBag.rows[0].id);

    const privateBag = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userB.id, chance.word(), chance.sentence(), false, false],
    );
    createdBagIds.push(privateBag.rows[0].id);

    const response = await request(app)
      .get(`/api/bags/friends/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bags: expect.any(Array),
    });

    // Integration: Should include public and friends-visible bags, exclude private
    expect(response.body.bags).toHaveLength(2);
    const bagNames = response.body.bags.map((bag) => bag.name);
    expect(bagNames).toContain(publicBag.rows[0].name);
    expect(bagNames).toContain(friendsBag.rows[0].name);
    expect(bagNames).not.toContain(privateBag.rows[0].name);

    // Integration: Verify disc_count aggregation
    response.body.bags.forEach((bag) => {
      expect(bag).toMatchObject({
        disc_count: expect.any(Number),
      });
    });
  });

  // GOOD: Integration concern - bidirectional friendship access
  test('should work bidirectionally - User B can view User A bags', async () => {
    // Create friends-visible bag for User A directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userA.id, chance.word(), chance.sentence(), false, true],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    // User B should be able to see User A's visible bags
    const response = await request(app)
      .get(`/api/bags/friends/${userA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      friend: {
        id: userA.id,
      },
      bags: expect.arrayContaining([
        expect.objectContaining({
          id: bag.id,
          name: bag.name,
          is_friends_visible: true,
          disc_count: expect.any(Number),
        }),
      ]),
    });
  });

  // GOOD: Integration concern - empty result handling
  test('should return empty bags array when friend has no visible bags', async () => {
    // User B has no bags
    const response = await request(app)
      .get(`/api/bags/friends/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bags: [],
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid friendUserId format (unit test concern)
  // These are all tested at the service unit test level
});
