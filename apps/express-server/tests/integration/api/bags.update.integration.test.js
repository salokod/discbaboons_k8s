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

describe('PUT /api/bags/:id - Integration', () => {
  let user; let
    token;
  let createdUserIds = [];
  let createdBagIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'bagsupdate' });
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
      .put(`/api/bags/${bagId}`)
      .send({ name: chance.word() })
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - bag existence validation
  test('should return 404 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();
    const updateData = {
      name: chance.word(),
      description: chance.sentence(),
    };

    const response = await request(app)
      .put(`/api/bags/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });
  });

  // GOOD: Integration concern - bag update and database persistence
  test('should update bag and persist changes to database', async () => {
    // Create bag directly in DB
    const originalBagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: false,
      is_friends_visible: false,
    };

    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        user.id,
        originalBagData.name,
        originalBagData.description,
        originalBagData.is_public,
        originalBagData.is_friends_visible,
      ],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    // Update the bag
    const updateData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: true,
      is_friends_visible: true,
    };

    const response = await request(app)
      .put(`/api/bags/${bag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      bag: {
        id: bag.id,
        name: updateData.name,
        description: updateData.description,
        is_public: updateData.is_public,
        is_friends_visible: updateData.is_friends_visible,
        user_id: user.id,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    // Integration: Verify persistence to database
    const updatedBag = await query('SELECT * FROM bags WHERE id = $1', [bag.id]);
    expect(updatedBag.rows[0]).toMatchObject({
      name: updateData.name,
      description: updateData.description,
      is_public: updateData.is_public,
      is_friends_visible: updateData.is_friends_visible,
    });
  });

  // GOOD: Integration concern - partial update functionality
  test('should allow partial updates and preserve unchanged fields', async () => {
    // Create bag directly in DB
    const originalBagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: false,
      is_friends_visible: true,
    };

    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        user.id,
        originalBagData.name,
        originalBagData.description,
        originalBagData.is_public,
        originalBagData.is_friends_visible,
      ],
    );
    const bag = bagResult.rows[0];
    createdBagIds.push(bag.id);

    // Update only the name
    const updateData = {
      name: chance.word(),
    };

    const response = await request(app)
      .put(`/api/bags/${bag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      bag: {
        id: bag.id,
        name: updateData.name,
        description: originalBagData.description, // Should remain unchanged
        is_public: originalBagData.is_public, // Should remain unchanged
        is_friends_visible: originalBagData.is_friends_visible, // Should remain unchanged
        user_id: user.id,
      },
    });

    // Integration: Verify partial update in database
    const updatedBag = await query('SELECT * FROM bags WHERE id = $1', [bag.id]);
    expect(updatedBag.rows[0]).toMatchObject({
      name: updateData.name,
      description: originalBagData.description,
      is_public: originalBagData.is_public,
      is_friends_visible: originalBagData.is_friends_visible,
    });
  });

  // GOOD: Integration concern - ownership validation
  test('should prevent updating bag owned by different user', async () => {
    // Create bag owned by different user
    const otherUser = await createTestUser({ prefix: 'otherbag' });
    createdUserIds.push(otherUser.user.id);

    const originalBagData = {
      name: chance.word(),
      description: chance.sentence(),
    };

    const bagResult = await query(
      'INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [otherUser.user.id, originalBagData.name, originalBagData.description, false, false],
    );
    createdBagIds.push(bagResult.rows[0].id);

    // Attempt to update bag owned by different user
    const updateData = {
      name: chance.word(),
    };

    const response = await request(app)
      .put(`/api/bags/${bagResult.rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });

    // Integration: Verify bag remains unchanged in database
    const unchangedBag = await query('SELECT * FROM bags WHERE id = $1', [bagResult.rows[0].id]);
    expect(unchangedBag.rows[0]).toMatchObject({
      name: originalBagData.name,
      description: originalBagData.description,
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid bag ID format (unit test concern)
  // - Empty request body validation (unit test concern)
  // - Field length validation (unit test concern)
  // - Type validation (unit test concern)
  // These are all tested at the service unit test level
});
