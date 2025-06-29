import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET /api/bags/:id - Integration', () => {
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
      username: `bg${testId}`, // bg + 10 chars = 12 chars total (under 20 limit)
      email: `bg${testId}@ex.co`,
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
      await prisma.bags.deleteMany({ where: { user_id: { in: createdUserIds } } });
      await prisma.users.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  });

  test('should require authentication', async () => {
    const bagId = chance.guid();
    const res = await request(app)
      .get(`/api/bags/${bagId}`);
    expect(res.status).toBe(401);
  });

  test('should return 404 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();

    const res = await request(app)
      .get(`/api/bags/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should return bag when user owns it', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-get`,
      description: 'Test bag for get endpoint',
      is_public: false,
      is_friends_visible: true,
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Now get the bag by ID
    const res = await request(app)
      .get(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      bag: {
        id: createdBag.id,
        name: bagData.name,
        description: bagData.description,
        is_public: bagData.is_public,
        is_friends_visible: bagData.is_friends_visible,
        user_id: user.id,
      },
    });

    // Verify all expected properties are present
    expect(res.body.bag).toHaveProperty('created_at');
    expect(res.body.bag).toHaveProperty('updated_at');
  });

  test('should return 404 when user tries to access another users bag', async () => {
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
      username: `bg${testId}2`, // bg + 10 chars + 1 = 13 chars total (under 20 limit)
      email: `bg${testId}2@ex.co`,
      password: password2,
    };
    await request(app).post('/api/auth/register').send(userData2).expect(201);

    const loginRes2 = await request(app).post('/api/auth/login').send({
      username: userData2.username,
      password: userData2.password,
    }).expect(200);
    const token2 = loginRes2.body.tokens.accessToken;
    createdUserIds.push(loginRes2.body.user.id);

    // Second user should NOT be able to access first user's bag
    const res = await request(app)
      .get(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });
});
