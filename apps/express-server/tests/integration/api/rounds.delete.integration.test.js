import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';
import { createUniqueCourseData } from '../test-helpers.js';

const chance = new Chance();

describe('DELETE /api/rounds/:id - Integration', () => {
  let user;
  let token;
  let testId;
  let timestamp;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    // Use process ID + timestamp + random for guaranteed uniqueness across parallel tests
    const fullTimestamp = Date.now();
    timestamp = fullTimestamp.toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const pid = process.pid.toString().slice(-3);
    testId = `trdr${timestamp}${pid}${random}`;
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `td${timestamp}${pid}`, // td = "test delete" - keep under 20 chars
      email: `trdr${testId}@ex.co`,
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

    // Create a test course to use in rounds with globally unique identifiers
    const courseData = createUniqueCourseData('trdr'); // TRDR = Test Round Delete Round
    const courseCreateRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);
    createdCourseIds.push(courseCreateRes.body.id);

    // Get the course to know its hole count for valid starting hole
    const courseGetRes = await request(app)
      .get(`/api/courses/${createdCourseIds[0]}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Create a test round to delete
    const roundData = {
      courseId: createdCourseIds[0],
      name: `Test Round ${testId}${Date.now()}`,
      startingHole: chance.integer({ min: 1, max: courseGetRes.body.hole_count }),
      isPrivate: false,
      skinsEnabled: false,
    };
    const roundRes = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);
    createdRoundIds.push(roundRes.body.id);
  });

  afterEach(async () => {
    // Clean up in reverse order due to foreign key constraints
    await query('DELETE FROM round_players WHERE round_id = ANY($1)', [createdRoundIds]);
    if (createdRoundIds.length > 0) {
      await query('DELETE FROM rounds WHERE id = ANY($1)', [createdRoundIds]);
    }
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
  });

  test('should require authentication', async () => {
    const roundId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${roundId}`)
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  test('should delete round successfully', async () => {
    const roundId = createdRoundIds[0];

    const res = await request(app)
      .delete(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
    });

    // Verify the round is deleted from the database
    const dbResult = await query('SELECT * FROM rounds WHERE id = $1', [roundId]);
    expect(dbResult.rows).toHaveLength(0);

    // Verify related round_players are also deleted (CASCADE)
    const playersResult = await query('SELECT * FROM round_players WHERE round_id = $1', [roundId]);
    expect(playersResult.rows).toHaveLength(0);

    // Remove from tracking array since it's already deleted
    createdRoundIds = [];
  });

  test('should return 400 when roundId is not a valid UUID', async () => {
    const invalidRoundId = 'invalid-uuid';

    const res = await request(app)
      .delete(`/api/rounds/${invalidRoundId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round ID must be a valid UUID',
    });
  });

  test('should return 404 when round does not exist', async () => {
    const nonExistentRoundId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${nonExistentRoundId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  test('should return 403 when user is not the round creator', async () => {
    // Create another user who is not the creator of the round
    const otherUserData = {
      username: `other${timestamp}${process.pid}`,
      email: `other${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLogin.body.tokens.accessToken;
    createdUserIds.push(otherLogin.body.user.id);

    const roundId = createdRoundIds[0];

    const res = await request(app)
      .delete(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Permission denied: Only the round creator can delete the round',
    });
  });
});