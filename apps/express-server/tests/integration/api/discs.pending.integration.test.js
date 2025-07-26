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

describe('GET /api/discs/pending - Integration', () => {
  let adminUser;
  let adminToken;
  let normalUser;
  let normalToken;
  let createdUserIds = [];
  let createdDiscIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdDiscIds = [];

    // Create admin user directly in DB
    const testAdmin = await createTestUser({ prefix: 'discspendingadmin' });
    adminUser = testAdmin.user;
    adminToken = testAdmin.token;
    createdUserIds.push(adminUser.id);

    // Make user admin
    await query('UPDATE users SET is_admin = true WHERE id = $1', [adminUser.id]);

    // Create normal user directly in DB
    const testNormal = await createTestUser({ prefix: 'discspendingnormal' });
    normalUser = testNormal.user;
    normalToken = testNormal.token;
    createdUserIds.push(normalUser.id);

    // Create test discs directly in DB
    // Approved disc by admin
    const disc1 = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        chance.company(),
        chance.word(),
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        true,
        adminUser.id,
      ],
    );
    createdDiscIds.push(disc1.rows[0].id);

    // Approved disc by normal user
    const disc2 = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        chance.company(),
        chance.word(),
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        true,
        normalUser.id,
      ],
    );
    createdDiscIds.push(disc2.rows[0].id);

    // Pending disc by normal user
    const disc3 = await query(
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
    createdDiscIds.push(disc3.rows[0].id);
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
      .get('/api/discs/pending')
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - admin authorization
  test('should require admin privileges', async () => {
    const response = await request(app)
      .get('/api/discs/pending')
      .set('Authorization', `Bearer ${normalToken}`)
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });

  // GOOD: Integration concern - pending disc filtering from database
  test('should return only pending discs for admin', async () => {
    const response = await request(app)
      .get('/api/discs/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    // Integration: Should only include unapproved discs
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body.every((d) => d.approved === false)).toBe(true);

    // Should include submitter info
    response.body.forEach((disc) => {
      expect(disc).toHaveProperty('added_by_id');
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Admin permission logic details (unit test concern)
  // - Response formatting (unit test concern)
  // These are all tested at the service unit test level
});
