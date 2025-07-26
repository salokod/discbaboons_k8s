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

describe('PUT /api/bags/:id/discs/:contentId - Integration', () => {
  let user;
  let token;
  let otherUser;
  let bagId;
  let otherBagId;
  let discId;
  let bagContentId;
  let otherBagContentId;
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
    const testUser = await createTestUser({ prefix: 'bagcontentsedit' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create other user directly in DB
    const testOther = await createTestUser({ prefix: 'bagcontenteditother' });
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

    // Create bag content directly in DB
    const bagContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, plastic_type, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        user.id,
        bagId,
        discId,
        chance.sentence(),
        chance.floating({ min: 150, max: 180, fixed: 1 }),
        'good',
        chance.word(),
        chance.color(),
      ],
    );
    bagContentId = bagContent.rows[0].id;
    createdBagContentIds.push(bagContentId);

    // Create other user's bag content directly in DB
    const otherBagContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        otherUser.id,
        otherBagId,
        discId,
        chance.sentence(),
        chance.floating({ min: 150, max: 180, fixed: 1 }),
        'worn',
      ],
    );
    otherBagContentId = otherBagContent.rows[0].id;
    createdBagContentIds.push(otherBagContentId);
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
      .put(`/api/bags/${bagId}/discs/${bagContentId}`)
      .send({ notes: chance.sentence() })
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - bag content update and database persistence
  test('should edit bag content and persist to database', async () => {
    const updateData = {
      notes: chance.sentence(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
      condition: chance.pickone(['new', 'good', 'worn', 'beat-in']),
      plastic_type: chance.word(),
      color: chance.color(),
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };

    const response = await request(app)
      .put(`/api/bags/${bagId}/discs/${bagContentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.bag_content).toMatchObject({
      id: bagContentId,
      user_id: user.id,
      bag_id: bagId,
      disc_id: discId,
      notes: updateData.notes,
      weight: updateData.weight.toString(),
      condition: updateData.condition,
      plastic_type: updateData.plastic_type,
      color: updateData.color,
      speed: updateData.speed,
      glide: updateData.glide,
      turn: updateData.turn,
      fade: updateData.fade,
    });

    // Integration: Verify persistence to database
    const bagContent = await query(
      'SELECT * FROM bag_contents WHERE id = $1',
      [bagContentId],
    );
    expect(bagContent.rows[0]).toMatchObject({
      notes: updateData.notes,
      condition: updateData.condition,
      plastic_type: updateData.plastic_type,
      color: updateData.color,
    });
  });

  // GOOD: Integration concern - ownership authorization
  test('should deny access to other user bag content', async () => {
    const response = await request(app)
      .put(`/api/bags/${otherBagId}/discs/${otherBagContentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: chance.sentence() })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/access denied/i);
  });

  // GOOD: Integration concern - non-existent content handling
  test('should return 403 for non-existent bag content', async () => {
    const nonExistentContentId = chance.guid();

    const response = await request(app)
      .put(`/api/bags/${bagId}/discs/${nonExistentContentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: chance.sentence() })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/access denied/i);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Flight number validation (unit test concern)
  // - Field length validation (unit test concern)
  // - Field type validation (unit test concern)
  // - Partial update logic (unit test concern)
  // These are all tested at the service unit test level
});
