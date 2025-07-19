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
  let testCourse;
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
    testCourse = {
      id: `test-course-${testId}`,
      name: 'Test Park Disc Golf Course',
      city: 'Test City',
      state_province: 'CA',
      country: 'US',
      postal_code: '12345',
      hole_count: 18,
      latitude: chance.latitude({ fixed: 8 }), // Random coordinates with high precision
      longitude: chance.longitude({ fixed: 8 }),
      is_user_submitted: false,
      approved: true,
    };

    await query(
      `INSERT INTO courses (id, name, city, state_province, country, postal_code, hole_count, latitude, longitude, is_user_submitted, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        testCourse.id,
        testCourse.name,
        testCourse.city,
        testCourse.state_province,
        testCourse.country,
        testCourse.postal_code,
        testCourse.hole_count,
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

    // Calculate expected truncated coordinates (5 decimal places)
    const expectedLat = Math.round(testCourse.latitude * 100000) / 100000;
    const expectedLng = Math.round(testCourse.longitude * 100000) / 100000;

    expect(response.body).toEqual({
      id: courseId,
      name: 'Test Park Disc Golf Course',
      city: 'Test City',
      state_province: 'CA',
      country: 'US',
      postal_code: '12345',
      hole_count: 18,
      latitude: expectedLat, // Truncated to 5 decimal places
      longitude: expectedLng, // Truncated to 5 decimal places
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

  test('should return user own unapproved course', async () => {
    // Create an unapproved course submitted by the user
    const unapprovedCourse = {
      id: `unapproved-course-${testId}`,
      name: 'My Unapproved Course',
      city: 'My City',
      state_province: 'TX',
      country: 'US',
      hole_count: 9,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: user.id,
    };

    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        unapprovedCourse.id,
        unapprovedCourse.name,
        unapprovedCourse.city,
        unapprovedCourse.state_province,
        unapprovedCourse.country,
        unapprovedCourse.hole_count,
        unapprovedCourse.is_user_submitted,
        unapprovedCourse.approved,
        unapprovedCourse.submitted_by_id,
      ],
    );
    createdCourseIds.push(unapprovedCourse.id);

    const response = await request(app)
      .get(`/api/courses/${unapprovedCourse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: unapprovedCourse.id,
      name: unapprovedCourse.name,
      approved: false,
      submitted_by_id: user.id,
    });
  });

  test('should return friend unapproved course when friendship exists', async () => {
    // Create a friend user
    const friendData = {
      username: `friend${testId}`,
      email: `friend${testId}@ex.co`,
      password: `Friend1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(friendData).expect(201);
    const friendLogin = await request(app).post('/api/auth/login').send({
      username: friendData.username,
      password: friendData.password,
    }).expect(200);
    const friend = friendLogin.body.user;
    createdUserIds.push(friend.id);

    // Create friendship between users
    await query(
      `INSERT INTO friendship_requests (requester_id, recipient_id, status)
       VALUES ($1, $2, 'accepted')`,
      [user.id, friend.id],
    );

    // Create an unapproved course submitted by the friend
    const friendCourse = {
      id: `friend-course-${testId}`,
      name: 'Friend Unapproved Course',
      city: 'Friend City',
      state_province: 'FL',
      country: 'US',
      hole_count: 12,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: friend.id,
    };

    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        friendCourse.id,
        friendCourse.name,
        friendCourse.city,
        friendCourse.state_province,
        friendCourse.country,
        friendCourse.hole_count,
        friendCourse.is_user_submitted,
        friendCourse.approved,
        friendCourse.submitted_by_id,
      ],
    );
    createdCourseIds.push(friendCourse.id);

    const response = await request(app)
      .get(`/api/courses/${friendCourse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: friendCourse.id,
      name: friendCourse.name,
      approved: false,
      submitted_by_id: friend.id,
    });
  });

  test('should not return other user unapproved course when no friendship', async () => {
    // Create another user (not a friend)
    const otherUserData = {
      username: `other${testId}`,
      email: `other${testId}@ex.co`,
      password: `Other1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherUser = otherLogin.body.user;
    createdUserIds.push(otherUser.id);

    // Create an unapproved course submitted by the other user
    const otherCourse = {
      id: `other-course-${testId}`,
      name: 'Other User Course',
      city: 'Other City',
      state_province: 'WA',
      country: 'US',
      hole_count: 15,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: otherUser.id,
    };

    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        otherCourse.id,
        otherCourse.name,
        otherCourse.city,
        otherCourse.state_province,
        otherCourse.country,
        otherCourse.hole_count,
        otherCourse.is_user_submitted,
        otherCourse.approved,
        otherCourse.submitted_by_id,
      ],
    );
    createdCourseIds.push(otherCourse.id);

    // Should not be able to access other user's unapproved course
    const response = await request(app)
      .get(`/api/courses/${otherCourse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toBe(null);
  });
});
