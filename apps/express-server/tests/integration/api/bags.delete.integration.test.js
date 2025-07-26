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

describe('DELETE /api/bags/:id - Integration', () => {
  let user; let
    token;
  let createdUserIds = [];
  let createdBagIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'bagsdelete' });
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
    const bagId = chance.guid();

    await request(app)
      .delete(`/api/bags/${bagId}`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - bag existence validation
  test('should return 404 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();

    const response = await request(app)
      .delete(`/api/bags/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });
  });

  // GOOD: Integration concern - bag deletion and database persistence
  test('should delete bag and remove from database', async () => {
    // Create bag directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, chance.word(), chance.sentence(), chance.bool(), chance.bool()],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    const response = await request(app)
      .delete(`/api/bags/${bag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: expect.stringMatching(/deleted/i),
    });

    // Integration: Verify deletion from database
    const deletedBag = await query('SELECT * FROM bags WHERE id = $1', [bag.id]);
    expect(deletedBag.rows).toHaveLength(0);
  });

  // GOOD: Integration concern - ownership validation
  test('should prevent deleting bag owned by different user', async () => {
    // Create bag owned by different user
    const otherUser = await createTestUser({ prefix: 'otherbag' });
    createdUserIds.push(otherUser.user.id);

    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [otherUser.user.id, chance.word(), chance.sentence(), false, false],
    );
    createdBagIds.push(bagResult.rows[0].id);

    const response = await request(app)
      .delete(`/api/bags/${bagResult.rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });

    // Integration: Verify bag still exists in database
    const stillExists = await query('SELECT * FROM bags WHERE id = $1', [bagResult.rows[0].id]);
    expect(stillExists.rows).toHaveLength(1);
  });

  // GOOD: Integration concern - idempotent deletion behavior
  test('should handle duplicate deletion attempts gracefully', async () => {
    // Create bag directly in DB
    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.id, chance.word(), chance.sentence(), chance.bool(), chance.bool()],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    // First deletion should succeed
    await request(app)
      .delete(`/api/bags/${bag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Second deletion attempt should return 404
    const response = await request(app)
      .delete(`/api/bags/${bag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid bag ID format (unit test concern)
  // - Malformed UUID (unit test concern)
  // These are all tested at the service unit test level
});
