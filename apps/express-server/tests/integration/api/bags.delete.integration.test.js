import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('DELETE /api/bags/:id - Integration', () => {
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
      username: `bd${testId}`, // bd + 10 chars = 12 chars total (under 20 limit)
      email: `bd${testId}@ex.co`,
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
      .delete(`/api/bags/${bagId}`);
    expect(res.status).toBe(401);
  });

  test('should return 404 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();

    const res = await request(app)
      .delete(`/api/bags/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should return 404 for invalid UUID format', async () => {
    const invalidBagId = 'invalidUUID';

    const res = await request(app)
      .delete(`/api/bags/${invalidBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should successfully delete bag when user owns it', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-delete`,
      description: 'Test bag for deletion',
      is_public: false,
      is_friends_visible: true,
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Delete the bag
    const res = await request(app)
      .delete(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Should return success response
    expect(res.body).toMatchObject({
      success: true,
      message: 'Bag deleted successfully',
    });

    // Verify bag is actually deleted by trying to get it
    const getRes = await request(app)
      .get(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(getRes.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should return 404 when user tries to delete another users bag', async () => {
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
      username: `bd${testId}2`, // bd + 10 chars + 1 = 13 chars total (under 20 limit)
      email: `bd${testId}2@ex.co`,
      password: password2,
    };
    await request(app).post('/api/auth/register').send(userData2).expect(201);

    const loginRes2 = await request(app).post('/api/auth/login').send({
      username: userData2.username,
      password: userData2.password,
    }).expect(200);
    const token2 = loginRes2.body.tokens.accessToken;
    createdUserIds.push(loginRes2.body.user.id);

    // Second user should NOT be able to delete first user's bag
    const res = await request(app)
      .delete(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });

    // Verify original bag still exists
    const originalBagRes = await request(app)
      .get(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(originalBagRes.body.bag.name).toBe(bagData.name); // Should be unchanged
  });

  test('should handle ValidationError gracefully', async () => {
    // This would happen if service validation fails
    // For delete, this primarily tests the UUID validation path
    const invalidBagId = 'not-a-uuid';

    const res = await request(app)
      .delete(`/api/bags/${invalidBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should not delete the same bag twice', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-double-delete`,
      description: 'Test bag for double deletion',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Delete the bag first time - should succeed
    const deleteRes = await request(app)
      .delete(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleteRes.body).toMatchObject({
      success: true,
      message: 'Bag deleted successfully',
    });

    // Try to delete the same bag again - should return 404
    const res = await request(app)
      .delete(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });
});
