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
const uniqueSuffix = `pending-${chance.string({ length: 12, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' })}`;

describe('GET /api/discs/pending - Integration', () => {
  let adminUser;
  let adminToken;
  let normalUser;
  let normalToken;

  // eslint-disable-next-line no-unused-vars
  let discs = [];

  // Generate unique identifiers for each test run
  const testBrand = `Brand-${uniqueSuffix}`;
  let testModelA;
  let testModelB;
  let testModelC;

  beforeEach(async () => {
    // Generate fresh unique identifiers for each test
    testModelA = `ModelA-${chance.string({ length: 5 })}`;
    testModelB = `ModelB-${chance.string({ length: 5 })}`;
    testModelC = `ModelC-${chance.string({ length: 5 })}`;

    // Clean up only users/discs created by this test
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);
    await query('DELETE FROM users WHERE email LIKE $1', [`%${uniqueSuffix}%`]);

    // Register admin user
    const adminPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const adminData = {
      username: `testadmin_${chance.string({ length: 5 })}`,
      email: `test-disc-pending-admin-${uniqueSuffix}-${chance.guid()}@example.com`,
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
      email: `test-disc-pending-user-${uniqueSuffix}-${chance.guid()}@example.com`,
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
    // Verify users exist before creating discs
    if (!adminUser || !adminUser.id) {
      throw new Error('Admin user not created properly');
    }
    if (!normalUser || !normalUser.id) {
      throw new Error('Normal user not created properly');
    }

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

    // Create disc data in parallel (retry approach for race conditions)
    let retryCount = 0;
    const maxRetries = 3;

    // eslint-disable-next-line no-await-in-loop
    while (retryCount < maxRetries) {
      try {
        // eslint-disable-next-line no-await-in-loop
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
        break; // Success, exit retry loop
      } catch (error) {
        if (error.message.includes('disc_master_added_by_id_fkey') && retryCount < maxRetries - 1) {
          retryCount += 1;
          console.log(`Retrying disc creation (attempt ${retryCount}/${maxRetries}) due to foreign key error`);

          // Re-verify users still exist and recreate if needed
          // eslint-disable-next-line no-await-in-loop
          const adminExists = await queryOne('SELECT id FROM users WHERE id = $1', [adminUser.id]);
          // eslint-disable-next-line no-await-in-loop
          const normalExists = await queryOne('SELECT id FROM users WHERE id = $1', [normalUser.id]);

          if (!adminExists || !normalExists) {
            throw new Error('Users were deleted by another test - test isolation failed');
          }

          // Short delay before retry
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
        } else {
          throw error;
        }
      }
    }
  });

  afterEach(async () => {
    await query('DELETE FROM disc_master WHERE brand = $1', [testBrand]);
    await query('DELETE FROM users WHERE email LIKE $1', [`%${uniqueSuffix}%`]);
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
