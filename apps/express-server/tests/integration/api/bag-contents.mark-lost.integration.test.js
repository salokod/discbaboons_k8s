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

describe('PATCH /api/bags/discs/:contentId/lost - Integration', () => {
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
    const testUser = await createTestUser({ prefix: 'bagcontentsmarklost' });
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
        false,
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
      .patch(`/api/bags/discs/${bagContentId}/lost`)
      .send({ is_lost: true })
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - mark disc as lost and persist to database
  test('should mark disc as lost and persist to database', async () => {
    const lostNotes = chance.sentence();

    const response = await request(app)
      .patch(`/api/bags/discs/${bagContentId}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: true,
        lost_notes: lostNotes,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.bag_content).toMatchObject({
      id: bagContentId,
      is_lost: true,
      lost_notes: lostNotes,
      bag_id: null, // Removed from bag when lost
      lost_at: expect.any(String),
    });

    // Integration: Verify persistence to database
    const bagContent = await query(
      'SELECT * FROM bag_contents WHERE id = $1',
      [bagContentId],
    );
    expect(bagContent.rows[0]).toMatchObject({
      is_lost: true,
      lost_notes: lostNotes,
      bag_id: null,
    });
    expect(bagContent.rows[0].lost_at).toBeTruthy();
  });

  // GOOD: Integration concern - mark disc as found and database persistence
  test('should mark disc as found and persist to database', async () => {
    // First mark as lost directly in DB
    await query(
      'UPDATE bag_contents SET is_lost = true, lost_notes = $1, lost_at = NOW(), bag_id = NULL WHERE id = $2',
      ['Lost disc', bagContentId],
    );

    const response = await request(app)
      .patch(`/api/bags/discs/${bagContentId}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: false,
        bag_id: bagId,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.bag_content).toMatchObject({
      id: bagContentId,
      is_lost: false,
      bag_id: bagId,
      lost_notes: null,
      lost_at: null,
    });

    // Integration: Verify persistence to database
    const bagContent = await query(
      'SELECT * FROM bag_contents WHERE id = $1',
      [bagContentId],
    );
    expect(bagContent.rows[0]).toMatchObject({
      is_lost: false,
      bag_id: bagId,
      lost_notes: null,
      lost_at: null,
    });
  });

  // GOOD: Integration concern - ownership authorization
  test('should deny access to other user bag content', async () => {
    // Create other user directly in DB
    const otherTestUser = await createTestUser({ prefix: 'bagcontentsmarkother' });
    const otherUser = otherTestUser.user;
    const otherToken = otherTestUser.token;
    createdUserIds.push(otherUser.id);

    const response = await request(app)
      .patch(`/api/bags/discs/${bagContentId}/lost`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ is_lost: true })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not found or access denied/i);
  });

  // GOOD: Integration concern - non-existent content handling
  test('should return 404 for non-existent bag content', async () => {
    const nonExistentContentId = chance.guid();

    const response = await request(app)
      .patch(`/api/bags/discs/${nonExistentContentId}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_lost: true })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not found or access denied/i);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing is_lost field validation (unit test concern)
  // - Invalid is_lost value validation (unit test concern)
  // - Missing bag_id when marking found validation (unit test concern)
  // - Invalid UUID format validation (unit test concern)
  // - Timestamp generation and formatting (unit test concern)
  // - Custom flight numbers preservation logic (unit test concern)
  // These are all tested at the service unit test level
});
