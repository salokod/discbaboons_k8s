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

describe('GET /api/discs/master - Integration', () => {
  let user;
  let token;
  let createdUserIds = [];
  let createdDiscIds = [];
  let testBrand;
  let testModelA;
  let testModelB;
  let testModelC;

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdDiscIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'discslist' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Generate unique test data with longer, more unique models
    testBrand = chance.company();
    testModelA = `TestModel${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })}`;
    testModelB = `TestModel${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })}`;
    testModelC = `TestModel${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })}`;

    // Create discs directly in DB
    const discA = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        testBrand,
        testModelA,
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        true,
        user.id,
      ],
    );
    createdDiscIds.push(discA.rows[0].id);

    const discB = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        testBrand,
        testModelB,
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        true,
        user.id,
      ],
    );
    createdDiscIds.push(discB.rows[0].id);

    const discC = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        testBrand,
        testModelC,
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        false, // Not approved
        user.id,
      ],
    );
    createdDiscIds.push(discC.rows[0].id);
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
      .get('/api/discs/master')
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - approved disc filtering from database
  test('should list only approved discs by default', async () => {
    // Test with our specific brand to avoid interference from existing data
    const response = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .query({ brand: testBrand }) // Filter by our test brand
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2); // Should only have approved discs (A & B, not C)

    // Integration: Verify approved filtering works
    const discModels = response.body.map((d) => d.model);
    expect(discModels).toContain(testModelA);
    expect(discModels).toContain(testModelB);
    expect(discModels).not.toContain(testModelC); // Unapproved

    // All returned discs should be approved
    expect(response.body.every((d) => d.approved === true)).toBe(true);

    // All should have our test brand
    expect(response.body.every((d) => d.brand === testBrand)).toBe(true);
  });

  // GOOD: Integration concern - brand filtering query
  test('should filter discs by brand from database', async () => {
    const response = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .query({ brand: testBrand })
      .expect(200);

    // Integration: Verify brand filtering
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((d) => d.brand === testBrand)).toBe(true);
  });

  // GOOD: Integration concern - model substring search
  test('should search discs by model substring', async () => {
    const searchSubstring = testModelA.slice(0, Math.min(4, testModelA.length));

    const response = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .query({ model: searchSubstring })
      .expect(200);

    // Integration: Verify substring search works
    expect(response.body.some((d) => d.model === testModelA)).toBe(true);
  });

  // GOOD: Integration concern - unapproved disc access
  test('should include unapproved discs when requested', async () => {
    const response = await request(app)
      .get('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .query({ approved: 'false' })
      .expect(200);

    // Integration: Verify unapproved discs are included
    const discModels = response.body.map((d) => d.model);
    expect(discModels).toContain(testModelC);
    expect(response.body.some((d) => d.approved === false)).toBe(true);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid query parameters (unit test concern)
  // - Sorting/pagination (unit test concern)
  // These are all tested at the service unit test level
});
