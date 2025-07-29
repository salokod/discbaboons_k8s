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

describe('GET /api/courses - Integration', () => {
  let user;
  let token;
  let approvedCourseId1;
  let approvedCourseId2;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'coursessearch' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create approved courses directly in DB for search
    approvedCourseId1 = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        approvedCourseId1,
        'Golden Gate Park',
        'San Francisco',
        'CA',
        'US',
        chance.integer({ min: 9, max: 27 }),
        false,
        true,
      ],
    );
    createdCourseIds.push(approvedCourseId1);

    approvedCourseId2 = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        approvedCourseId2,
        'Central Park',
        'New York',
        'NY',
        'US',
        chance.integer({ min: 9, max: 27 }),
        false,
        true,
      ],
    );
    createdCourseIds.push(approvedCourseId2);
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
    await request(app)
      .get('/api/courses')
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - course search and pagination from database
  test('should return approved courses with pagination', async () => {
    const response = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      courses: expect.any(Array),
      total: expect.any(Number),
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: expect.any(Boolean),
    });

    // Integration: Should return approved courses
    expect(response.body.courses.length).toBeGreaterThan(0);

    // All should be approved
    expect(response.body.courses.every((c) => c.approved === true)).toBe(true);
  });

  // GOOD: Integration concern - search filtering from database
  test('should filter courses by state from database', async () => {
    const response = await request(app)
      .get('/api/courses?state=CA')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.courses).toBeDefined();
    // Integration: Should include our CA course
    const foundCourse = response.body.courses.find((c) => c.id === approvedCourseId1);
    expect(foundCourse).toBeDefined();
    expect(foundCourse.state_province).toBe('CA');
  });

  // GOOD: Integration concern - name search filtering from database
  test('should filter courses by name from database', async () => {
    const response = await request(app)
      .get('/api/courses?name=park')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.courses).toBeDefined();
    // Integration: Should find courses with "park" in name
    const parkCourses = response.body.courses.filter((c) => c.name.toLowerCase().includes('park'));
    expect(parkCourses.length).toBeGreaterThan(0);
  });

  // GOOD: Integration concern - pagination parameters affecting database queries
  test('should support pagination parameters', async () => {
    const response = await request(app)
      .get('/api/courses?limit=1&offset=0')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      courses: expect.any(Array),
      total: expect.any(Number),
      limit: 1,
      offset: 0,
      hasMore: expect.any(Boolean),
    });

    expect(response.body.courses.length).toBeLessThanOrEqual(1);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Query parameter validation (unit test concern)
  // - Search logic details (unit test concern)
  // - Sorting algorithms (unit test concern)
  // - Case-insensitive search logic (unit test concern)
  // - Special character handling (unit test concern)
  // - Maximum limit enforcement (unit test concern)
  // These are all tested at the service unit test level
});
