import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';
import { createUniqueUserData, createUniqueCourseData } from '../test-helpers.js';

const chance = new Chance();

describe('GET /api/rounds/:id/players - Integration', () => {
  let user;
  let token;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];

  beforeEach(async () => {
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user with globally unique identifiers
    const userData = createUniqueUserData('trlpi'); // trlpi = "test round list players integration"

    await request(app).post('/api/auth/register').send(userData).expect(201);
    const login = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = login.body.tokens.accessToken;
    user = login.body.user;
    createdUserIds.push(user.id);

    // Create a test course with globally unique identifiers
    const courseData = createUniqueCourseData('trlpi'); // TRLPI = Test Round List Players Integration
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);
    createdCourseIds.push(courseRes.body.id);
  });

  afterEach(async () => {
    // Clean up in reverse order due to foreign key constraints
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
      .get(`/api/rounds/${roundId}/players`)
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });
});
