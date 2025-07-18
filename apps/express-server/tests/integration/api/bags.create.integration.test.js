import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('POST /api/bags - Integration', () => {
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
      username: `tc${testId}`, // tc + 10 chars = 12 chars total (under 20 limit)
      email: `tc${testId}@ex.co`,
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
    const bagData = {
      name: `TestBag-${testId}-auth`,
      description: 'Test bag description',
      is_public: false,
      is_friends_visible: true,
    };
    const res = await request(app)
      .post('/api/bags')
      .send(bagData);
    expect(res.status).toBe(401);
  });

  test('should create a bag with valid data and return the created bag', async () => {
    const bagData = {
      name: `TestBag-${testId}-valid`,
      description: 'Test bag description',
      is_public: false,
      is_friends_visible: true,
    };

    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      bag: {
        name: bagData.name,
        description: bagData.description,
        is_public: bagData.is_public,
        is_friends_visible: bagData.is_friends_visible,
        user_id: user.id,
      },
    });

    // Confirm in DB
    createdBag = await queryOne('SELECT * FROM bags WHERE id = $1', [res.body.bag.id]);
    expect(createdBag).not.toBeNull();
    expect(createdBag.name).toBe(bagData.name);
    expect(createdBag.description).toBe(bagData.description);
    expect(createdBag.is_public).toBe(bagData.is_public);
    expect(createdBag.is_friends_visible).toBe(bagData.is_friends_visible);
    expect(createdBag.user_id).toBe(user.id);
  });

  test('should create a bag with minimal data (name only)', async () => {
    const bagData = {
      name: `TestBag-${testId}-minimal`,
    };

    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    expect(res.body).toMatchObject({
      success: true,
      bag: {
        name: bagData.name,
        description: null,
        is_public: false,
        is_friends_visible: false,
        user_id: user.id,
      },
    });

    // Confirm in DB
    const bag = await queryOne('SELECT * FROM bags WHERE id = $1', [res.body.bag.id]);
    expect(bag).not.toBeNull();
    expect(bag.name).toBe(bagData.name);
    expect(bag.description).toBeNull();
    expect(bag.is_public).toBe(false);
    expect(bag.is_friends_visible).toBe(false);
  });

  test('should fail with 400 if name is missing', async () => {
    const bagData = {
      description: 'Test bag without name',
      is_public: true,
    };

    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/name.*required/i);
  });

  test('should fail with 400 if name is too long', async () => {
    const bagData = {
      name: 'a'.repeat(101), // 101 characters, exceeds 100 limit
      description: 'Test bag with long name',
    };

    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/name.*100.*characters/i);
  });

  test('should fail with 400 if description is too long', async () => {
    const bagData = {
      name: `TestBag-${testId}-longdesc`,
      description: 'a'.repeat(501), // 501 characters, exceeds 500 limit
    };

    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/description.*500.*characters/i);
  });

  test('should fail with 400 if is_public is not a boolean', async () => {
    const bagData = {
      name: `TestBag-${testId}-invalidpublic`,
      is_public: 'true', // string instead of boolean
    };

    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/is_public.*boolean/i);
  });

  test('should fail with 400 if is_friends_visible is not a boolean', async () => {
    const bagData = {
      name: `TestBag-${testId}-invalidfriends`,
      is_friends_visible: 1, // number instead of boolean
    };

    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/is_friends_visible.*boolean/i);
  });

  test('should not allow duplicate bag names for the same user (case-insensitive)', async () => {
    const bagData = {
      name: `TestBag-${testId}-duplicate`,
      description: 'First bag',
    };

    // First creation should succeed
    await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    // Second creation with same name (different case) should fail
    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...bagData,
        name: bagData.name.toUpperCase(),
        description: 'Second bag with same name',
      })
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/bag.*name.*already exists/i);
  });

  test('should allow same bag name for different users', async () => {
    // Create bag with first user
    const bagData = {
      name: `TestBag-${testId}-shared`,
      description: 'First user bag',
    };

    await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    // Create second user
    const password2 = `Test1!${chance.word({ length: 2 })}`;
    const userData2 = {
      username: `tc${testId}2`, // tc + 10 chars + 1 = 13 chars total (under 20 limit)
      email: `tc${testId}2@ex.co`,
      password: password2,
    };
    await request(app).post('/api/auth/register').send(userData2).expect(201);

    const loginRes2 = await request(app).post('/api/auth/login').send({
      username: userData2.username,
      password: userData2.password,
    }).expect(200);
    const token2 = loginRes2.body.tokens.accessToken;
    createdUserIds.push(loginRes2.body.user.id);

    // Second user should be able to create bag with same name
    const res = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        ...bagData,
        description: 'Second user bag',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.bag.name).toBe(bagData.name);
    expect(res.body.bag.user_id).toBe(loginRes2.body.user.id);
  });
});
