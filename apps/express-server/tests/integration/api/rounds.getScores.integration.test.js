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

describe('GET /api/rounds/:id/scores - Integration', () => {
  let user;
  let token;
  let testId;
  let timestamp;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];
  let testCourse;
  let testRound;
  let testPlayer1;
  let testPlayer2;

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    const fullTimestamp = Date.now();
    timestamp = fullTimestamp.toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const pid = process.pid.toString().slice(-3);
    testId = `trgs${timestamp}${pid}${random}`; // TRGS = Test Round Get Scores
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `gs${timestamp}${pid}`, // gs = "get scores" - keep under 20 chars
      email: `trgs${testId}@ex.co`,
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

    // Create a test course to use in rounds
    const courseData = createUniqueCourseData('trgs'); // TRGS = Test Round Get Scores
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
      startingHole: 1,
    };
    const roundResponse = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);
    testRound = roundResponse.body;
    createdRoundIds.push(testRound.id);

    // Get the player record for the creator (auto-added when round is created)
    testPlayer1 = await queryOne(
      'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
      [testRound.id, user.id],
    );

    // Add a guest player to the round
    const playersData = {
      players: [
        { guestName: 'Test Guest Player' },
      ],
    };
    await request(app)
      .post(`/api/rounds/${testRound.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send(playersData)
      .expect(201);

    // Get the guest player record
    testPlayer2 = await queryOne(
      'SELECT id FROM round_players WHERE round_id = $1 AND is_guest = true',
      [testRound.id],
    );
  });

  afterEach(async () => {
    // Clean up in reverse order of creation to respect foreign key constraints
    if (createdRoundIds.length > 0) {
      await query('DELETE FROM scores WHERE round_id = ANY($1)', [createdRoundIds]);
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

  test('should require authentication', async () => {
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/scores`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 400 when round ID is invalid UUID', async () => {
    const response = await request(app)
      .get('/api/rounds/invalid-uuid/scores')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Round ID must be a valid UUID');
  });

  test('should return 404 when round does not exist', async () => {
    const nonexistentRoundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${nonexistentRoundId}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Round not found');
  });

  test('should return empty scores object when no scores exist', async () => {
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Should return all players with empty holes
    expect(response.body[testPlayer1.id]).toEqual({
      username: user.username,
      guestName: null,
      isGuest: false,
      holes: {},
      total: 0,
      totalPar: 0,
      relativeScore: 0,
    });

    expect(response.body[testPlayer2.id]).toEqual({
      username: null,
      guestName: 'Test Guest Player',
      isGuest: true,
      holes: {},
      total: 0,
      totalPar: 0,
      relativeScore: 0,
    });
  });

  test('should return scores with dynamic par lookup', async () => {
    // Set custom pars for holes 1 and 2
    await request(app)
      .put(`/api/rounds/${testRound.id}/holes/1/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: 4 })
      .expect(200);

    await request(app)
      .put(`/api/rounds/${testRound.id}/holes/2/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: 5 })
      .expect(200);

    // Submit scores for both players
    const scoresData = {
      scores: [
        { playerId: testPlayer1.id, holeNumber: 1, strokes: 3 }, // -1 (birdie)
        { playerId: testPlayer1.id, holeNumber: 2, strokes: 6 }, // +1 (bogey)
        { playerId: testPlayer1.id, holeNumber: 3, strokes: 4 }, // +1 (default par 3)
        { playerId: testPlayer2.id, holeNumber: 1, strokes: 5 }, // +1 (bogey)
        { playerId: testPlayer2.id, holeNumber: 2, strokes: 4 }, // -1 (birdie)
      ],
    };

    await request(app)
      .post(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send(scoresData)
      .expect(200);

    // Get scores
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Player 1 (creator)
    expect(response.body[testPlayer1.id]).toEqual({
      username: user.username,
      guestName: null,
      isGuest: false,
      holes: {
        1: { strokes: 3, par: 4, relative: -1 },
        2: { strokes: 6, par: 5, relative: 1 },
        3: { strokes: 4, par: 3, relative: 1 },
      },
      total: 13,
      totalPar: 12,
      relativeScore: 1,
    });

    // Player 2 (guest)
    expect(response.body[testPlayer2.id]).toEqual({
      username: null,
      guestName: 'Test Guest Player',
      isGuest: true,
      holes: {
        1: { strokes: 5, par: 4, relative: 1 },
        2: { strokes: 4, par: 5, relative: -1 },
      },
      total: 9,
      totalPar: 9,
      relativeScore: 0,
    });
  });

  test('should return 403 when user is not participant', async () => {
    // Create another user
    const otherUserData = {
      username: `other${timestamp}${chance.string({ length: 3 })}`,
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

    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You must be a participant in this round to view scores');
  });
});
