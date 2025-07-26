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

describe('GET /api/bags/friends/:friendUserId/:bagId - Integration', () => {
  let userA; let userB; let userC; let tokenA; let
    tokenB;
  let createdUserIds = [];
  let createdBagIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];

    // Create users directly in DB for speed
    const testUserA = await createTestUser({ prefix: 'friendbagA' });
    userA = testUserA.user;
    tokenA = testUserA.token;
    createdUserIds.push(userA.id);

    const testUserB = await createTestUser({ prefix: 'friendbagB' });
    userB = testUserB.user;
    tokenB = testUserB.token;
    createdUserIds.push(userB.id);

    const testUserC = await createTestUser({ prefix: 'friendbagC' });
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
    const bagId = chance.guid();

    await request(app)
      .get(`/api/bags/friends/${userB.id}/${bagId}`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - friendship validation
  test('should return 403 when users are not friends', async () => {
    const bagId = chance.guid();

    const response = await request(app)
      .get(`/api/bags/friends/${userC.id}/${bagId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not friends/i),
    });
  });

  // GOOD: Integration concern - bag visibility validation
  test('should return 403 for private bag', async () => {
    // Create private bag directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userB.id, chance.word(), chance.sentence(), false, false],
    );
    createdBagIds.push(bagResult.rows[0].id);

    const response = await request(app)
      .get(`/api/bags/friends/${userB.id}/${bagResult.rows[0].id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found|not visible/i),
    });
  });

  // GOOD: Integration concern - non-existent bag handling
  test('should return 403 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();

    const response = await request(app)
      .get(`/api/bags/friends/${userB.id}/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found|not visible/i),
    });
  });

  // GOOD: Integration concern - public bag access
  test('should return public bag with contents from database', async () => {
    // Create public bag directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userB.id, chance.word(), chance.sentence(), true, false],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    const response = await request(app)
      .get(`/api/bags/friends/${userB.id}/${bag.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bag: {
        id: bag.id,
        name: bag.name,
        description: bag.description,
        is_public: true,
        is_friends_visible: false,
        contents: expect.any(Array),
      },
    });
  });

  // GOOD: Integration concern - friends-visible bag access
  test('should return friends-visible bag with contents from database', async () => {
    // Create friends-visible bag directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userB.id, chance.word(), chance.sentence(), false, true],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    const response = await request(app)
      .get(`/api/bags/friends/${userB.id}/${bag.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bag: {
        id: bag.id,
        name: bag.name,
        description: bag.description,
        is_public: false,
        is_friends_visible: true,
        contents: expect.any(Array),
      },
    });
  });

  // GOOD: Integration concern - bidirectional friendship access
  test('should work bidirectionally - User B can view User A bag', async () => {
    // Create bag for User A directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userA.id, chance.word(), chance.sentence(), false, true],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    // User B should be able to view User A's bag
    const response = await request(app)
      .get(`/api/bags/friends/${userA.id}/${bag.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      friend: {
        id: userA.id,
      },
      bag: {
        id: bag.id,
        name: bag.name,
        description: bag.description,
        contents: expect.any(Array),
      },
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid friendUserId format (unit test concern)
  // - Invalid bagId format (unit test concern)
  // These are all tested at the service unit test level
});
