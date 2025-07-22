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

describe('DELETE /api/rounds/:id/players/:playerId - Integration', () => {
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
    testId = `trrp${timestamp}${pid}${random}`;
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `tr${timestamp}${pid}`, // tr = "test remove" - keep under 20 chars
      email: `trrp${testId}@ex.co`,
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
    const courseData = createUniqueCourseData('trrp'); // TRRP = Test Round Remove Player
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

    // Create a test round to remove players from
    const roundData = {
      courseId: createdCourseIds[0],
      name: `Test Round ${testId}${Date.now()}`,
      startingHole: chance.integer({ min: 1, max: courseGetRes.body.hole_count }),
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
    const playerId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${roundId}/players/${playerId}`)
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });
});
