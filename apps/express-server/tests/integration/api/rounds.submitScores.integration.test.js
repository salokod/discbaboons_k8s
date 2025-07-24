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

describe('POST /api/rounds/:id/scores - Integration', () => {
  let user;
  let token;
  let testId;
  let timestamp;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];
  let testCourse;
  let testRound;
  let testPlayer;

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    // Use process ID + timestamp + random for guaranteed uniqueness across parallel tests
    const fullTimestamp = Date.now();
    timestamp = fullTimestamp.toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const pid = process.pid.toString().slice(-3);
    testId = `trss${timestamp}${pid}${random}`; // TRSS = Test Round Submit Scores
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `ss${timestamp}${pid}`, // ss = "submit scores" - keep under 20 chars
      email: `trss${testId}@ex.co`,
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
    const courseData = createUniqueCourseData('trss'); // TRSS = Test Round Submit Scores
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

    // Get the player record for the creator (auto-added when round is created)
    testPlayer = await queryOne(
      'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
      [testRound.id, user.id],
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
    const scores = [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }];

    const res = await request(app)
      .post(`/api/rounds/${testRound.id}/scores`)
      .send({ scores })
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  test('should submit scores successfully', async () => {
    const scores = [
      { playerId: testPlayer.id, holeNumber: 1, strokes: 3 },
      { playerId: testPlayer.id, holeNumber: 2, strokes: 4 },
    ];

    const response = await request(app)
      .post(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores })
      .expect(200);

    expect(response.body).toEqual({ success: true, scoresSubmitted: 2 });

    // Verify scores were saved in database
    const savedScores = await query(
      'SELECT * FROM scores WHERE round_id = $1 AND player_id = $2 ORDER BY hole_number',
      [testRound.id, testPlayer.id],
    );

    expect(savedScores.rows).toHaveLength(2);
    expect(savedScores.rows[0].hole_number).toBe(1);
    expect(savedScores.rows[0].strokes).toBe(3);
    expect(savedScores.rows[1].hole_number).toBe(2);
    expect(savedScores.rows[1].strokes).toBe(4);
  });
});
