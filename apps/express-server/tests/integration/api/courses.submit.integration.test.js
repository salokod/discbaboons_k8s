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

describe('POST /api/courses - Integration', () => {
  let user;
  let token;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'coursessubmit' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    const courseData = {
      name: chance.company(),
      city: chance.city(),
      stateProvince: chance.state({ territories: true, full: false }),
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    await request(app)
      .post('/api/courses')
      .send(courseData)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - course creation and database persistence
  test('should create course and persist to database', async () => {
    const courseData = {
      name: chance.company(),
      city: chance.city(),
      stateProvince: chance.state({ territories: true, full: false }),
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      postalCode: chance.zip(),
      latitude: chance.latitude({ fixed: 5 }),
      longitude: chance.longitude({ fixed: 5 }),
    };

    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: courseData.name,
      city: courseData.city,
      state_province: courseData.stateProvince,
      country: courseData.country,
      hole_count: courseData.holeCount,
      postal_code: courseData.postalCode,
      latitude: courseData.latitude,
      longitude: courseData.longitude,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: user.id,
    });

    createdCourseIds.push(response.body.id);

    // Integration: Verify persistence to database
    const courseInDb = await query('SELECT * FROM courses WHERE id = $1', [response.body.id]);
    expect(courseInDb.rows[0]).toMatchObject({
      name: courseData.name,
      city: courseData.city,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: user.id,
    });
  });

  // GOOD: Integration concern - duplicate course prevention in database
  test('should prevent duplicate course creation in database', async () => {
    // Use static data to ensure identical IDs are generated
    const courseData = {
      name: 'Test Course For Duplicates',
      city: 'Test City',
      stateProvince: 'CA',
      country: 'US',
      holeCount: 18,
    };

    // Create first course
    const firstResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);

    createdCourseIds.push(firstResponse.body.id);

    // Try to create duplicate course
    const secondResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(400);

    expect(secondResponse.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/already exists/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing required fields validation (unit test concern)
  // - Invalid state/country code validation (unit test concern)
  // - Invalid latitude/longitude validation (unit test concern)
  // - Field format validation (unit test concern)
  // - ID generation logic (unit test concern)
  // These are all tested at the service unit test level
});
