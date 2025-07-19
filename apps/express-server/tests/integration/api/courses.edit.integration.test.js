import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('Course Editing - Integration', () => {
  let adminUser;
  let ownerUser;
  let friendUser;
  let otherUser;
  let adminToken;
  let ownerToken;
  let friendToken;
  let otherToken;
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

    // Register admin user
    const adminData = {
      username: `admin${testId}`,
      email: `admin${testId}@ex.co`,
      password: `Admin1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(adminData).expect(201);
    await query('UPDATE users SET is_admin = true WHERE username = $1', [adminData.username]);
    const adminLogin = await request(app).post('/api/auth/login').send({
      username: adminData.username,
      password: adminData.password,
    }).expect(200);
    adminToken = adminLogin.body.tokens.accessToken;
    adminUser = adminLogin.body.user;
    createdUserIds.push(adminUser.id);

    // Register course owner
    const ownerData = {
      username: `owner${testId}`,
      email: `owner${testId}@ex.co`,
      password: `Owner1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(ownerData).expect(201);
    const ownerLogin = await request(app).post('/api/auth/login').send({
      username: ownerData.username,
      password: ownerData.password,
    }).expect(200);
    ownerToken = ownerLogin.body.tokens.accessToken;
    ownerUser = ownerLogin.body.user;
    createdUserIds.push(ownerUser.id);

    // Register friend user
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
    friendToken = friendLogin.body.tokens.accessToken;
    friendUser = friendLogin.body.user;
    createdUserIds.push(friendUser.id);

    // Register other user (no relationship)
    const otherData = {
      username: `other${testId}`,
      email: `other${testId}@ex.co`,
      password: `Other1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(otherData).expect(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherData.username,
      password: otherData.password,
    }).expect(200);
    otherToken = otherLogin.body.tokens.accessToken;
    otherUser = otherLogin.body.user;
    createdUserIds.push(otherUser.id);

    // Create friendship between owner and friend
    await query(
      `INSERT INTO friendship_requests (requester_id, recipient_id, status)
       VALUES ($1, $2, 'accepted')`,
      [ownerUser.id, friendUser.id],
    );

    // Create test course owned by owner
    const testCourse = {
      id: `edit-test-course-${testId}`,
      name: 'Original Course Name',
      city: 'Original City',
      state_province: 'CA',
      country: 'US',
      hole_count: 18,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: ownerUser.id,
    };

    await queryOne(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved, submitted_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        testCourse.id,
        testCourse.name,
        testCourse.city,
        testCourse.state_province,
        testCourse.country,
        testCourse.hole_count,
        testCourse.is_user_submitted,
        testCourse.approved,
        testCourse.submitted_by_id,
      ],
    );
    createdCourseIds.push(testCourse.id);
  });

  afterEach(async () => {
    // Clean up test courses first
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }

    // Clean up friendships
    if (createdUserIds.length > 0) {
      await query('DELETE FROM friendship_requests WHERE requester_id = ANY($1) OR recipient_id = ANY($1)', [createdUserIds]);
    }

    // Clean up test users
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
  });

  describe('PUT /api/courses/:id', () => {
    test('should require authentication', async () => {
      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(res.body).toMatchObject({
        error: 'Access token required',
      });
    });

    test('should allow admin to edit any course', async () => {
      const updateData = {
        name: 'Admin Updated Course',
        city: 'Admin Updated City',
        holeCount: 27,
      };

      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toMatchObject({
        id: `edit-test-course-${testId}`,
        name: updateData.name,
        city: updateData.city,
        hole_count: updateData.holeCount,
      });
    });

    test('should allow owner to edit their own course', async () => {
      const updateData = {
        name: 'Owner Updated Course',
        stateProvince: 'TX',
      };

      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toMatchObject({
        id: `edit-test-course-${testId}`,
        name: updateData.name,
        state_province: updateData.stateProvince,
      });
    });

    test('should allow friend to edit owner course', async () => {
      const updateData = {
        name: 'Friend Updated Course',
        city: 'Friend Updated City',
      };

      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .set('Authorization', `Bearer ${friendToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toMatchObject({
        id: `edit-test-course-${testId}`,
        name: updateData.name,
        city: updateData.city,
      });
    });

    test('should reject edit from non-friend user', async () => {
      const updateData = {
        name: 'Unauthorized Update',
      };

      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(400);

      expect(res.body).toMatchObject({
        error: 'You do not have permission to edit this course',
      });
    });

    test('should return 404 for non-existent course', async () => {
      const res = await request(app)
        .put('/api/courses/non-existent-course')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(res.body).toMatchObject({
        error: 'Course not found',
      });
    });

    test('should validate that at least one field is provided', async () => {
      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({}) // Empty update
        .expect(400);

      expect(res.body).toMatchObject({
        error: 'No valid fields to update',
      });
    });

    test('should handle coordinate updates', async () => {
      const updateData = {
        latitude: chance.latitude({ fixed: 8 }), // Generate random lat with 8 decimals
        longitude: chance.longitude({ fixed: 8 }), // Generate random lng with 8 decimals
        name: 'Updated with Coordinates',
      };

      // Calculate expected truncated values (5 decimal places)
      const expectedLat = Math.round(updateData.latitude * 100000) / 100000;
      const expectedLng = Math.round(updateData.longitude * 100000) / 100000;

      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toMatchObject({
        id: `edit-test-course-${testId}`,
        name: updateData.name,
        latitude: expectedLat, // Truncated to 5 decimal places
        longitude: expectedLng, // Truncated to 5 decimal places
      });
    });

    test('should support both camelCase and snake_case field names', async () => {
      const updateData = {
        stateProvince: 'NY', // camelCase
        postal_code: '10001', // snake_case
        holeCount: 9, // camelCase
      };

      const res = await request(app)
        .put(`/api/courses/edit-test-course-${testId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toMatchObject({
        id: `edit-test-course-${testId}`,
        state_province: updateData.stateProvince,
        postal_code: updateData.postal_code,
        hole_count: updateData.holeCount,
      });
    });
  });
});
