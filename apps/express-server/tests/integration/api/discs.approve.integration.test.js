import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();
// Unique suffix for this test file run
const uniqueSuffix = chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' });

describe('PATCH /api/discs/:id/approve - Integration', () => {
  // eslint-disable-next-line
  let adminUser;
  let adminToken;
  let normalUser;
  let normalToken;
  let pendingDisc;
  const testBrand = `Brand-${uniqueSuffix}`;
  const testModel = `Model-${chance.string({ length: 5 })}`;

  beforeEach(async () => {
    // Clean up only users/discs created by this test file
    await query('DELETE FROM users WHERE email LIKE $1', [`%${uniqueSuffix}%`]);
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);

    // Register admin user
    const adminPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const adminData = {
      username: `ta_${uniqueSuffix}`,
      email: `ta_${uniqueSuffix}@ex.co`,
      password: adminPassword,
    };
    await request(app).post('/api/auth/register').send(adminData).expect(201);
    // Make admin in DB
    adminUser = await queryOne(
      'UPDATE users SET is_admin = $1 WHERE username = $2 RETURNING *',
      [true, adminData.username],
    );
    // Login admin
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      username: adminData.username,
      password: adminData.password,
    }).expect(200);
    adminToken = adminLoginRes.body.tokens.accessToken;

    // Register normal user
    const userPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const userData = {
      username: `tu_${uniqueSuffix}`,
      email: `tu_${uniqueSuffix}@ex.co`,
      password: userPassword,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    // Use the login response to get the user object (fix)
    const userLoginRes = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    normalUser = userLoginRes.body.user;
    normalToken = userLoginRes.body.tokens.accessToken;
    if (!normalUser || !normalUser.id) {
      throw new Error('Test setup failed: normalUser not found');
    }

    // Seed a pending disc
    const discParams = [
      testBrand, testModel, chance.integer({ min: 1, max: 14 }),
      chance.integer({ min: 1, max: 7 }), chance.integer({ min: -5, max: 2 }),
      chance.integer({ min: 0, max: 5 }), false, normalUser.id,
    ];
    pendingDisc = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      discParams,
    );
  });

  afterEach(async () => {
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);
    await query('DELETE FROM users WHERE email LIKE $1', [`%${uniqueSuffix}%`]);
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .patch(`/api/discs/${pendingDisc.id}/approve`);
    expect(res.status).toBe(401);
  });

  test('should forbid access for non-admin users', async () => {
    const res = await request(app)
      .patch(`/api/discs/${pendingDisc.id}/approve`)
      .set('Authorization', `Bearer ${normalToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  test('should approve a pending disc for admin', async () => {
    const res = await request(app)
      .patch(`/api/discs/${pendingDisc.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: pendingDisc.id,
      brand: testBrand,
      model: testModel,
      approved: true,
    });

    // Confirm in DB
    const updated = await queryOne('SELECT * FROM disc_master WHERE id = $1', [pendingDisc.id]);
    expect(updated).not.toBeNull();
    expect(updated.approved).toBe(true);
  });

  test('should 404 if disc does not exist', async () => {
    const res = await request(app)
      .patch(`/api/discs/${chance.guid}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
