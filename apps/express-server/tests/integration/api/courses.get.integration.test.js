import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import { query } from '../setup.js';
import {
  createTestUser,
  createTestCourse,
  createFriendship,
  cleanupUsers,
  cleanupCourses,
} from '../test-helpers.js';

describe('GET /api/courses/:id - Integration', () => {
  let user;
  let token;
  let friend;
  let approvedCourse;
  let unapprovedCourse;
  let friendCourse;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];

    // Create test users using helper
    const testUser = await createTestUser({ prefix: 'coursesget' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    const testFriend = await createTestUser({ prefix: 'coursesgetfriend' });
    friend = testFriend.user;
    createdUserIds.push(friend.id);

    // Create friendship using helper
    await createFriendship(user.id, friend.id);

    // Create test courses using helpers
    approvedCourse = await createTestCourse({
      prefix: 'approved',
      approved: true,
      isUserSubmitted: false,
    });
    createdCourseIds.push(approvedCourse.id);

    unapprovedCourse = await createTestCourse({
      prefix: 'usercourse',
      approved: false,
      isUserSubmitted: true,
      submittedById: user.id,
    });
    createdCourseIds.push(unapprovedCourse.id);

    friendCourse = await createTestCourse({
      prefix: 'friendcourse',
      approved: false,
      isUserSubmitted: true,
      submittedById: friend.id,
    });
    createdCourseIds.push(friendCourse.id);
  });

  afterEach(async () => {
    // Clean up in proper FK order using helpers
    await cleanupCourses(createdCourseIds);
    if (createdUserIds.length > 0) {
      await query('DELETE FROM friendship_requests WHERE requester_id = ANY($1) OR recipient_id = ANY($1)', [createdUserIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    await request(app)
      .get(`/api/courses/${approvedCourse.id}`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - approved course retrieval from database
  test('should return approved course details from database', async () => {
    const response = await request(app)
      .get(`/api/courses/${approvedCourse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: approvedCourse.id,
      approved: true,
      is_user_submitted: false,
      submitted_by_id: null,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  // GOOD: Integration concern - non-existent course handling
  test('should return null for non-existent course', async () => {
    const response = await request(app)
      .get('/api/courses/non-existent-course-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toBe(null);
  });

  // GOOD: Integration concern - owner access to own unapproved course
  test('should return user own unapproved course', async () => {
    const response = await request(app)
      .get(`/api/courses/${unapprovedCourse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: unapprovedCourse.id,
      approved: false,
      submitted_by_id: user.id,
    });
  });

  // GOOD: Integration concern - friend access via friendship table JOIN
  test('should return friend unapproved course via friendship relationship', async () => {
    const response = await request(app)
      .get(`/api/courses/${friendCourse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: friendCourse.id,
      approved: false,
      submitted_by_id: friend.id,
    });
  });

  // GOOD: Integration concern - access denial for non-friends' unapproved courses
  test('should not return other user unapproved course when no friendship', async () => {
    // Create another user (not a friend) using helper
    const testOther = await createTestUser({ prefix: 'coursesgetother' });
    const otherUser = testOther.user;
    createdUserIds.push(otherUser.id);

    // Create an unapproved course submitted by the other user using helper
    const otherCourse = await createTestCourse({
      prefix: 'othercourse',
      approved: false,
      isUserSubmitted: true,
      submittedById: otherUser.id,
    });
    createdCourseIds.push(otherCourse.id);

    // Integration: Should not be able to access other user's unapproved course
    const response = await request(app)
      .get(`/api/courses/${otherCourse.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toBe(null);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Coordinate truncation logic (unit test concern)
  // - Response field formatting (unit test concern)
  // These are all tested at the service unit test level
});
