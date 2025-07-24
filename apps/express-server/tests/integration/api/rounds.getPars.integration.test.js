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

describe('GET /api/rounds/:id/pars - Integration', () => {
  let user;
  let token;
  let testId;
  let timestamp;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];
  let testCourse;
  let testRound;

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    // Use process ID + timestamp + random for guaranteed uniqueness across parallel tests
    const fullTimestamp = Date.now();
    timestamp = fullTimestamp.toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const pid = process.pid.toString().slice(-3);
    testId = `trgp${timestamp}${pid}${random}`; // TRGP = Test Round Get Pars
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `gp${timestamp}${pid}`, // gp = "get pars" - keep under 20 chars
      email: `trgp${testId}@ex.co`,
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
    const courseData = createUniqueCourseData('trgp'); // TRGP = Test Round Get Pars
    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);
    testCourse = courseResponse.body;
    createdCourseIds.push(testCourse.id);

    // Create test round
    const roundData = {
      courseId: testCourse.id,
      name: `Test Round ${testId}${Date.now()}`,
      startingHole: chance.integer({ min: 1, max: testCourse.hole_count }),
    };
    const roundResponse = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);
    testRound = roundResponse.body;
    createdRoundIds.push(testRound.id);
  });

  afterEach(async () => {
    // Clean up in reverse order of creation to respect foreign key constraints
    if (createdRoundIds.length > 0) {
      await query('DELETE FROM round_hole_pars WHERE round_id = ANY($1)', [createdRoundIds]);
      await query('DELETE FROM round_players WHERE round_id = ANY($1)', [createdRoundIds]);
      await query('DELETE FROM rounds WHERE id = ANY($1)', [createdRoundIds]);
    }
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
  });

  test('should return empty object when no pars have been set', async () => {
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/pars`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({});
  });

  test('should return pars that have been set', async () => {
    // Set pars for some holes
    await request(app)
      .put(`/api/rounds/${testRound.id}/holes/1/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: 3 })
      .expect(200);

    await request(app)
      .put(`/api/rounds/${testRound.id}/holes/3/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: 4 })
      .expect(200);

    await request(app)
      .put(`/api/rounds/${testRound.id}/holes/7/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: 5 })
      .expect(200);

    // Get all pars
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/pars`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      1: 3,
      3: 4,
      7: 5,
    });
  });

  test('should return 401 when not authenticated', async () => {
    await request(app)
      .get(`/api/rounds/${testRound.id}/pars`)
      .expect(401);
  });

  test('should return 404 when round not found', async () => {
    const nonExistentRoundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${nonExistentRoundId}/pars`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Round not found',
    });
  });

  test('should return 403 when user is not participant in round', async () => {
    // Create another user who is not a participant in the round
    const otherUserData = {
      username: `other${timestamp}${process.pid}`,
      email: `other${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };

    await request(app)
      .post('/api/auth/register')
      .send(otherUserData)
      .expect(201);

    const otherLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: otherUserData.username,
        password: otherUserData.password,
      })
      .expect(200);

    const otherAuthToken = otherLoginResponse.body.tokens.accessToken;
    createdUserIds.push(otherLoginResponse.body.user.id); // Track for cleanup

    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/pars`)
      .set('Authorization', `Bearer ${otherAuthToken}`)
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      message: 'Permission denied: User is not a participant in this round',
    });
  });
});
