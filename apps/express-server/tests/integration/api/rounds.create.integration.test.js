import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('POST /api/rounds - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];

  beforeEach(async () => {
    // Generate unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `trcr${testId}`, // trcr = "test round create"
      email: `trcr${testId}@ex.co`,
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
    const courseData = {
      name: `Test Course ${testId}`,
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };
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
    const roundData = {
      courseId: createdCourseIds[0],
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .post('/api/rounds')
      .send(roundData)
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should create round with valid data', async () => {
    const courseId = createdCourseIds[0];
    const roundData = {
      courseId,
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: 9 }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
      skinsValue: chance.floating({ min: 1, max: 50, fixed: 2 }),
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);

    // Should return the created round data
    expect(res.body).toMatchObject({
      id: expect.any(String),
      created_by_id: user.id,
      course_id: courseId,
      name: roundData.name,
      starting_hole: roundData.startingHole,
      is_private: roundData.isPrivate,
      skins_enabled: roundData.skinsEnabled,
      skins_value: roundData.skinsValue ? String(roundData.skinsValue) : null,
      status: 'in_progress',
      start_time: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });

    // Track for cleanup
    createdRoundIds.push(res.body.id);
  });

  test('should automatically add creator as player when round is created', async () => {
    const courseId = createdCourseIds[0];
    const roundData = {
      courseId,
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: 9 }),
      isPrivate: false,
      skinsEnabled: false,
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);

    const roundId = res.body.id;
    createdRoundIds.push(roundId);

    // Verify the creator was automatically added as a player
    const playerCheckResult = await query(
      'SELECT * FROM round_players WHERE round_id = $1 AND user_id = $2',
      [roundId, user.id],
    );

    expect(playerCheckResult.rows).toHaveLength(1);
    const player = playerCheckResult.rows[0];
    expect(player.round_id).toBe(roundId);
    expect(player.user_id).toBe(user.id);
    expect(player.is_guest).toBe(false);
    expect(player.guest_name).toBeNull();
    expect(player.joined_at).toBeDefined();
  });

  test('should return 400 when courseId is missing', async () => {
    const roundData = {
      // courseId missing
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Course ID is required',
    });
  });

  test('should return 400 when name is missing', async () => {
    const roundData = {
      courseId: createdCourseIds[0],
      // name missing
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round name is required',
    });
  });

  test('should return 400 when course does not exist', async () => {
    const roundData = {
      courseId: 'nonexistent-course-id',
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Course not found',
    });
  });

  test('should return 400 when starting hole exceeds course hole count', async () => {
    // Get the course to know its hole count
    const courseRes = await request(app)
      .get(`/api/courses/${createdCourseIds[0]}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const roundData = {
      courseId: createdCourseIds[0],
      name: chance.sentence({ words: 3 }),
      startingHole: courseRes.body.hole_count + 1, // Exceed hole count
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Starting hole cannot exceed course hole count',
    });
  });
});
