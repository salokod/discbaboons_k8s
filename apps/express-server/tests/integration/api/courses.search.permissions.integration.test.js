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

describe('GET /api/courses - Permissions Integration', () => {
  let user;
  let token;
  let friendUser;
  let otherUser;
  let userCourseId;
  let friendCourseId;
  let otherCourseId;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'coursespermissions' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create friend user directly in DB
    const testFriend = await createTestUser({ prefix: 'coursespermfriend' });
    friendUser = testFriend.user;
    createdUserIds.push(friendUser.id);

    // Create other user directly in DB
    const testOther = await createTestUser({ prefix: 'coursespermother' });
    otherUser = testOther.user;
    createdUserIds.push(otherUser.id);

    // Create friendship between user and friend directly in DB
    await query(
      `INSERT INTO friendship_requests (requester_id, recipient_id, status)
       VALUES ($1, $2, 'accepted')`,
      [user.id, friendUser.id],
    );

    // Create unapproved course by user
    userCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userCourseId,
        chance.company(),
        'Unique Test City',
        'CA',
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        user.id,
      ],
    );
    createdCourseIds.push(userCourseId);

    // Create unapproved course by friend
    friendCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        friendCourseId,
        chance.company(),
        'Unique Test City',
        'TX',
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        friendUser.id,
      ],
    );
    createdCourseIds.push(friendCourseId);

    // Create unapproved course by other user (not friend)
    otherCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        otherCourseId,
        chance.company(),
        'Unique Test City',
        'FL',
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        otherUser.id,
      ],
    );
    createdCourseIds.push(otherCourseId);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }
    if (createdUserIds.length > 0) {
      await query('DELETE FROM friendship_requests WHERE requester_id = ANY($1) OR recipient_id = ANY($1)', [createdUserIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - unapproved course visibility via friendship JOIN
  test('should include user own and friend unapproved courses via friendship relationship', async () => {
    const response = await request(app)
      .get('/api/courses?city=Unique Test City')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.courses).toBeDefined();

    // Integration: Should include user's and friend's unapproved courses due to JOIN
    const courseIds = response.body.courses.map((course) => course.id);
    expect(courseIds).toContain(userCourseId);
    expect(courseIds).toContain(friendCourseId);

    // Should NOT include other user's unapproved course (no friendship)
    expect(courseIds).not.toContain(otherCourseId);
  });

  // GOOD: Integration concern - permission-based filtering affecting database queries
  test('should filter unapproved courses by approval status from database', async () => {
    const response = await request(app)
      .get('/api/courses?approved=false&city=Unique Test City')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.courses).toBeDefined();

    // Integration: Should only return unapproved courses that user can see
    response.body.courses.forEach((course) => {
      expect(course.approved).toBe(false);
      // Should only include user's or friend's courses
      expect([user.id, friendUser.id]).toContain(course.submitted_by_id);
    });
  });

  // GOOD: Integration concern - user submission filtering from database
  test('should filter courses by user submission status from database', async () => {
    const response = await request(app)
      .get('/api/courses?is_user_submitted=true&city=Unique Test City')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.courses).toBeDefined();

    // Integration: All returned courses should be user-submitted
    response.body.courses.forEach((course) => {
      expect(course.is_user_submitted).toBe(true);
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Boolean parameter validation (unit test concern)
  // - Complex permission logic details (unit test concern)
  // - Search filter combination logic (unit test concern)
  // - Edge case handling (unit test concern)
  // These are all tested at the service unit test level
});
