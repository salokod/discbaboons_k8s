/* eslint-disable max-len */
import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('PUT /api/bags/:id - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdBag;

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run (short for username limits)
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`; // 10 chars total
    createdUserIds = [];

    // Register user with unique identifier (under 20 char limit)
    const password = `Test1!${chance.word({ length: 2 })}`; // Meets complexity requirements
    const userData = {
      username: `bu${testId}`, // bu + 10 chars = 12 chars total (under 20 limit)
      email: `bu${testId}@ex.co`,
      password,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);

    // Login
    const loginRes = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = loginRes.body.tokens.accessToken;
    user = loginRes.body.user;
    createdUserIds.push(user.id);
  });

  afterEach(async () => {
    // Clean up only data created in this specific test
    if (createdUserIds.length > 0) {
      await query('DELETE FROM bags WHERE user_id = ANY($1)', [createdUserIds]);
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
  });

  test('should require authentication', async () => {
    const bagId = chance.guid();
    const res = await request(app)
      .put(`/api/bags/${bagId}`)
      .send({ name: 'Updated Bag' });
    expect(res.status).toBe(401);
  });

  test('should return 404 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();
    const updateData = {
      name: 'Updated Bag Name',
      description: 'Updated description',
    };

    const res = await request(app)
      .put(`/api/bags/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should return 400 for invalid UUID format', async () => {
    const invalidBagId = 'invalidUUID';
    const updateData = {
      name: 'Updated Bag Name',
    };

    const res = await request(app)
      .put(`/api/bags/${invalidBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should return 400 for empty request body', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-update-empty-body`,
      description: 'Test bag for empty body test',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Send empty object - this should fail because no update data provided
    const res = await request(app)
      .put(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400); // ValidationError gets caught by error handler and returns 400

    expect(res.body).toMatchObject({
      success: false,
      message: 'updateData is required',
    });
  });

  test('should successfully update bag when user owns it', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-update`,
      description: 'Original description',
      is_public: false,
      is_friends_visible: false,
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Update the bag
    const updateData = {
      name: `UpdatedBag-${testId}`,
      description: 'Updated description',
      is_public: true,
      is_friends_visible: true,
    };

    const res = await request(app)
      .put(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      bag: {
        id: createdBag.id,
        name: updateData.name,
        description: updateData.description,
        is_public: updateData.is_public,
        is_friends_visible: updateData.is_friends_visible,
        user_id: user.id,
      },
    });

    // Verify all expected properties are present
    expect(res.body.bag).toHaveProperty('created_at');
    expect(res.body.bag).toHaveProperty('updated_at');

    // Verify the original created_at is preserved but updated_at changed
    expect(res.body.bag.created_at).toBe(createdBag.created_at);
    expect(new Date(res.body.bag.updated_at)).toBeInstanceOf(Date);
    expect(new Date(res.body.bag.updated_at).getTime()).toBeGreaterThan(new Date(createdBag.updated_at).getTime());
  });

  test('should allow partial updates', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-partial`,
      description: 'Original description',
      is_public: false,
      is_friends_visible: true,
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Update only the name
    const updateData = {
      name: `PartialUpdate-${testId}`,
    };

    const res = await request(app)
      .put(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      bag: {
        id: createdBag.id,
        name: updateData.name,
        description: bagData.description, // Should remain unchanged
        is_public: bagData.is_public, // Should remain unchanged
        is_friends_visible: bagData.is_friends_visible, // Should remain unchanged
        user_id: user.id,
      },
    });

    // Verify updated_at was changed
    expect(new Date(res.body.bag.updated_at).getTime()).toBeGreaterThan(new Date(createdBag.updated_at).getTime());
  });

  test('should return 404 when user tries to update another users bag', async () => {
    // Create bag with first user
    const bagData = {
      name: `TestBag-${testId}-security`,
      description: 'Security test bag',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    const bagId = createRes.body.bag.id;

    // Create second user
    const password2 = `Test1!${chance.word({ length: 2 })}`;
    const userData2 = {
      username: `bu${testId}2`, // bu + 10 chars + 1 = 13 chars total (under 20 limit)
      email: `bu${testId}2@ex.co`,
      password: password2,
    };
    await request(app).post('/api/auth/register').send(userData2).expect(201);

    const loginRes2 = await request(app).post('/api/auth/login').send({
      username: userData2.username,
      password: userData2.password,
    }).expect(200);
    const token2 = loginRes2.body.tokens.accessToken;
    createdUserIds.push(loginRes2.body.user.id);

    // Second user should NOT be able to update first user's bag
    const updateData = {
      name: 'Malicious Update',
    };

    const res = await request(app)
      .put(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send(updateData)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });

    // Verify original bag is unchanged
    const originalBagRes = await request(app)
      .get(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(originalBagRes.body.bag.name).toBe(bagData.name); // Should be unchanged
  });

  test('should handle database validation errors gracefully', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-validation`,
      description: 'Test bag for validation',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Try to update with invalid data (name too long)
    const updateData = {
      name: 'a'.repeat(101), // Exceeds 100 character limit from schema
    };

    const res = await request(app)
      .put(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(500); // Database validation error

    expect(res.body).toMatchObject({
      success: false,
    });
  });
});
