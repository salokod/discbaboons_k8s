import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('GET /api/courses/:id - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Generate unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];
    createdCourseIds = [];

    // Register test user
    const userData = {
      username: `tcg${testId}`, // tcg = "test course get"
      email: `tcg${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    const login = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = login.body.tokens.accessToken;
    user = login.body.user;
    createdUserIds.push(user.id);

    // Create test course for integration tests
    const testCourse = {
      id: `test-course-${testId}`,
      name: 'Test Park Disc Golf Course',
      city: 'Test City',
      state_province: 'CA',
      country: 'US',
      postal_code: '12345',
      hole_count: 18,
      rating: 4.5,
      latitude: 38.5816,
      longitude: -121.4944,
      is_user_submitted: false,
      approved: true,
    };

    await query(
      `INSERT INTO courses (id, name, city, state_province, country, postal_code, hole_count, rating, latitude, longitude, is_user_submitted, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        testCourse.id,
        testCourse.name,
        testCourse.city,
        testCourse.state_province,
        testCourse.country,
        testCourse.postal_code,
        testCourse.hole_count,
        testCourse.rating,
        testCourse.latitude,
        testCourse.longitude,
        testCourse.is_user_submitted,
        testCourse.approved,
      ],
    );
    createdCourseIds.push(testCourse.id);
  });

  afterEach(async () => {
    // Clean up courses
    await Promise.all(
      createdCourseIds.map((courseId) => query('DELETE FROM courses WHERE id = $1', [courseId])),
    );

    // Clean up users
    await Promise.all(
      createdUserIds.map((userId) => query('DELETE FROM users WHERE id = $1', [userId])),
    );
  });

  test('should return course details for existing course', async () => {
    const courseId = `test-course-${testId}`;

    const response = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: courseId,
      name: 'Test Park Disc Golf Course',
      city: 'Test City',
      state_province: 'CA',
      country: 'US',
      postal_code: '12345',
      hole_count: 18,
      rating: '4.5',
      latitude: '38.58160000',
      longitude: '-121.49440000',
      is_user_submitted: false,
      approved: true,
      submitted_by_id: null,
      admin_notes: null,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  test('should return null for non-existent course', async () => {
    const nonExistentId = `non-existent-${testId}`;

    const response = await request(app)
      .get(`/api/courses/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toBe(null);
  });

  test('should require authentication', async () => {
    const courseId = `test-course-${testId}`;

    await request(app)
      .get(`/api/courses/${courseId}`)
      .expect(401);
  });
});
