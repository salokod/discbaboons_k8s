import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('GET /api/courses - Integration', () => {
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
      username: `tcs${testId}`, // tcs = "test course search"
      email: `tcs${testId}@ex.co`,
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

    // Create test course data for integration tests
    const testCourses = [
      {
        id: `test-course-${testId}-1`,
        name: 'Test Park Disc Golf Course',
        city: 'Test City',
        state_province: 'CA',
        country: 'US',
        postal_code: '12345',
        hole_count: 18,
        rating: 4.5,
        latitude: 37.7749,
        longitude: -122.4194,
        is_user_submitted: false,
        approved: true,
      },
      {
        id: `test-course-${testId}-2`,
        name: 'Another Test Course',
        city: 'Test City',
        state_province: 'CA',
        country: 'US',
        postal_code: '12346',
        hole_count: 9,
        is_user_submitted: false,
        approved: true,
      },
      {
        id: `test-course-${testId}-3`,
        name: 'Heritage Park Course',
        city: 'Different City',
        state_province: 'TX',
        country: 'US',
        postal_code: '54321',
        hole_count: 18,
        is_user_submitted: false,
        approved: true,
      },
    ];

    // Create test courses using Promise.all to avoid ESLint loop issues
    const coursePromises = testCourses.map(async (course) => {
      const courseParams = [
        course.id, course.name, course.city, course.state_province, course.country, course.postal_code,
        course.hole_count, course.latitude, course.longitude, course.approved,
      ];
      await queryOne(
        'INSERT INTO courses (id, name, city, state_province, country, postal_code, hole_count, latitude, longitude, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        courseParams,
      );
      createdCourseIds.push(course.id);
    });
    await Promise.all(coursePromises);
  });

  afterEach(async () => {
    // Clean up test courses first
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }

    // Clean up test users
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .get('/api/courses')
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should return courses from test data with pagination', async () => {
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      courses: expect.any(Array),
      total: expect.any(Number),
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: expect.any(Boolean),
    });

    expect(res.body.courses.length).toBeGreaterThan(0);
    expect(res.body.limit).toBe(50); // Default limit
    expect(res.body.total).toBeGreaterThan(0); // Should have our test courses

    // Check structure of first course
    const firstCourse = res.body.courses[0];
    expect(firstCourse).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      city: expect.any(String),
      state_province: expect.any(String),
      country: expect.any(String),
      hole_count: expect.any(Number),
      approved: true,
      is_user_submitted: false,
    });

    // Should be sorted by country, state_province, city, name
    const sortedByLocation = res.body.courses.every((course, index) => {
      if (index === 0) return true;
      const prev = res.body.courses[index - 1];
      return course.country >= prev.country || 
             (course.country === prev.country && course.state_province >= prev.state_province);
    });
    expect(sortedByLocation).toBe(true);
  });

  test('should filter courses by state', async () => {
    // Use CA from our test data
    const targetState = 'CA';

    const res = await request(app)
      .get(`/api/courses?state=${encodeURIComponent(targetState)}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should match the state filter
    res.body.courses.forEach((course) => {
      expect(course.state_province).toBe(targetState);
    });
  });

  test('should filter courses by city', async () => {
    // Use Test City from our test data
    const targetCity = 'Test City';

    const res = await request(app)
      .get(`/api/courses?city=${encodeURIComponent(targetCity)}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should match the city filter
    res.body.courses.forEach((course) => {
      expect(course.city).toBe(targetCity);
    });
  });

  test('should filter courses by name (case-insensitive partial match)', async () => {
    // Search for "park" which should match our test course
    const res = await request(app)
      .get('/api/courses?name=park')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should contain "park" in the name (case-insensitive)
    res.body.courses.forEach((course) => {
      expect(course.name.toLowerCase()).toContain('park');
    });
  });

  test('should combine multiple filters', async () => {
    // Use known test data values
    const targetState = 'CA';
    const targetCity = 'Test City';

    const res = await request(app)
      .get(`/api/courses?state=${encodeURIComponent(targetState)}&city=${encodeURIComponent(targetCity)}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should match both filters
    res.body.courses.forEach((course) => {
      expect(course.state_province).toBe(targetState);
      expect(course.city).toBe(targetCity);
    });
  });

  test('should support custom pagination parameters', async () => {
    const res = await request(app)
      .get('/api/courses?limit=10&offset=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      courses: expect.any(Array),
      total: expect.any(Number),
      limit: 10,
      offset: 5,
      hasMore: expect.any(Boolean),
    });

    expect(res.body.courses.length).toBeLessThanOrEqual(10);
  });

  test('should enforce maximum limit of 500', async () => {
    const res = await request(app)
      .get('/api/courses?limit=1000')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.limit).toBe(500);
  });

  test('should return empty courses array for non-existent state', async () => {
    const res = await request(app)
      .get('/api/courses?state=NonExistentState')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBe(0);
    expect(res.body.total).toBe(0);
  });

  test('should only return approved courses', async () => {
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();

    // All courses should be approved
    res.body.courses.forEach((course) => {
      expect(course.approved).toBe(true);
    });
  });

  test('should handle special characters in query params', async () => {
    // Test with URL-encoded special characters
    const res = await request(app)
      .get('/api/courses?name=St.%20Mary%27s')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    // Should not crash and return valid response
  });
});
