import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET /api/courses - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];

  beforeEach(async () => {
    // Generate unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];

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
  });

  afterEach(async () => {
    // Clean up test users
    if (createdUserIds.length > 0) {
      await prisma.users.deleteMany({
        where: {
          id: { in: createdUserIds },
        },
      });
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

  test('should return courses from imported CSV data with pagination', async () => {
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

    // Check structure of first course
    const firstCourse = res.body.courses[0];
    expect(firstCourse).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      city: expect.any(String),
      state: expect.any(String),
      hole_count: expect.any(Number),
      approved: true,
      is_user_submitted: false,
    });

    // Should be sorted by state, city, name
    const sortedByState = res.body.courses.every((course, index) => {
      if (index === 0) return true;
      return course.state >= res.body.courses[index - 1].state;
    });
    expect(sortedByState).toBe(true);
  });

  test('should filter courses by state', async () => {
    // First get all courses to find a valid state
    const allCoursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const targetState = allCoursesRes.body.courses[0].state;

    const res = await request(app)
      .get(`/api/courses?state=${encodeURIComponent(targetState)}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should match the state filter
    res.body.courses.forEach((course) => {
      expect(course.state).toBe(targetState);
    });
  });

  test('should filter courses by city', async () => {
    // First get all courses to find a valid city
    const allCoursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const targetCity = allCoursesRes.body.courses[0].city;

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
    // Search for "park" which should match many courses
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
    // First get courses to find valid state and city combination
    const allCoursesRes = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const sampleCourse = allCoursesRes.body.courses[0];
    const targetState = sampleCourse.state;
    const targetCity = sampleCourse.city;

    const res = await request(app)
      .get(`/api/courses?state=${encodeURIComponent(targetState)}&city=${encodeURIComponent(targetCity)}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should match both filters
    res.body.courses.forEach((course) => {
      expect(course.state).toBe(targetState);
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
