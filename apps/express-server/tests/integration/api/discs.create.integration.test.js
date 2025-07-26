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

describe('POST /api/discs/master - Integration', () => {
  let user;
  let token;
  let createdUserIds = [];
  let createdDiscIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdDiscIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'discscreate' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);
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
    const discData = {
      brand: chance.company(),
      model: chance.word(),
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };

    await request(app)
      .post('/api/discs/master')
      .send(discData)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - disc creation and database persistence
  test('should create disc with pending approval and persist to database', async () => {
    const discData = {
      brand: chance.company(),
      model: chance.word(),
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };

    const response = await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(201);

    expect(response.body).toMatchObject({
      brand: discData.brand,
      model: discData.model,
      speed: discData.speed,
      glide: discData.glide,
      turn: discData.turn,
      fade: discData.fade,
      approved: false, // New discs are unapproved by default
      added_by_id: user.id,
    });

    createdDiscIds.push(response.body.id);

    // Integration: Verify persistence to database
    const savedDisc = await query('SELECT * FROM disc_master WHERE id = $1', [response.body.id]);
    expect(savedDisc.rows).toHaveLength(1);
    expect(savedDisc.rows[0]).toMatchObject({
      brand: discData.brand,
      model: discData.model,
      approved: false,
      added_by_id: user.id,
    });
  });

  // GOOD: Integration concern - duplicate disc prevention (case-insensitive)
  test('should prevent duplicate disc creation in database', async () => {
    const brand = chance.company();
    const model = chance.word();

    // Create first disc directly in DB
    const firstDisc = await query(
      `INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        brand,
        model,
        chance.integer({ min: 1, max: 14 }),
        chance.integer({ min: 1, max: 7 }),
        chance.integer({ min: -5, max: 2 }),
        chance.integer({ min: 0, max: 5 }),
        true,
        user.id,
      ],
    );
    createdDiscIds.push(firstDisc.rows[0].id);

    // Try to create duplicate with different case
    const response = await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send({
        brand: brand.toUpperCase(),
        model: model.toLowerCase(),
        speed: chance.integer({ min: 1, max: 14 }),
        glide: chance.integer({ min: 1, max: 7 }),
        turn: chance.integer({ min: -5, max: 2 }),
        fade: chance.integer({ min: 0, max: 5 }),
      })
      .expect(400);

    expect(response.body).toMatchObject({
      message: expect.stringMatching(/already exists/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing required fields (unit test concern)
  // - Invalid field values (unit test concern)
  // - Field type validation (unit test concern)
  // These are all tested at the service unit test level
});
