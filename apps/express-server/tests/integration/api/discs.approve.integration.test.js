import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
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

describe('PATCH /api/discs/:id/approve - Integration', () => {
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
    const testAdmin = await createTestUser({ prefix: 'discsapproveadmin' });
    adminUser = testAdmin.user;
    adminToken = testAdmin.token;
    createdUserIds.push(adminUser.id);

    // Make user admin
    await query('UPDATE users SET is_admin = true WHERE id = $1', [adminUser.id]);

    // Create normal user directly in DB
    const testNormal = await createTestUser({ prefix: 'discsapprovenormal' });
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
  test('should require authentication', async () => {
    await request(app)
      .patch(`/api/discs/${pendingDiscId}/approve`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - admin authorization
  test('should require admin privileges', async () => {
    const response = await request(app)
      .patch(`/api/discs/${pendingDiscId}/approve`)
      .set('Authorization', `Bearer ${normalToken}`)
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });

  // GOOD: Integration concern - disc approval and database persistence
  test('should approve disc and persist to database', async () => {
    const response = await request(app)
      .patch(`/api/discs/${pendingDiscId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.disc).toMatchObject({
      id: pendingDiscId,
      approved: true,
    });

    // Integration: Verify persistence to database
    const updatedDisc = await query('SELECT * FROM disc_master WHERE id = $1', [pendingDiscId]);
    expect(updatedDisc.rows).toHaveLength(1);
    expect(updatedDisc.rows[0].approved).toBe(true);
  });

  // GOOD: Integration concern - non-existent disc handling
  test('should return 404 for non-existent disc', async () => {
    const nonExistentId = chance.guid();

    const response = await request(app)
      .patch(`/api/discs/${nonExistentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body).toMatchObject({
      message: expect.stringMatching(/not found/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid disc ID format (unit test concern)
  // - Already approved disc handling (unit test concern)
  // These are all tested at the service unit test level
});
