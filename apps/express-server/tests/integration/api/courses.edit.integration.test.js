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

describe('PUT /api/courses/:id - Integration', () => {
  let adminUser;
  let adminToken;
  let ownerUser;
  let ownerToken;
  let friendUser;
  let friendToken;
  let otherUser;
  let otherToken;
  let testCourseId;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];

    // Create admin user directly in DB
    const testAdmin = await createTestUser({ prefix: 'courseseditadmin' });
    adminUser = testAdmin.user;
    adminToken = testAdmin.token;
    createdUserIds.push(adminUser.id);

    // Make user admin
    await query('UPDATE users SET is_admin = true WHERE id = $1', [adminUser.id]);

    // Create course owner directly in DB
    const testOwner = await createTestUser({ prefix: 'courseseditowner' });
    ownerUser = testOwner.user;
    ownerToken = testOwner.token;
    createdUserIds.push(ownerUser.id);

    // Create friend user directly in DB
    const testFriend = await createTestUser({ prefix: 'courseseditfriend' });
    friendUser = testFriend.user;
    friendToken = testFriend.token;
    createdUserIds.push(friendUser.id);

    // Create other user directly in DB
    const testOther = await createTestUser({ prefix: 'courseseditother' });
    otherUser = testOther.user;
    otherToken = testOther.token;
    createdUserIds.push(otherUser.id);

    // Create friendship between owner and friend directly in DB
    await query(
      `INSERT INTO friendship_requests (requester_id, recipient_id, status)
       VALUES ($1, $2, 'accepted')`,
      [ownerUser.id, friendUser.id],
    );

    // Create test course directly in DB
    testCourseId = chance.guid();
    await query(
      `INSERT INTO courses (id, name, city, state_province, country, hole_count, 
       is_user_submitted, approved, submitted_by_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        testCourseId,
        chance.company(),
        chance.city(),
        'CA',
        'US',
        chance.integer({ min: 9, max: 27 }),
        true,
        false,
        ownerUser.id,
      ],
    );
    createdCourseIds.push(testCourseId);
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
      .put(`/api/courses/${testCourseId}`)
      .send({ name: chance.company() })
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - admin authorization and database persistence
  test('should allow admin to edit any course and persist to database', async () => {
    const updateData = {
      name: chance.company(),
      city: chance.city(),
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const response = await request(app)
      .put(`/api/courses/${testCourseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      id: testCourseId,
      name: updateData.name,
      city: updateData.city,
      hole_count: updateData.holeCount,
    });

    // Integration: Verify persistence to database
    const courseInDb = await query('SELECT * FROM courses WHERE id = $1', [testCourseId]);
    expect(courseInDb.rows[0]).toMatchObject({
      name: updateData.name,
      city: updateData.city,
      hole_count: updateData.holeCount,
    });
  });

  // GOOD: Integration concern - owner authorization and database persistence
  test('should allow owner to edit their own course and persist to database', async () => {
    const updateData = {
      name: chance.company(),
      stateProvince: 'TX',
    };

    const response = await request(app)
      .put(`/api/courses/${testCourseId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      id: testCourseId,
      name: updateData.name,
      state_province: updateData.stateProvince,
    });

    // Integration: Verify persistence to database
    const courseInDb = await query('SELECT * FROM courses WHERE id = $1', [testCourseId]);
    expect(courseInDb.rows[0]).toMatchObject({
      name: updateData.name,
      state_province: updateData.stateProvince,
    });
  });

  // GOOD: Integration concern - friend authorization via friendship table JOIN
  test('should allow friend to edit course via friendship relationship', async () => {
    const updateData = {
      name: chance.company(),
      city: chance.city(),
    };

    const response = await request(app)
      .put(`/api/courses/${testCourseId}`)
      .set('Authorization', `Bearer ${friendToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      id: testCourseId,
      name: updateData.name,
      city: updateData.city,
    });
  });

  // GOOD: Integration concern - authorization denial for non-friends
  test('should reject edit from non-friend user', async () => {
    const response = await request(app)
      .put(`/api/courses/${testCourseId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: chance.company() })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  // GOOD: Integration concern - non-existent course handling
  test('should return 404 for non-existent course', async () => {
    const nonExistentId = chance.guid();

    const response = await request(app)
      .put(`/api/courses/${nonExistentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: chance.company() })
      .expect(404);

    expect(response.body).toMatchObject({
      error: expect.stringMatching(/not found/i),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Empty update validation (unit test concern)
  // - Field format validation (unit test concern)
  // - Coordinate truncation logic (unit test concern)
  // - camelCase vs snake_case conversion (unit test concern)
  // These are all tested at the service unit test level
});
