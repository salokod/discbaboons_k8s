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

describe('GET /api/bags - Integration', () => {
  let user; let
    token;
  let createdUserIds = [];
  let createdBagIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'bagslist' });
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
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    await request(app)
      .get('/api/bags')
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - empty result handling
  test('should return empty list when user has no bags', async () => {
    const response = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      bags: [],
      total: 0,
    });
  });

  // GOOD: Integration concern - bags list with disc count aggregation
  test('should return user bags with disc count from database', async () => {
    // Create bags directly in DB for speed
    const bag1Result = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, chance.word(), chance.sentence(), false, false],
    );
    const bag2Result = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, chance.word(), chance.sentence(), true, chance.bool()],
    );

    createdBagIds.push(bag1Result.rows[0].id, bag2Result.rows[0].id);

    const response = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify bags returned with correct structure and aggregations
    expect(response.body).toMatchObject({
      success: true,
      total: 2,
    });
    expect(Array.isArray(response.body.bags)).toBe(true);
    expect(response.body.bags).toHaveLength(2);

    // Verify each bag has proper structure including disc_count aggregation
    response.body.bags.forEach((bag) => {
      expect(bag).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        user_id: user.id,
        disc_count: expect.any(Number), // Integration: COUNT aggregation from bag_contents
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });
  });

  // GOOD: Integration concern - user isolation / ownership validation
  test('should only return bags owned by authenticated user', async () => {
    // Create bag for first user
    const bag1Result = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, chance.word(), chance.sentence(), false, false],
    );
    createdBagIds.push(bag1Result.rows[0].id);

    // Create second user directly in DB
    const otherUser = await createTestUser({ prefix: 'bagother' });
    createdUserIds.push(otherUser.user.id);

    // Create bag for second user
    const bag2Result = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [otherUser.user.id, chance.word(), chance.sentence(), true, chance.bool()],
    );
    createdBagIds.push(bag2Result.rows[0].id);

    // First user should only see their own bags
    const response1 = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response1.body.total).toBe(1);
    expect(response1.body.bags[0].user_id).toBe(user.id);
    expect(response1.body.bags[0].id).toBe(bag1Result.rows[0].id);

    // Second user should only see their own bags
    const response2 = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(200);

    expect(response2.body.total).toBe(1);
    expect(response2.body.bags[0].user_id).toBe(otherUser.user.id);
    expect(response2.body.bags[0].id).toBe(bag2Result.rows[0].id);
  });

  // GOOD: Integration concern - disc count aggregation accuracy
  test('should return accurate disc count from bag_contents table', async () => {
    // Create bag directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, chance.word(), chance.sentence(), false, false],
    );
    const bagId = bagResult.rows[0].id;
    createdBagIds.push(bagId);

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

    // Add 3 discs to bag
    await query(
      'INSERT INTO bag_contents (user_id, bag_id, disc_id, condition, weight, color, is_lost) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.id, bagId, discResult.rows[0].id, 'new', chance.floating({ min: 150, max: 180, fixed: 1 }), chance.color(), false],
    );
    await query(
      'INSERT INTO bag_contents (user_id, bag_id, disc_id, condition, weight, color, is_lost) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.id, bagId, discResult.rows[0].id, 'good', chance.floating({ min: 150, max: 180, fixed: 1 }), chance.color(), false],
    );
    await query(
      'INSERT INTO bag_contents (user_id, bag_id, disc_id, condition, weight, color, is_lost) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.id, bagId, discResult.rows[0].id, 'beat-in', chance.floating({ min: 150, max: 180, fixed: 1 }), chance.color(), true], // Lost disc
    );

    const response = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify disc_count aggregation includes all discs (lost and not lost)
    expect(response.body.bags[0].disc_count).toBe(3); // Includes all discs including lost ones

    // Cleanup the test data
    await query('DELETE FROM bag_contents WHERE bag_id = $1', [bagId]);
    await query('DELETE FROM disc_master WHERE id = $1', [discResult.rows[0].id]);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Pagination parameter validation (unit test concern)
  // - Invalid query parameter formats (unit test concern)
  // - Malformed authorization header (unit test concern)
  // These are all tested at the service unit test level
});
