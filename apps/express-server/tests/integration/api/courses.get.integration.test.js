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

describe('GET /api/courses/:id - Integration', () => {
  let user;
  let token;
  let friendUser;
  let approvedCourseId;
  let unapprovedCourseId;
  let friendCourseId;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];

    // Create user directly in DB
    const testUser = await createTestUser({ prefix: 'coursesget' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create friend user directly in DB
    const testFriend = await createTestUser({ prefix: 'coursesgetfriend' });
    friendUser = testFriend.user;
    createdUserIds.push(friendUser.id);

    // Create friendship between users directly in DB
    await query(
      `INSERT INTO friendship_requests (requester_id, recipient_id, status)
       VALUES ($1, $2, 'accepted')`,
      [user.id, friendUser.id],
    );

    // Create approved course directly in DB
    approvedCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, postal_code, 
       hole_count, latitude, longitude, is_user_submitted, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        approvedCourseId,
        chance.company(),
        chance.city(),
        'CA',
        'US',
        chance.zip(),
        chance.integer({ min: 9, max: 27 }),
        chance.latitude({ fixed: 5 }),
        chance.longitude({ fixed: 5 }),
        false,
        true,
      ],
    );
    createdCourseIds.push(approvedCourseId);

    // Create unapproved course owned by user directly in DB
    unapprovedCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        unapprovedCourseId,
        chance.company(),
        chance.city(),
        'TX',
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        user.id,
      ],
    );
    createdCourseIds.push(unapprovedCourseId);

    // Create unapproved course owned by friend directly in DB
    friendCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        friendCourseId,
        chance.company(),
        chance.city(),
        'FL',
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        friendUser.id,
      ],
    );
    createdCourseIds.push(friendCourseId);
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

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    await request(app)
      .get(`/api/courses/${approvedCourseId}`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - approved course retrieval from database
  test('should return approved course details from database', async () => {
    const response = await request(app)
      .get(`/api/courses/${approvedCourseId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: approvedCourseId,
      approved: true,
      is_user_submitted: false,
      submitted_by_id: null,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  // GOOD: Integration concern - non-existent course handling
  test('should return null for non-existent course', async () => {
    const nonExistentId = chance.guid();

    const response = await request(app)
      .get(`/api/courses/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toBe(null);
  });

  // GOOD: Integration concern - owner access to own unapproved course
  test('should return user own unapproved course', async () => {
    const response = await request(app)
      .get(`/api/courses/${unapprovedCourseId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: unapprovedCourseId,
      approved: false,
      submitted_by_id: user.id,
    });
  });

  // GOOD: Integration concern - friend access via friendship table JOIN
  test('should return friend unapproved course via friendship relationship', async () => {
    const response = await request(app)
      .get(`/api/courses/${friendCourseId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: friendCourseId,
      approved: false,
      submitted_by_id: friendUser.id,
    });
  });

  // GOOD: Integration concern - access denial for non-friends' unapproved courses
  test('should not return other user unapproved course when no friendship', async () => {
    // Create another user (not a friend) directly in DB
    const testOther = await createTestUser({ prefix: 'coursesgetother' });
    const otherUser = testOther.user;
    createdUserIds.push(otherUser.id);

    // Create an unapproved course submitted by the other user
    const otherCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        otherCourseId,
        chance.company(),
        chance.city(),
        'WA',
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        otherUser.id,
      ],
    );
    createdCourseIds.push(otherCourseId);

    // Integration: Should not be able to access other user's unapproved course
    const response = await request(app)
      .get(`/api/courses/${otherCourseId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toBe(null);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Coordinate truncation logic (unit test concern)
  // - Response field formatting (unit test concern)
  // These are all tested at the service unit test level
});
