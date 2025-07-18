import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('GET /api/discs/pending - Integration', () => {
  let adminUser;
  let adminToken;
  let normalUser;
  let normalToken;

  // eslint-disable-next-line no-unused-vars
  let discs = [];
  const testBrand = `Brand-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })}`;
  const testModelA = `ModelA-${chance.string({ length: 5 })}`;
  const testModelB = `ModelB-${chance.string({ length: 5 })}`;
  const testModelC = `ModelC-${chance.string({ length: 5 })}`;

  beforeEach(async () => {
    // Clean up
    await query('DELETE FROM users WHERE email LIKE $1', ['%test-disc-pending%']);
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);

    // Register admin user
    const adminPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const adminData = {
      username: `testadmin_${chance.string({ length: 5 })}`,
      email: `test-disc-pending-admin-${chance.guid()}@example.com`,
      password: adminPassword,
    };
    await request(app).post('/api/auth/register').send(adminData).expect(201);
    // Make admin in DB
    adminUser = await queryOne('UPDATE users SET is_admin = $1 WHERE username = $2 RETURNING *', [true, adminData.username]);
    // Login admin
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      username: adminData.username,
      password: adminData.password,
    }).expect(200);
    adminToken = adminLoginRes.body.tokens.accessToken;

    // Register normal user
    const userPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const userData = {
      username: `testuser_${chance.string({ length: 5 })}`,
      email: `test-disc-pending-user-${chance.guid()}@example.com`,
      password: userPassword,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    normalUser = await queryOne('SELECT * FROM users WHERE username = $1', [userData.username]);
    // Login normal user
    const userLoginRes = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    normalToken = userLoginRes.body.tokens.accessToken;

    // Seed discs
    const disc1Data = {
      brand: testBrand,
      model: testModelA,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      approved: true,
      added_by_id: adminUser.id,
    };
    const disc2Data = {
      brand: testBrand,
      model: testModelB,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      approved: true,
      added_by_id: normalUser.id,
    };
    const disc3Data = {
      brand: testBrand,
      model: testModelC,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      approved: false,
      added_by_id: normalUser.id,
    };

    const disc1Params = [
      disc1Data.brand, disc1Data.model, disc1Data.speed, disc1Data.glide,
      disc1Data.turn, disc1Data.fade, disc1Data.approved, disc1Data.added_by_id,
    ];
    const disc2Params = [
      disc2Data.brand, disc2Data.model, disc2Data.speed, disc2Data.glide,
      disc2Data.turn, disc2Data.fade, disc2Data.approved, disc2Data.added_by_id,
    ];
    const disc3Params = [
      disc3Data.brand, disc3Data.model, disc3Data.speed, disc3Data.glide,
      disc3Data.turn, disc3Data.fade, disc3Data.approved, disc3Data.added_by_id,
    ];

    discs = await Promise.all([
      queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        disc1Params,
      ),
      queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        disc2Params,
      ),
      queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        disc3Params,
      ),
    ]);
  });

  afterEach(async () => {
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);
    await query('DELETE FROM users WHERE email LIKE $1', ['%test-disc-pending%']);
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .get('/api/discs/pending');
    expect(res.status).toBe(401);
  });

  test('should forbid access for non-admin users', async () => {
    const res = await request(app)
      .get('/api/discs/pending')
      .set('Authorization', `Bearer ${normalToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  test('should allow admin to view only pending discs', async () => {
    const res = await request(app)
      .get('/api/discs/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((d) => d.approved === false)).toBe(true);
    expect(res.body.some((d) => d.model === testModelC)).toBe(true);
    // Should not include approved discs
    expect(res.body.some((d) => d.model === testModelA)).toBe(false);
    expect(res.body.some((d) => d.model === testModelB)).toBe(false);
  });
});
