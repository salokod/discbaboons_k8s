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

describe('PATCH /api/bags/discs/bulk-mark-lost - Integration', () => {
  let user;
  let token;
  let bagId;
  let discIds = [];
  let bagContentIds = [];
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
    discIds = [];
    bagContentIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'bulkmarklost' });
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

    // Create multiple discs directly in DB
    const discPromises = Array.from({ length: 3 }, () => query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [chance.company(), chance.word(), 7, 5, -1, 1, true, user.id],
    ));

    const discs = await Promise.all(discPromises);
    discs.forEach((disc) => {
      discIds.push(disc.rows[0].id);
      createdDiscIds.push(disc.rows[0].id);
    });

    // Create bag contents directly in DB
    const bagContentPromises = discIds.map((discId) => query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, is_lost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.id, bagId, discId, '', 170, 'new', false],
    ));

    const bagContents = await Promise.all(bagContentPromises);
    bagContents.forEach((bagContent) => {
      bagContentIds.push(bagContent.rows[0].id);
      createdBagContentIds.push(bagContent.rows[0].id);
    });
  });

  afterEach(async () => {
    await query('DELETE FROM bag_contents WHERE id = ANY($1)', [createdBagContentIds]);
    await query('DELETE FROM disc_master WHERE id = ANY($1)', [createdDiscIds]);
    await query('DELETE FROM bags WHERE id = ANY($1)', [createdBagIds]);
    await cleanupUsers(createdUserIds);
  });

  test('should successfully mark multiple discs as lost', async () => {
    const lostNotes = 'Lost entire bag at tournament';

    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: bagContentIds,
        lost_notes: lostNotes,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      updated_count: 3,
      failed_ids: [],
    });

    // Verify discs are marked as lost in database
    const verifyResult = await query(
      'SELECT is_lost, bag_id, lost_notes, lost_at FROM bag_contents WHERE id = ANY($1)',
      [bagContentIds],
    );

    expect(verifyResult.rows).toHaveLength(3);
    verifyResult.rows.forEach((row) => {
      expect(row.is_lost).toBe(true);
      expect(row.bag_id).toBeNull();
      expect(row.lost_notes).toBe(lostNotes);
      expect(row.lost_at).toBeTruthy();
    });
  });

  test('should handle partial success when some discs are not owned by user', async () => {
    // Create another user's disc
    const anotherUser = await createTestUser({ prefix: 'anotherbulkuser' });
    createdUserIds.push(anotherUser.user.id);

    const anotherDisc = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [chance.company(), chance.word(), 5, 4, 0, 2, true, anotherUser.user.id],
    );
    createdDiscIds.push(anotherDisc.rows[0].id);

    const anotherBag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [anotherUser.user.id, chance.company(), chance.sentence(), false, false],
    );
    createdBagIds.push(anotherBag.rows[0].id);

    const anotherBagContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition, is_lost)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [anotherUser.user.id, anotherBag.rows[0].id, anotherDisc.rows[0].id, '', 175, 'good', false],
    );
    createdBagContentIds.push(anotherBagContent.rows[0].id);

    // Try to mark both own discs and another user's disc as lost
    const mixedContentIds = [...bagContentIds.slice(0, 2), anotherBagContent.rows[0].id];

    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: mixedContentIds,
        lost_notes: 'Test partial success',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      updated_count: 2,
      failed_ids: [anotherBagContent.rows[0].id],
    });
  });

  test('should return error when no valid discs found', async () => {
    const nonExistentIds = [chance.guid(), chance.guid()];

    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: nonExistentIds,
        lost_notes: 'Test no valid discs',
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'No valid discs found for the provided content IDs',
      updated_count: 0,
      failed_ids: nonExistentIds,
    });
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .send({
        content_ids: bagContentIds,
        lost_notes: 'Test authentication',
      });

    expect(response.status).toBe(401);
  });

  test('should validate content_ids array is provided', async () => {
    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lost_notes: 'Test validation',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should validate content_ids array is not empty', async () => {
    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: [],
        lost_notes: 'Test validation',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should handle missing lost_notes gracefully', async () => {
    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content_ids: bagContentIds.slice(0, 1),
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      updated_count: 1,
      failed_ids: [],
    });

    // Verify disc is marked as lost with null notes
    const verifyResult = await query(
      'SELECT is_lost, lost_notes FROM bag_contents WHERE id = $1',
      [bagContentIds[0]],
    );

    expect(verifyResult.rows[0].is_lost).toBe(true);
    expect(verifyResult.rows[0].lost_notes).toBeNull();
  });
});
