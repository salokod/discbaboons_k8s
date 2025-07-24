import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';
import { createUniqueCourseData } from '../test-helpers.js';

const chance = new Chance();

describe('PUT /api/rounds/:id/holes/:holeNumber/par - Integration', () => {
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
    testId = `trsp${timestamp}${pid}${random}`; // TRSP = Test Round Set Par
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `sp${timestamp}${pid}`, // sp = "set par" - keep under 20 chars
      email: `trsp${testId}@ex.co`,
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
    const courseData = createUniqueCourseData('trsp'); // TRSP = Test Round Set Par
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

  test('should set par for a hole successfully', async () => {
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par })
      .expect(200);

    expect(response.body).toEqual({ success: true });

    // Verify par was set in database
    const savedPar = await queryOne(
      'SELECT * FROM round_hole_pars WHERE round_id = $1 AND hole_number = $2',
      [testRound.id, holeNumber],
    );

    expect(savedPar).toBeTruthy();
    expect(savedPar.par).toBe(par);
    expect(savedPar.round_id).toBe(testRound.id);
    expect(savedPar.hole_number).toBe(holeNumber);
  });

  test('should update existing par for a hole', async () => {
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const originalPar = 3;
    const newPar = 4;

    // Set initial par
    await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: originalPar })
      .expect(200);

    // Update par
    const response = await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: newPar })
      .expect(200);

    expect(response.body).toEqual({ success: true });

    // Verify par was updated in database
    const savedPar = await queryOne(
      'SELECT * FROM round_hole_pars WHERE round_id = $1 AND hole_number = $2',
      [testRound.id, holeNumber],
    );

    expect(savedPar.par).toBe(newPar);

    // Should only have one record for this hole
    const allPars = await query(
      'SELECT * FROM round_hole_pars WHERE round_id = $1 AND hole_number = $2',
      [testRound.id, holeNumber],
    );
    expect(allPars.rows).toHaveLength(1);
  });

  test('should return 401 when not authenticated', async () => {
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });

    await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${holeNumber}/par`)
      .send({ par })
      .expect(401);
  });

  test('should return 400 when par is missing', async () => {
    const holeNumber = chance.integer({ min: 1, max: 18 });

    const response = await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Par is required',
    });
  });

  test('should return 400 when par is out of range', async () => {
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const invalidPar = chance.integer({ min: 11, max: 20 });

    const response = await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: invalidPar })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Par must be between 1 and 10',
    });
  });

  test('should return 400 when hole number exceeds course hole count', async () => {
    // testCourse has a known hole count, try to set par for hole beyond that
    const invalidHoleNumber = testCourse.hole_count + 1;
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${invalidHoleNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: `Hole number cannot exceed course hole count (${testCourse.hole_count})`,
    });
  });

  test('should return 404 when round not found', async () => {
    const nonExistentRoundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${nonExistentRoundId}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par })
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

    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${testRound.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${otherAuthToken}`)
      .send({ par })
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      message: 'Permission denied: User is not a participant in this round',
    });
  });
});
