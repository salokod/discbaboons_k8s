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

describe('PUT /api/bags/discs/move - Integration', () => {
  let user;
  let token;
  let sourceBagId;
  let targetBagId;
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
    const testUser = await createTestUser({ prefix: 'bagcontentsmove' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create source bag directly in DB
    const sourceBag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, 'Source Bag', chance.sentence(), false, false],
    );
    sourceBagId = sourceBag.rows[0].id;
    createdBagIds.push(sourceBagId);

    // Create target bag directly in DB
    const targetBag = await query(
      `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, 'Target Bag', chance.sentence(), false, false],
    );
    targetBagId = targetBag.rows[0].id;
    createdBagIds.push(targetBagId);

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

    // Create bag content in source bag directly in DB
    const bagContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        user.id,
        sourceBagId,
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
      .put('/api/bags/discs/move')
      .send({
        sourceBagId,
        targetBagId,
        contentIds: [bagContentId],
      })
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - move disc between bags with database persistence
  test('should move disc between bags and persist to database', async () => {
    const moveData = {
      sourceBagId,
      targetBagId,
      contentIds: [bagContentId],
    };

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${token}`)
      .send(moveData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Discs moved successfully');
    expect(response.body.movedCount).toBe(1);

    // Integration: Verify persistence to database
    const movedContent = await query(
      'SELECT * FROM bag_contents WHERE id = $1',
      [bagContentId],
    );
    expect(movedContent.rows[0]).toMatchObject({
      id: bagContentId,
      bag_id: targetBagId,
      user_id: user.id,
    });
    expect(movedContent.rows[0].updated_at).toBeTruthy();
  });

  // GOOD: Integration concern - ownership authorization
  test('should deny access to other user bags', async () => {
    // Create other user directly in DB
    const otherTestUser = await createTestUser({ prefix: 'bagcontentsmoveother' });
    const otherUser = otherTestUser.user;
    const otherToken = otherTestUser.token;
    createdUserIds.push(otherUser.id);

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        sourceBagId,
        targetBagId,
        contentIds: [bagContentId],
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/bag.*not found or access denied/i);
  });

  // GOOD: Integration concern - move all discs when no contentIds provided
  test('should move all discs from source bag when no contentIds provided', async () => {
    // Create additional bag content for testing
    const additionalContent = await query(
      `INSERT INTO bag_contents (user_id, bag_id, disc_id, notes, weight, condition)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        user.id,
        sourceBagId,
        discId,
        'Additional disc',
        chance.floating({ min: 150, max: 180, fixed: 1 }),
        'worn',
      ],
    );
    createdBagContentIds.push(additionalContent.rows[0].id);

    const moveData = {
      sourceBagId,
      targetBagId,
      // No contentIds - should move all
    };

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${token}`)
      .send(moveData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Discs moved successfully');
    expect(response.body.movedCount).toBe(2); // Original + additional

    // Integration: Verify all discs moved to target bag in database
    const allMovedDiscs = await query(
      'SELECT * FROM bag_contents WHERE user_id = $1 AND bag_id = $2',
      [user.id, targetBagId],
    );
    expect(allMovedDiscs.rows).toHaveLength(2);
    allMovedDiscs.rows.forEach((disc) => {
      expect(disc.bag_id).toBe(targetBagId);
    });
  });

  // GOOD: Integration concern - non-existent bags handling
  test('should return 404 for non-existent bags', async () => {
    const nonExistentBagId = chance.guid();

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceBagId: nonExistentBagId,
        targetBagId,
        contentIds: [bagContentId],
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/bag.*not found or access denied/i);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid UUID format validation (unit test concern)
  // - Missing required fields validation (unit test concern)
  // - Array validation for contentIds (unit test concern)
  // - Business logic for same source/target bags (unit test concern)
  // These are all tested at the service unit test level
});
