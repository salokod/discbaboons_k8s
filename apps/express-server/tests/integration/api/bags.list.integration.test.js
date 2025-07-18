import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('GET /api/bags - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run (short for username limits)
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`; // 10 chars total
    createdUserIds = [];

    // Register user with unique identifier (under 20 char limit)
    const password = `Test1!${chance.word({ length: 2 })}`; // Meets complexity requirements
    const userData = {
      username: `bl${testId}`, // bl + 10 chars = 12 chars total (under 20 limit)
      email: `bl${testId}@ex.co`,
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
    const res = await request(app)
      .get('/api/bags');
    expect(res.status).toBe(401);
  });

  test('should return empty list for user with no bags', async () => {
    const res = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      bags: [],
      total: 0,
    });
  });

  test('should return user bags with disc_count', async () => {
    // Create some bags for the user
    const bagData1 = {
      name: `TestBag-${testId}-first`,
      description: 'First test bag',
      is_public: false,
      is_friends_visible: true,
    };
    const bagData2 = {
      name: `TestBag-${testId}-second`,
      description: 'Second test bag',
      is_public: true,
      is_friends_visible: false,
    };

    await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData1)
      .expect(201);

    await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData2)
      .expect(201);

    const res = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('bags');
    expect(res.body).toHaveProperty('total', 2);
    expect(Array.isArray(res.body.bags)).toBe(true);
    expect(res.body.bags).toHaveLength(2);

    // Check that each bag has required properties including disc_count
    res.body.bags.forEach((bag) => {
      expect(bag).toHaveProperty('id');
      expect(bag).toHaveProperty('name');
      expect(bag).toHaveProperty('description');
      expect(bag).toHaveProperty('is_public');
      expect(bag).toHaveProperty('is_friends_visible');
      expect(bag).toHaveProperty('user_id', user.id);
      expect(bag).toHaveProperty('disc_count', 0); // No discs added yet
      expect(bag).toHaveProperty('created_at');
      expect(bag).toHaveProperty('updated_at');
    });

    // Verify bag names are correct
    const bagNames = res.body.bags.map((bag) => bag.name);
    expect(bagNames).toContain(bagData1.name);
    expect(bagNames).toContain(bagData2.name);
  });

  test('should only return bags owned by authenticated user', async () => {
    // Create bag with first user
    await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `TestBag-${testId}-user1`,
        description: 'User 1 bag',
      })
      .expect(201);

    // Create second user
    const password2 = `Test1!${chance.word({ length: 2 })}`;
    const userData2 = {
      username: `bl${testId}2`, // bl + 10 chars + 1 = 13 chars total (under 20 limit)
      email: `bl${testId}2@ex.co`,
      password: password2,
    };
    await request(app).post('/api/auth/register').send(userData2).expect(201);

    const loginRes2 = await request(app).post('/api/auth/login').send({
      username: userData2.username,
      password: userData2.password,
    }).expect(200);
    const token2 = loginRes2.body.tokens.accessToken;
    createdUserIds.push(loginRes2.body.user.id);

    // Create bag with second user
    await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        name: `TestBag-${testId}-user2`,
        description: 'User 2 bag',
      })
      .expect(201);

    // First user should only see their own bag
    const res1 = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res1.body.total).toBe(1);
    expect(res1.body.bags[0].name).toBe(`TestBag-${testId}-user1`);
    expect(res1.body.bags[0].user_id).toBe(user.id);

    // Second user should only see their own bag
    const res2 = await request(app)
      .get('/api/bags')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);

    expect(res2.body.total).toBe(1);
    expect(res2.body.bags[0].name).toBe(`TestBag-${testId}-user2`);
    expect(res2.body.bags[0].user_id).toBe(loginRes2.body.user.id);
  });
});
