import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('GET /api/discs/master - Integration', () => {
  let user;
  let token;
  // eslint-disable-next-line no-unused-vars
  let discs = [];
  const testBrand = `Brand-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })}`;
  const testModelA = `ModelA-${chance.string({ length: 5 })}`;
  const testModelB = `ModelB-${chance.string({ length: 5 })}`;
  const testModelC = `ModelC-${chance.string({ length: 5 })}`;

  beforeEach(async () => {
    // Clean up
    await query('DELETE FROM users WHERE email LIKE $1', ['%test-disc-list%']);
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);

    // Register user
    const password = `Abcdef1!${chance.word({ length: 5 })}`;
    const userData = {
      username: `testdiscuser_${chance.string({ length: 5 })}`,
      email: `test-disc-list-${chance.guid()}@example.com`,
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

    // Seed discs
    const discAParams = [
      testBrand, testModelA, chance.integer({ min: 1, max: 14 }),
      chance.integer({ min: 1, max: 7 }), chance.integer({ min: -5, max: 2 }),
      chance.integer({ min: 0, max: 5 }), true, user.id,
    ];
    const discBParams = [
      testBrand, testModelB, chance.integer({ min: 1, max: 14 }),
      chance.integer({ min: 1, max: 7 }), chance.integer({ min: -5, max: 2 }),
      chance.integer({ min: 0, max: 5 }), true, user.id,
    ];
    const discCParams = [
      testBrand, testModelC, chance.integer({ min: 1, max: 14 }),
      chance.integer({ min: 1, max: 7 }), chance.integer({ min: -5, max: 2 }),
      chance.integer({ min: 0, max: 5 }), false, user.id,
    ];

    discs = await Promise.all([
      queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        discAParams,
      ),
      queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        discBParams,
      ),
      queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        discCParams,
      ),
    ]);
  });

  afterEach(async () => {
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);
    await query('DELETE FROM users WHERE email LIKE $1', ['%test-disc-list%']);
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .get('/api/discs/master');
    expect(res.status).toBe(401);
  });

  test('should list only approved discs by default', async () => {
    const res = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((d) => d.approved === true)).toBe(true);
    expect(res.body.some((d) => d.model === testModelA)).toBe(true);
    expect(res.body.some((d) => d.model === testModelB)).toBe(true);
    expect(res.body.some((d) => d.model === testModelC)).toBe(false);
  });

  test('should filter by brand', async () => {
    const res = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .query({ brand: testBrand })
      .expect(200);

    expect(res.body.every((d) => d.brand === testBrand)).toBe(true);
  });

  test('should filter by model substring', async () => {
    const res = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .query({ model: testModelA.slice(0, 4) })
      .expect(200);

    expect(res.body.some((d) => d.model === testModelA)).toBe(true);
  });

  test('should allow admin to see unapproved discs', async () => {
    // Simulate admin by passing approved=false
    const res = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .query({ approved: 'false' })
      .expect(200);

    expect(res.body.some((d) => d.model === testModelC)).toBe(true);
  });
});
