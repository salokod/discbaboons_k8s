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

describe('POST /api/bags - Integration', () => {
  let user; let
    token;
  let createdUserIds = [];
  let createdBagIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdBagIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'bagscreate' });
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
    const bagData = {
      name: chance.word(),
      description: 'Test bag description',
      visibility: 'private',
    };

    await request(app)
      .post('/api/bags')
      .send(bagData)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - bag creation and database persistence
  test('should create bag and persist to database', async () => {
    const bagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };

    const response = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      bag: {
        name: bagData.name,
        description: bagData.description,
        is_public: bagData.is_public,
        is_friends_visible: bagData.is_friends_visible,
        user_id: user.id,
        id: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    // Integration: Verify persistence to database
    const savedBag = await query('SELECT * FROM bags WHERE id = $1', [response.body.bag.id]);
    expect(savedBag.rows).toHaveLength(1);
    expect(savedBag.rows[0]).toMatchObject({
      name: bagData.name,
      description: bagData.description,
      is_public: bagData.is_public,
      is_friends_visible: bagData.is_friends_visible,
      user_id: user.id,
    });

    createdBagIds.push(response.body.bag.id);
  });

  // GOOD: Integration concern - minimal data defaults
  test('should create bag with defaults when minimal data provided', async () => {
    const bagData = {
      name: chance.word(),
    };

    const response = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      bag: {
        name: bagData.name,
        description: null,
        is_public: false,
        is_friends_visible: false,
        user_id: user.id,
      },
    });

    // Integration: Verify defaults applied in database
    const savedBag = await query('SELECT * FROM bags WHERE id = $1', [response.body.bag.id]);
    expect(savedBag.rows[0]).toMatchObject({
      name: bagData.name,
      description: null,
      is_public: false,
      is_friends_visible: false,
    });

    createdBagIds.push(response.body.bag.id);
  });

  // GOOD: Integration concern - user isolation / duplicate name prevention
  test('should prevent duplicate bag names per user in database', async () => {
    const bagName = chance.word();

    // Create first bag
    await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: bagName, description: chance.sentence() })
      .expect(201);

    // Try to create duplicate bag name for same user
    const response = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: bagName, description: chance.sentence() })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/already exists/i),
    });
  });

  // GOOD: Integration concern - user isolation allows same names across users
  test('should allow same bag name for different users', async () => {
    const bagName = chance.word();

    // Create bag with first user
    const response1 = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: bagName, description: chance.sentence() })
      .expect(201);

    createdBagIds.push(response1.body.bag.id);

    // Create second user directly in DB
    const otherUser = await createTestUser({ prefix: 'bagother' });
    createdUserIds.push(otherUser.user.id);

    // Second user should be able to create bag with same name
    const response2 = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send({ name: bagName, description: chance.sentence() })
      .expect(201);

    expect(response2.body.bag.name).toBe(bagName);
    expect(response2.body.bag.user_id).toBe(otherUser.user.id);

    createdBagIds.push(response2.body.bag.id);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing name validation (unit test concern)
  // - Name length validation (unit test concern)
  // - Description length validation (unit test concern)
  // - Boolean type validation (unit test concern)
  // These are all tested at the service unit test level
});
