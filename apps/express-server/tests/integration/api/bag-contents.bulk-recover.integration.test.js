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

describe('PUT /api/bags/discs/bulk-recover - Integration', () => {
  let user;
  let token;
  let targetBagId;
  let lostDiscIds = [];
  let lostBagContentIds = [];
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
    lostDiscIds = [];
    lostBagContentIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'bulkrecover' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create target bag for recovery
    const targetBag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, 'Recovery Bag', 'Target bag for recovery', false, false],
    );
    targetBagId = targetBag.rows[0].id;
    createdBagIds.push(targetBagId);

    // Create multiple discs and mark them as lost
    const discPromises = Array.from({ length: 3 }, () => query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [chance.company(), chance.word(), 7, 5, -1, 1, true, user.id],
    ));

    const discs = await Promise.all(discPromises);
    discs.forEach((disc) => {
      lostDiscIds.push(disc.rows[0].id);
      createdDiscIds.push(disc.rows[0].id);
    });

    // Create lost bag contents (no bag_id, is_lost = true)
    const lostBagContentPromises = lostDiscIds.map((discId) => query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, is_lost, lost_notes, lost_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [user.id, null, discId, '', 170, 'new', true, 'Tournament loss', new Date()],
    ));

    const lostBagContents = await Promise.all(lostBagContentPromises);
    lostBagContents.forEach((bagContent) => {
      lostBagContentIds.push(bagContent.rows[0].id);
      createdBagContentIds.push(bagContent.rows[0].id);
    });
  });

  afterEach(async () => {
    await query('DELETE FROM bag_contents WHERE id = ANY($1)', [createdBagContentIds]);
    await query('DELETE FROM disc_master WHERE id = ANY($1)', [createdDiscIds]);
    await query('DELETE FROM bags WHERE id = ANY($1)', [createdBagIds]);
    await cleanupUsers(createdUserIds);
  });

  test('should successfully recover multiple lost discs to target bag', async () => {
    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: lostBagContentIds,
        bag_id: targetBagId,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      updated_count: 3,
      failed_ids: [],
    });

    // Verify discs are recovered in database
    const verifyResult = await query(
      'SELECT is_lost, bag_id, lost_notes, lost_at FROM bag_contents WHERE id = ANY($1)',
      [lostBagContentIds],
    );

    expect(verifyResult.rows).toHaveLength(3);
    verifyResult.rows.forEach((row) => {
      expect(row.is_lost).toBe(false);
      expect(row.bag_id).toBe(targetBagId);
      expect(row.lost_notes).toBeNull();
      expect(row.lost_at).toBeNull();
    });
  });

  test('should handle partial success when some discs are not lost', async () => {
    // Create a regular (non-lost) disc in a bag
    const regularBag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, 'Regular Bag', 'Non-lost disc bag', false, false],
    );
    createdBagIds.push(regularBag.rows[0].id);

    const regularDisc = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [chance.company(), chance.word(), 5, 4, 0, 2, true, user.id],
    );
    createdDiscIds.push(regularDisc.rows[0].id);

    const regularBagContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, is_lost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.id, regularBag.rows[0].id, regularDisc.rows[0].id, '', 175, 'good', false],
    );
    createdBagContentIds.push(regularBagContent.rows[0].id);

    // Try to recover both lost discs and regular disc
    const mixedContentIds = [...lostBagContentIds.slice(0, 2), regularBagContent.rows[0].id];

    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: mixedContentIds,
        bag_id: targetBagId,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      updated_count: 2,
      failed_ids: [regularBagContent.rows[0].id],
    });
  });

  test('should return error when target bag not found or not owned', async () => {
    const nonExistentBagId = chance.guid();

    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: lostBagContentIds,
        bag_id: nonExistentBagId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Target bag not found or not owned by user',
      updated_count: 0,
      failed_ids: lostBagContentIds,
    });
  });

  test('should return error when no valid lost discs found', async () => {
    const nonExistentIds = [chance.guid(), chance.guid()];

    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: nonExistentIds,
        bag_id: targetBagId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'No valid lost discs found for the provided content IDs',
      updated_count: 0,
      failed_ids: nonExistentIds,
    });
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .send({
        content_ids: lostBagContentIds,
        bag_id: targetBagId,
      });

    expect(response.status).toBe(401);
  });

  test('should validate content_ids array is provided', async () => {
    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bag_id: targetBagId,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should validate content_ids array is not empty', async () => {
    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: [],
        bag_id: targetBagId,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should validate bag_id is provided', async () => {
    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: lostBagContentIds,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
