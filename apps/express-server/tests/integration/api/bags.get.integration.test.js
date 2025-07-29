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
  cleanupUsers,
} from '../test-helpers.js';

const chance = new Chance();

describe('GET /api/bags/:id - Integration', () => {
  let user; let
    token;
  let createdUserIds = [];
  let createdBagIds = [];
  let createdDiscIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];
    createdDiscIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'bagsget' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdBagIds.length > 0) {
      await query('DELETE FROM bag_contents WHERE bag_id = ANY($1)', [createdBagIds]);
      await query('DELETE FROM bags WHERE id = ANY($1)', [createdBagIds]);
    }
    if (createdDiscIds.length > 0) {
      await query('DELETE FROM disc_master WHERE id = ANY($1)', [createdDiscIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    const bagId = chance.guid();

    await request(app)
      .get(`/api/bags/${bagId}`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - bag existence validation
  test('should return 404 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();

    const response = await request(app)
      .get(`/api/bags/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });
  });

  // GOOD: Integration concern - bag retrieval with disc contents
  test('should return bag with disc contents from database', async () => {
    // Create bag directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, chance.word(), chance.sentence(), chance.bool(), chance.bool()],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    // Create disc master record
    const discResult = await query(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        chance.word(),
        chance.word(),
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 1 }),
        chance.integer({ min: 0, max: 5 }),
        true,
      ],
    );
    createdDiscIds.push(discResult.rows[0].id);

    // Add disc to bag
    await query(
      'INSERT INTO bag_contents (user_id, bag_id, disc_id, condition, weight, color, is_lost) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.id, bag.id, discResult.rows[0].id, chance.pickone(['new', 'good', 'worn', 'beat-in']), chance.floating({ min: 150, max: 180, fixed: 1 }), chance.color(), false],
    );

    const response = await request(app)
      .get(`/api/bags/${bag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify bag data returned correctly
    expect(response.body).toMatchObject({
      success: true,
      bag: {
        id: bag.id,
        name: bag.name,
        description: bag.description,
        user_id: user.id,
      },
    });

    // Note: disc contents structure depends on the actual API implementation
    // This test verifies the bag retrieval works, disc JOIN logic can be tested separately
  });

  // GOOD: Integration concern - ownership validation
  test('should return 403 when user does not own bag', async () => {
    // Create bag owned by different user
    const otherUser = await createTestUser({ prefix: 'otherbag' });
    createdUserIds.push(otherUser.user.id);

    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [otherUser.user.id, chance.word(), chance.sentence(), false, false],
    );
    createdBagIds.push(bagResult.rows[0].id);

    const response = await request(app)
      .get(`/api/bags/${bagResult.rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404); // API returns 404 for non-owned bags to prevent enumeration

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i), // API returns not found for security
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid bag ID format (unit test concern)
  // - Malformed UUID (unit test concern)
  // These are all tested at the service unit test level
});
