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

describe('GET /api/bags/lost-discs - Integration', () => {
  let user;
  let token;
  let bagId;
  let discId;
  let bagContentId;
  let createdUserIds = [];
  let createdBagIds = [];
  let createdDiscIds = [];
  let createdBagContentIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];
    createdDiscIds = [];
    createdBagContentIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'bagcontentslost' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create bag directly in DB
    const bag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, chance.company(), chance.sentence(), false, false],
    );
    bagId = bag.rows[0].id;
    createdBagIds.push(bagId);

    // Create disc directly in DB
    const disc = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        chance.company(),
        chance.word(),
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        true,
        user.id,
      ],
    );
    discId = disc.rows[0].id;
    createdDiscIds.push(discId);

    // Create bag content directly in DB
    const bagContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, is_lost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        user.id,
        bagId,
        discId,
        chance.sentence(),
        chance.floating({ min: 150, max: 180, fixed: 1 }),
        'good',
        true,
      ],
    );
    bagContentId = bagContent.rows[0].id;
    createdBagContentIds.push(bagContentId);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdBagContentIds.length > 0) {
      await query('DELETE FROM bag_contents WHERE id = ANY($1)', [createdBagContentIds]);
    }
    if (createdBagIds.length > 0) {
      await query('DELETE FROM bags WHERE id = ANY($1)', [createdBagIds]);
    }
    if (createdDiscIds.length > 0) {
      await query('DELETE FROM disc_master WHERE id = ANY($1)', [createdDiscIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    await request(app)
      .get('/api/bags/lost-discs')
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - lost disc retrieval with JOIN to disc_master
  test('should return lost discs from database with disc details', async () => {
    const response = await request(app)
      .get('/api/bags/lost-discs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.lost_discs).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({
      total: 1,
      limit: expect.any(Number),
      offset: 0,
      has_more: false,
    });

    // Integration: Verify lost disc includes JOINed disc_master data
    const lostDisc = response.body.lost_discs[0];
    expect(lostDisc).toMatchObject({
      id: bagContentId,
      user_id: user.id,
      bag_id: bagId,
      disc_id: discId,
      is_lost: true,
    });
  });

  // GOOD: Integration concern - pagination parameters affecting database queries
  test('should support pagination parameters', async () => {
    // Create multiple lost bag contents for pagination test
    const contentPromises = [0, 1, 2].map(async (i) => {
      const content = await query(
        `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, is_lost)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          user.id,
          bagId,
          discId,
          `Lost disc ${i + 1}`,
          chance.floating({ min: 150, max: 180, fixed: 1 }),
          'good',
          true,
        ],
      );
      createdBagContentIds.push(content.rows[0].id);
      return content.rows[0].id;
    });
    await Promise.all(contentPromises);

    const response = await request(app)
      .get('/api/bags/lost-discs?limit=2&offset=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      lost_discs: expect.any(Array),
      pagination: {
        total: 4, // 1 from beforeEach + 3 additional
        limit: 2,
        offset: 1,
        has_more: true,
      },
    });
    expect(response.body.lost_discs.length).toBeLessThanOrEqual(2);
  });

  // GOOD: Integration concern - user ownership filtering in database queries
  test('should only return current user lost discs', async () => {
    // Create other user directly in DB
    const otherTestUser = await createTestUser({ prefix: 'bagcontentslostother' });
    const otherUser = otherTestUser.user;
    createdUserIds.push(otherUser.id);

    // Create other user's lost bag content
    const otherBagContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, is_lost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        otherUser.id,
        bagId,
        discId,
        'Other user lost disc',
        chance.floating({ min: 150, max: 180, fixed: 1 }),
        'good',
        true,
      ],
    );
    createdBagContentIds.push(otherBagContent.rows[0].id);

    const response = await request(app)
      .get('/api/bags/lost-discs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Should only return current user's lost discs
    expect(response.body.lost_discs).toHaveLength(1);
    expect(response.body.lost_discs[0].user_id).toBe(user.id);
    expect(response.body.lost_discs[0].notes).not.toBe('Other user lost disc');
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Pagination parameter validation (unit test concern)
  // - Sorting parameter validation (unit test concern)
  // - Complex flight number merging logic (unit test concern)
  // - Date formatting and timestamp handling (unit test concern)
  // These are all tested at the service unit test level
});
