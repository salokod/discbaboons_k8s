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

describe('DELETE /api/bags/discs/:contentId - Integration', () => {
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
    const testUser = await createTestUser({ prefix: 'bagcontentsremove' });
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
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        user.id,
        bagId,
        discId,
        chance.sentence(),
        chance.floating({ min: 150, max: 180, fixed: 1 }),
        'good',
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
      .delete(`/api/bags/discs/${bagContentId}`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - remove disc content and database persistence
  test('should remove disc content and persist to database', async () => {
    const response = await request(app)
      .delete(`/api/bags/discs/${bagContentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Disc removed from your account successfully');

    // Integration: Verify deletion from database
    const deletedContent = await query(
      'SELECT * FROM bag_contents WHERE id = $1',
      [bagContentId],
    );
    expect(deletedContent.rows).toHaveLength(0);

    // Remove from cleanup array since it's already deleted
    createdBagContentIds = createdBagContentIds.filter((id) => id !== bagContentId);
  });

  // GOOD: Integration concern - ownership authorization
  test('should deny access to other user bag content', async () => {
    // Create other user directly in DB
    const otherTestUser = await createTestUser({ prefix: 'bagcontentsremoveother' });
    const otherUser = otherTestUser.user;
    const otherToken = otherTestUser.token;
    createdUserIds.push(otherUser.id);

    const response = await request(app)
      .delete(`/api/bags/discs/${bagContentId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Disc not found or access denied');

    // Integration: Verify content still exists in database
    const stillExists = await query(
      'SELECT * FROM bag_contents WHERE id = $1',
      [bagContentId],
    );
    expect(stillExists.rows).toHaveLength(1);
  });

  // GOOD: Integration concern - non-existent content handling
  test('should return 404 for non-existent bag content', async () => {
    const nonExistentContentId = chance.guid();

    const response = await request(app)
      .delete(`/api/bags/discs/${nonExistentContentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Disc not found or access denied');
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid UUID format validation (unit test concern)
  // - Concurrent deletion handling (unit test concern)
  // - Transaction rollback scenarios (unit test concern)
  // These are all tested at the service unit test level
});
