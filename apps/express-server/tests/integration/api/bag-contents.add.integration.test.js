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

describe('POST /api/bags/:id/discs - Integration', () => {
  let user;
  let token;
  let otherUser;
  let bagId;
  let otherBagId;
  let discId;
  let createdUserIds = [];
  let createdBagIds = [];
  let createdDiscIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];
    createdDiscIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'bagcontentsadd' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create other user directly in DB
    const testOther = await createTestUser({ prefix: 'bagcontentsother' });
    otherUser = testOther.user;
    createdUserIds.push(otherUser.id);

    // Create bag directly in DB
    const bag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, chance.company(), chance.sentence(), false, false],
    );
    bagId = bag.rows[0].id;
    createdBagIds.push(bagId);

    // Create other user's bag directly in DB
    const otherBag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [otherUser.id, chance.company(), chance.sentence(), false, false],
    );
    otherBagId = otherBag.rows[0].id;
    createdBagIds.push(otherBagId);

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
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdDiscIds.length > 0) {
      await query('DELETE FROM bag_contents WHERE disc_id = ANY($1)', [createdDiscIds]);
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
      .post(`/api/bags/${bagId}/discs`)
      .send({ disc_id: discId })
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - bag content creation and database persistence
  test('should add disc to bag and persist to database', async () => {
    const discData = {
      disc_id: discId,
      notes: chance.sentence(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
      condition: chance.pickone(['new', 'good', 'worn', 'beat-in']),
      plastic_type: chance.word(),
      color: chance.color(),
    };

    const response = await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.bag_content).toMatchObject({
      user_id: user.id,
      bag_id: bagId,
      disc_id: discId,
      notes: discData.notes,
      weight: discData.weight.toString(),
      condition: discData.condition,
      plastic_type: discData.plastic_type,
      color: discData.color,
      is_lost: false,
    });

    // Integration: Verify persistence to database
    const bagContent = await query(
      'SELECT * FROM bag_contents WHERE user_id = $1 AND bag_id = $2 AND disc_id = $3',
      [user.id, bagId, discId],
    );
    expect(bagContent.rows).toHaveLength(1);
    expect(bagContent.rows[0]).toMatchObject({
      user_id: user.id,
      bag_id: bagId,
      disc_id: discId,
      notes: discData.notes,
    });
  });

  // GOOD: Integration concern - ownership authorization
  test('should deny access to other user bag', async () => {
    const response = await request(app)
      .post(`/api/bags/${otherBagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disc_id: discId })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/access denied/i);
  });

  // GOOD: Integration concern - foreign key constraints
  test('should return 404 for non-existent disc', async () => {
    const nonExistentDiscId = chance.guid();

    const response = await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disc_id: nonExistentDiscId })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/disc not found/i);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing disc_id validation (unit test concern)
  // - Field length validation (unit test concern)
  // - Field type validation (unit test concern)
  // - Custom flight numbers handling (unit test concern)
  // These are all tested at the service unit test level
});
