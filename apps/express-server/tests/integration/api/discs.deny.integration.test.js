import 'dotenv/config';
import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';
import {
  createTestUser,
  cleanupUsers,
} from '../test-helpers.js';

const chance = new Chance();

describe('PATCH /api/discs/:id/deny - Integration Tests', () => {
  let adminUser;
  let adminToken;
  let normalUser;
  let normalToken;
  let pendingDiscId;
  let createdUserIds = [];
  let createdDiscIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdDiscIds = [];

    // Create admin user directly in DB
    const testAdmin = await createTestUser({ prefix: 'discsdenyladmin' });
    adminUser = testAdmin.user;
    adminToken = testAdmin.token;
    createdUserIds.push(adminUser.id);

    // Make user admin
    await query('UPDATE users SET is_admin = true WHERE id = $1', [adminUser.id]);

    // Create normal user directly in DB
    const testNormal = await createTestUser({ prefix: 'discsdanynormal' });
    normalUser = testNormal.user;
    normalToken = testNormal.token;
    createdUserIds.push(normalUser.id);

    // Create a pending disc directly in DB
    const pendingDisc = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        chance.company(),
        chance.word(),
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        false,
        normalUser.id,
      ],
    );
    pendingDiscId = pendingDisc.rows[0].id;
    createdDiscIds.push(pendingDiscId);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdDiscIds.length > 0) {
      await query('DELETE FROM disc_master WHERE id = ANY($1)', [createdDiscIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication (401)', async () => {
    await request(app)
      .patch(`/api/discs/${pendingDiscId}/deny`)
      .send({
        reason: 'Test denial reason',
      })
      .expect(401, {
        success: false,
        message: 'Access token required',
      });
  });

  // GOOD: Integration concern - admin authorization
  test('should require admin privileges (403)', async () => {
    const response = await request(app)
      .patch(`/api/discs/${pendingDiscId}/deny`)
      .set('Authorization', `Bearer ${normalToken}`)
      .send({
        reason: 'Test denial reason',
      })
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });

  // GOOD: Integration concern - disc denial and database persistence
  test('should deny disc and persist to database (200)', async () => {
    const denialReason = 'Inappropriate content detected';

    const response = await request(app)
      .patch(`/api/discs/${pendingDiscId}/deny`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: denialReason,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.disc).toMatchObject({
      id: pendingDiscId,
      approved: false,
      denied: true,
      denied_reason: denialReason,
      denied_by_id: adminUser.id,
    });

    // Integration: Verify persistence to database
    const updatedDisc = await query('SELECT * FROM disc_master WHERE id = $1', [pendingDiscId]);
    expect(updatedDisc.rows).toHaveLength(1);
    expect(updatedDisc.rows[0].denied).toBe(true);
    expect(updatedDisc.rows[0].denied_reason).toBe(denialReason);
    expect(updatedDisc.rows[0].denied_by_id).toBe(adminUser.id);
  });

  // GOOD: Integration concern - non-existent disc handling
  test('should return 404 for non-existent disc', async () => {
    const nonExistentId = chance.guid();

    const response = await request(app)
      .patch(`/api/discs/${nonExistentId}/deny`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Test denial reason',
      })
      .expect(404);

    expect(response.body).toMatchObject({
      message: expect.stringMatching(/not found/i),
    });
  });

  // GOOD: Integration concern - request validation
  test('should require denial reason in request body (400)', async () => {
    const response = await request(app)
      .patch(`/api/discs/${pendingDiscId}/deny`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({}) // Missing reason
      .expect(400);

    expect(response.body).toMatchObject({
      message: expect.stringMatching(/reason/i),
    });
  });

  // GOOD: Integration concern - denied_by_id tracking
  test('should properly set denied_by_id to admin user', async () => {
    const denialReason = 'Quality control failure';

    await request(app)
      .patch(`/api/discs/${pendingDiscId}/deny`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: denialReason,
      })
      .expect(200);

    // Verify denied_by_id is correctly set in database
    const dbResult = await query(`
      SELECT denied_by_id
      FROM disc_master
      WHERE id = $1
    `, [pendingDiscId]);

    const updatedDisc = dbResult.rows[0];
    expect(updatedDisc.denied_by_id).toBe(adminUser.id);
  });
});
