import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('POST /api/courses - Integration', () => {
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
      username: `tcsub${testId}`, // tcsub = "test course submit"
      email: `tcsub${testId}@ex.co`,
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
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
    };

    const res = await request(app)
      .post('/api/courses')
      .send(courseData)
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should create course with valid US data', async () => {
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);

    // Should return the created course data
    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: courseData.name,
      city: courseData.city,
      state_province: courseData.stateProvince,
      country: courseData.country,
      hole_count: courseData.holeCount,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: user.id,
    });

    // Track for cleanup
    createdCourseIds.push(res.body.id);
  });

  test('should create course with valid international data', async () => {
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.city(), // Random region for international
      country: chance.string({ length: 2, alpha: true }).toUpperCase(),
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: courseData.name,
      city: courseData.city,
      state_province: courseData.stateProvince.toUpperCase(), // Service converts to uppercase
      country: courseData.country,
      hole_count: courseData.holeCount,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: user.id,
    });

    createdCourseIds.push(res.body.id);
  });

  test('should include optional postal code when provided', async () => {
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
      postalCode: chance.zip(),
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);

    expect(res.body.postal_code).toBe(courseData.postalCode);
    createdCourseIds.push(res.body.id);
  });

  test('should return validation error for missing required fields', async () => {
    const incompleteData = {
      name: chance.string(),
      // Missing city, stateProvince, country
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(incompleteData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('required'),
    });
  });

  test('should return validation error for invalid US state', async () => {
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: 'ZZ', // Invalid US state
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('State must be a valid 2-character US state abbreviation'),
    });
  });

  test('should return validation error for invalid country code', async () => {
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: chance.string({ length: 3, alpha: true }), // Invalid 3-character country
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Country must be a valid 2-character ISO code'),
    });
  });

  test('should return validation error for missing hole count', async () => {
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
      // Missing holeCount
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('Hole count is required'),
    });
  });

  test('should create course with generated ID based on location', async () => {
    const courseName = chance.string();
    const courseCity = chance.city();
    const courseState = chance.state({ abbreviated: true });
    const courseData = {
      name: courseName,
      city: courseCity,
      stateProvince: courseState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData);

    // Log the response to debug the 500 error
    if (res.status !== 201) {
      console.log('Response status:', res.status);
      console.log('Response body:', res.body);
    }

    expect(res.status).toBe(201);

    // ID should be generated from name-city-state-country
    const expectedId = `${courseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${courseCity.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${courseState.toLowerCase()}-us`;
    expect(res.body.id).toBe(expectedId);
    createdCourseIds.push(res.body.id);
  });

  test('should set course as unapproved and user-submitted', async () => {
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData);

    // Log the response to debug the 500 error
    if (res.status !== 201) {
      console.log('Response status:', res.status);
      console.log('Response body:', res.body);
    }

    expect(res.status).toBe(201);
    expect(res.body.approved).toBe(false);
    expect(res.body.is_user_submitted).toBe(true);
    expect(res.body.submitted_by_id).toBe(user.id);
    createdCourseIds.push(res.body.id);
  });
});
