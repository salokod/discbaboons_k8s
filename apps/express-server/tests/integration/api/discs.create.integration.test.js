import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

// Generate unique identifier for this test file
const timestamp = Date.now().toString().slice(-6);
const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
const testId = `dc${timestamp}${random}`;

describe('POST /api/discs/master - Integration', () => {
  let user;
  let token;
  let createdDisc;
  let createdUserIds = [];
  const testBrand = `Brand-${testId}`;
  const testModel = `Model-${testId}`;

  beforeEach(async () => {
    createdUserIds = [];
    // Clean up any leftover test data
    await query('DELETE FROM users WHERE email LIKE $1', [`%${testId}%`]);
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);

    // Register user
    const password = `Abcdef1!${chance.word({ length: 5 })}`;
    const userSuffix = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const userData = {
      username: `u${timestamp}${userSuffix}`,
      email: `${testId}-${userSuffix}@example.com`,
      password,
    };
    const registerRes = await request(app).post('/api/auth/register').send(userData).expect(201);
    createdUserIds.push(registerRes.body.user.id);

    // Login
    const loginRes = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = loginRes.body.tokens.accessToken;
    user = loginRes.body.user;
  });

  afterEach(async () => {
    // Clean up in proper order to avoid foreign key violations
    if (createdDisc) {
      await query('DELETE FROM disc_master WHERE id = $1', [createdDisc.id]);
    }
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);

    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
    // Fallback cleanup by email pattern
    await query('DELETE FROM users WHERE email LIKE $1', [`%${testId}%`]);
    createdUserIds = [];
  });

  test('should require authentication', async () => {
    const discData = {
      brand: testBrand,
      model: testModel,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };
    const res = await request(app)
      .post('/api/discs/master')
      .send(discData);
    expect(res.status).toBe(401);
  });

  test('should create a disc with pending approval and return the created disc', async () => {
    const discData = {
      brand: testBrand,
      model: testModel,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };

    const res = await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(201);

    expect(res.body).toMatchObject({
      brand: discData.brand,
      model: discData.model,
      speed: discData.speed,
      glide: discData.glide,
      turn: discData.turn,
      fade: discData.fade,
      approved: false,
      added_by_id: user.id,
    });

    // Confirm in DB
    createdDisc = await queryOne('SELECT * FROM disc_master WHERE id = $1', [res.body.id]);
    expect(createdDisc).not.toBeNull();
    expect(createdDisc.brand).toBe(discData.brand);
    expect(createdDisc.model).toBe(discData.model);
    expect(createdDisc.approved).toBe(false);
    expect(createdDisc.added_by_id).toBe(user.id);
  });

  test('should fail with 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // missing all fields
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/required/i);
  });

  test('should not allow duplicate disc (same brand and model, case-insensitive)', async () => {
    const discData = {
      brand: testBrand,
      model: testModel,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };

    // First creation should succeed
    await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(201);

    // Second creation with same brand/model (different case) should fail
    const res = await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...discData,
        brand: discData.brand.toUpperCase(),
        model: discData.model.toLowerCase(),
      })
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/already exists/i);
  });
});
