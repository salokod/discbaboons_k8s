import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('Admin Course Management - Integration', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let regularToken;
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

    // Make user admin
    await query('UPDATE users SET is_admin = true WHERE username = $1', [adminData.username]);

    const adminLogin = await request(app).post('/api/auth/login').send({
      username: adminData.username,
      password: adminData.password,
    }).expect(200);
    adminToken = adminLogin.body.tokens.accessToken;
    adminUser = adminLogin.body.user;
    createdUserIds.push(adminUser.id);

    // Register regular user
    const userData = {
      username: `user${testId}`,
      email: `user${testId}@ex.co`,
      password: `User1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    const userLogin = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    regularToken = userLogin.body.tokens.accessToken;
    regularUser = userLogin.body.user;
    createdUserIds.push(regularUser.id);

    // Create pending course for testing
    const pendingCourse = {
      id: `pending-course-${testId}`,
      name: 'Pending Test Course',
      city: 'Test Admin City',
      state_province: 'CA',
      country: 'US',
      hole_count: 18,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: regularUser.id,
    };

    await queryOne(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved, submitted_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        pendingCourse.id,
        pendingCourse.name,
        pendingCourse.city,
        pendingCourse.state_province,
        pendingCourse.country,
        pendingCourse.hole_count,
        pendingCourse.is_user_submitted,
        pendingCourse.approved,
        pendingCourse.submitted_by_id,
      ],
    );
    createdCourseIds.push(pendingCourse.id);
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

  describe('GET /api/courses/pending', () => {
    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/courses/pending')
        .expect(401);

      expect(res.body).toMatchObject({
        error: 'Access token required',
      });
    });

    test('should require admin access', async () => {
      const res = await request(app)
        .get('/api/courses/pending')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(res.body).toMatchObject({
        error: 'Admin access required',
      });
    });

    test('should return pending courses for admin', async () => {
      const res = await request(app)
        .get('/api/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        courses: expect.any(Array),
        total: expect.any(Number),
        limit: expect.any(Number),
        offset: expect.any(Number),
        hasMore: expect.any(Boolean),
      });

      expect(res.body.courses.length).toBeGreaterThan(0);

      // Should find our test course
      const testCourse = res.body.courses.find((course) => course.id === `pending-course-${testId}`);
      expect(testCourse).toBeDefined();
      expect(testCourse.approved).toBe(false);
      expect(testCourse.is_user_submitted).toBe(true);
    });
  });

  describe('PUT /api/courses/:id/approve', () => {
    test('should require authentication', async () => {
      const res = await request(app)
        .put(`/api/courses/pending-course-${testId}/approve`)
        .send({ approved: true })
        .expect(401);

      expect(res.body).toMatchObject({
        error: 'Access token required',
      });
    });

    test('should require admin access', async () => {
      const res = await request(app)
        .put(`/api/courses/pending-course-${testId}/approve`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ approved: true })
        .expect(403);

      expect(res.body).toMatchObject({
        error: 'Admin access required',
      });
    });

    test('should approve a course', async () => {
      const adminNotes = 'Course approved after review';

      const res = await request(app)
        .put(`/api/courses/pending-course-${testId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true, adminNotes })
        .expect(200);

      expect(res.body).toMatchObject({
        id: `pending-course-${testId}`,
        approved: true,
        admin_notes: adminNotes,
        reviewed_by_id: adminUser.id,
        reviewed_at: expect.any(String),
      });

      // Verify the course is timestamped in database
      const courseInDb = await queryOne('SELECT reviewed_at, reviewed_by_id FROM courses WHERE id = $1', [`pending-course-${testId}`]);
      expect(courseInDb.reviewed_at).not.toBeNull();
      expect(courseInDb.reviewed_by_id).toBe(adminUser.id);
    });

    test('should reject a course', async () => {
      const adminNotes = 'Course rejected - duplicate location';

      const res = await request(app)
        .put(`/api/courses/pending-course-${testId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: false, adminNotes })
        .expect(200);

      expect(res.body).toMatchObject({
        id: `pending-course-${testId}`,
        approved: false,
        admin_notes: adminNotes,
        reviewed_by_id: adminUser.id,
        reviewed_at: expect.any(String),
      });

      // Verify the course is timestamped in database
      const courseInDb = await queryOne('SELECT reviewed_at, reviewed_by_id FROM courses WHERE id = $1', [`pending-course-${testId}`]);
      expect(courseInDb.reviewed_at).not.toBeNull();
      expect(courseInDb.reviewed_by_id).toBe(adminUser.id);
    });

    test('should return 404 for non-existent course', async () => {
      const res = await request(app)
        .put('/api/courses/non-existent-course/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true })
        .expect(404);

      expect(res.body).toMatchObject({
        error: 'Course not found',
      });
    });

    test('should validate approved parameter', async () => {
      const res = await request(app)
        .put(`/api/courses/pending-course-${testId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: 'invalid' })
        .expect(400);

      expect(res.body).toMatchObject({
        error: 'Approved status must be true or false',
      });
    });

    test('should remove reviewed courses from pending list (approved)', async () => {
      // First, verify the course appears in pending list
      let pendingRes = await request(app)
        .get('/api/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      let testCourse = pendingRes.body.courses.find((course) => course.id === `pending-course-${testId}`);
      expect(testCourse).toBeDefined();

      // Approve the course
      await request(app)
        .put(`/api/courses/pending-course-${testId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true, adminNotes: 'Approved' })
        .expect(200);

      // Verify the course no longer appears in pending list
      pendingRes = await request(app)
        .get('/api/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      testCourse = pendingRes.body.courses.find((course) => course.id === `pending-course-${testId}`);
      expect(testCourse).toBeUndefined();
    });

    test('should remove reviewed courses from pending list (rejected)', async () => {
      // Create a second pending course for this test
      const secondCourseId = `pending-course-2-${testId}`;
      await queryOne(
        'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved, submitted_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          secondCourseId,
          'Second Pending Course',
          'Test City 2',
          'CA',
          'US',
          18,
          true,
          false,
          regularUser.id,
        ],
      );
      createdCourseIds.push(secondCourseId);

      // First, verify the course appears in pending list
      let pendingRes = await request(app)
        .get('/api/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      let testCourse = pendingRes.body.courses.find((course) => course.id === secondCourseId);
      expect(testCourse).toBeDefined();

      // Reject the course
      await request(app)
        .put(`/api/courses/${secondCourseId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: false, adminNotes: 'Rejected' })
        .expect(200);

      // Verify the course no longer appears in pending list
      pendingRes = await request(app)
        .get('/api/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      testCourse = pendingRes.body.courses.find((course) => course.id === secondCourseId);
      expect(testCourse).toBeUndefined();
    });
  });
});
