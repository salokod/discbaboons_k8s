import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('POST /api/rounds/:id/side-bets - Integration', () => {
  let user;
  let token;
  let testId;
  let timestamp;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];
  let createdSideBetIds = [];

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    const fullTimestamp = Date.now();
    timestamp = fullTimestamp.toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const pid = process.pid.toString().slice(-3);
    testId = `tsbc${timestamp}${pid}${random}`; // tsbc = test side bet create
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];
    createdSideBetIds = [];

    // Register test user
    const userData = {
      username: `tc${timestamp}${pid}`,
      email: `tsbc${testId}@ex.co`,
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

    // Create a test course
    const courseData = {
      name: `TSBC Course ${testId}${Date.now()}`,
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

    // Create a test round
    const roundData = {
      courseId: createdCourseIds[0],
      name: `TSBC Round ${testId}`,
      startingHole: 1,
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
    if (createdSideBetIds.length > 0) {
      await query('DELETE FROM side_bet_participants WHERE side_bet_id = ANY($1)', [createdSideBetIds]);
      await query('DELETE FROM side_bets WHERE id = ANY($1)', [createdSideBetIds]);
    }
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

  test('should export a function', () => {
    expect(typeof app).toBe('function');
  });

  test('should require authentication', async () => {
    const betType = chance.pickone(['hole', 'round']);
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType,
      ...(betType === 'hole' && { holeNumber: chance.integer({ min: 1, max: 18 }) }),
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .send(betData)
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should create hole bet with valid data', async () => {
    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'hole',
      description: chance.sentence(),
      holeNumber: chance.integer({ min: 1, max: 18 }),
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(201);

    // Should return the created side bet data
    expect(res.body).toMatchObject({
      id: expect.any(String),
      round_id: createdRoundIds[0],
      name: betData.name,
      description: betData.description,
      amount: expect.any(String), // PostgreSQL returns decimals as strings
      bet_type: betData.betType,
      hole_number: betData.holeNumber,
      created_by_id: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String),
      cancelled_at: null,
      cancelled_by_id: null,
    });

    // Track for cleanup
    createdSideBetIds.push(res.body.id);
  });

  test('should create round bet with valid data', async () => {
    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      description: chance.sentence(),
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(201);

    // Should return the created side bet data
    expect(res.body).toMatchObject({
      id: expect.any(String),
      round_id: createdRoundIds[0],
      name: betData.name,
      description: betData.description,
      amount: expect.any(String), // PostgreSQL returns decimals as strings
      bet_type: betData.betType,
      hole_number: null,
      created_by_id: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String),
      cancelled_at: null,
      cancelled_by_id: null,
    });

    // Track for cleanup
    createdSideBetIds.push(res.body.id);
  });

  test('should return 400 when name is missing', async () => {
    const betData = {
      // name missing
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: chance.word(),
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bet name is required',
    });
  });

  test('should return 400 when amount is missing', async () => {
    const betData = {
      name: chance.word(),
      // amount missing
      betType: chance.word(),
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bet amount is required',
    });
  });

  test('should return 400 when betType is missing', async () => {
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      // betType missing
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bet type is required',
    });
  });

  test('should return 400 when betType is invalid', async () => {
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'invalid-type',
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bet type must be either "hole" or "round"',
    });
  });

  test('should return 400 when hole number missing for hole bet', async () => {
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'hole',
      // holeNumber missing
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Hole number is required for hole bets',
    });
  });

  test('should return 400 when hole number provided for round bet', async () => {
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      holeNumber: 5,
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Hole number should not be provided for round bets',
    });
  });

  test('should return 400 when amount is not positive', async () => {
    const betData = {
      name: chance.word(),
      amount: 0,
      betType: 'round',
    };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bet amount must be positive',
    });
  });
});
