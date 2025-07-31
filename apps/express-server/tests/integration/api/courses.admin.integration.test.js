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

describe('GET /api/courses/pending & PUT /api/courses/:id/approve - Integration', () => {
  let adminUser;
  let adminToken;
  let regularUser;
  let regularToken;
  let pendingCourseId;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];

    // Create admin user directly in DB
    const testAdmin = await createTestUser({ prefix: 'coursesadmin' });
    adminUser = testAdmin.user;
    adminToken = testAdmin.token;
    createdUserIds.push(adminUser.id);

    // Make user admin
    await query('UPDATE users SET is_admin = true WHERE id = $1', [adminUser.id]);

    // Create regular user directly in DB
    const testRegular = await createTestUser({ prefix: 'coursesregular' });
    regularUser = testRegular.user;
    regularToken = testRegular.token;
    createdUserIds.push(regularUser.id);

    // Create pending course directly in DB
    pendingCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        pendingCourseId,
        chance.company(),
        chance.city(),
        chance.state({ territories: true, full: false }), // 2-char abbreviation
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        regularUser.id,
      ],
    );
    createdCourseIds.push(pendingCourseId);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication for pending courses endpoint', async () => {
    await request(app)
      .get('/api/courses/pending')
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - admin authorization
  test('should require admin access for pending courses', async () => {
    const response = await request(app)
      .get('/api/courses/pending')
      .set('Authorization', `Bearer ${regularToken}`)
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });

  // GOOD: Integration concern - pending course filtering from database
  test('should return pending courses for admin with pagination', async () => {
    const response = await request(app)
      .get('/api/courses/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      courses: expect.any(Array),
      total: expect.any(Number),
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: expect.any(Boolean),
    });

    // Integration: Should include our pending course
    expect(response.body.courses.length).toBeGreaterThan(0);
    const testCourse = response.body.courses.find((course) => course.id === pendingCourseId);
    expect(testCourse).toBeDefined();
    expect(testCourse.approved).toBe(false);
    expect(testCourse.is_user_submitted).toBe(true);
  });

  // GOOD: Integration concern - middleware authentication for approval
  test('should require authentication for course approval', async () => {
    await request(app)
      .put(`/api/courses/${pendingCourseId}/approve`)
      .send({ approved: true })
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - admin authorization for approval
  test('should require admin access for course approval', async () => {
    const response = await request(app)
      .put(`/api/courses/${pendingCourseId}/approve`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({ approved: true })
      .expect(403);

    expect(response.body).toHaveProperty('error');
  });

  // GOOD: Integration concern - course approval and database persistence
  test('should approve course and persist to database', async () => {
    const adminNotes = chance.sentence();

    const response = await request(app)
      .put(`/api/courses/${pendingCourseId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true, adminNotes })
      .expect(200);

    expect(response.body).toMatchObject({
      id: pendingCourseId,
      approved: true,
      admin_notes: adminNotes,
      reviewed_by_id: adminUser.id,
      reviewed_at: expect.any(String),
    });

    // Integration: Verify persistence to database
    const courseInDb = await query(
      'SELECT approved, reviewed_at, reviewed_by_id, admin_notes FROM courses WHERE id = $1',
      [pendingCourseId],
    );
    expect(courseInDb.rows[0]).toMatchObject({
      approved: true,
      reviewed_by_id: adminUser.id,
      admin_notes: adminNotes,
    });
    expect(courseInDb.rows[0].reviewed_at).not.toBeNull();
  });

  // GOOD: Integration concern - course rejection and database persistence
  test('should reject course and persist to database', async () => {
    const adminNotes = chance.sentence();

    const response = await request(app)
      .put(`/api/courses/${pendingCourseId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: false, adminNotes })
      .expect(200);

    expect(response.body).toMatchObject({
      id: pendingCourseId,
      approved: false,
      admin_notes: adminNotes,
      reviewed_by_id: adminUser.id,
      reviewed_at: expect.any(String),
    });

    // Integration: Verify persistence to database
    const courseInDb = await query(
      'SELECT approved, reviewed_at, reviewed_by_id, admin_notes FROM courses WHERE id = $1',
      [pendingCourseId],
    );
    expect(courseInDb.rows[0]).toMatchObject({
      approved: false,
      reviewed_by_id: adminUser.id,
      admin_notes: adminNotes,
    });
    expect(courseInDb.rows[0].reviewed_at).not.toBeNull();
  });

  // GOOD: Integration concern - non-existent course handling
  test('should return 404 for non-existent course', async () => {
    const nonExistentId = chance.guid();

    const response = await request(app)
      .put(`/api/courses/${nonExistentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approved: true })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/not found/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid approved parameter format (unit test concern)
  // - Admin notes validation (unit test concern)
  // - Pending list filtering logic (unit test concern)
  // These are all tested at the service unit test level
});
