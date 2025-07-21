import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';
import {
  createUniqueUserData, createUniqueCourseData,
} from '../test-helpers.js';

const chance = new Chance();

describe('GET /api/rounds - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];

  beforeEach(async () => {
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user with globally unique identifiers
    const userData = createUniqueUserData('tl'); // tl = "test list"
    testId = userData.ids.fullId;

    await request(app).post('/api/auth/register').send(userData).expect(201);
    const login = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = login.body.tokens.accessToken;
    user = login.body.user;
    createdUserIds.push(user.id);

    // Create a test course with globally unique identifiers
    const courseData = createUniqueCourseData('trlr'); // TRLR = Test Round List Rounds
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
    const res = await request(app)
      .get('/api/rounds')
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should return empty list when user has no rounds', async () => {
    const res = await request(app)
      .get('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      rounds: [],
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should return user rounds with pagination metadata', async () => {
    // Create some test rounds
    const roundData1 = {
      courseId: createdCourseIds[0],
      name: `Test Round 1 ${testId}${Date.now()}`,
      isPrivate: false,
      skinsEnabled: true,
      skinsValue: chance.floating({ min: 1, max: 10, fixed: 2 }),
    };
    const roundData2 = {
      courseId: createdCourseIds[0],
      name: `Test Round 2 ${testId}${Date.now()}`,
      isPrivate: true,
      skinsEnabled: false,
    };

    const round1 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData1)
      .expect(201);
    createdRoundIds.push(round1.body.id);

    const round2 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData2)
      .expect(201);
    createdRoundIds.push(round2.body.id);

    const res = await request(app)
      .get('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      rounds: expect.arrayContaining([
        expect.objectContaining({
          id: round1.body.id,
          name: roundData1.name,
          is_private: roundData1.isPrivate,
          skins_enabled: roundData1.skinsEnabled,
        }),
        expect.objectContaining({
          id: round2.body.id,
          name: roundData2.name,
          is_private: roundData2.isPrivate,
          skins_enabled: roundData2.skinsEnabled,
        }),
      ]),
      total: 2,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  test('should only return rounds created by the authenticated user', async () => {
    // Create another user and their round
    const otherUserData = {
      username: `ot${Date.now().toString().slice(-8)}${process.pid.toString().slice(-3)}`,
      email: `other${testId}${Date.now()}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLogin.body.tokens.accessToken;
    const otherUser = otherLogin.body.user;
    createdUserIds.push(otherUser.id);

    // Create round for other user
    const otherRoundData = {
      courseId: createdCourseIds[0],
      name: `Other User Round ${testId}${Date.now()}`,
    };
    const otherRound = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${otherToken}`)
      .send(otherRoundData)
      .expect(201);
    createdRoundIds.push(otherRound.body.id);

    // Create round for main user
    const myRoundData = {
      courseId: createdCourseIds[0],
      name: `My Round ${testId}${Date.now()}`,
    };
    const myRound = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(myRoundData)
      .expect(201);
    createdRoundIds.push(myRound.body.id);

    // Request rounds as main user
    const res = await request(app)
      .get('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.rounds).toHaveLength(1);
    expect(res.body.rounds[0]).toMatchObject({
      id: myRound.body.id,
      name: myRoundData.name,
      created_by_id: user.id,
      player_count: 1, // Creator is auto-added as player
    });
  });

  test('should filter rounds by status', async () => {
    // Create rounds with different statuses
    const inProgressRound = {
      courseId: createdCourseIds[0],
      name: `In Progress Round ${testId}${Date.now()}`,
    };
    const round1 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(inProgressRound)
      .expect(201);
    createdRoundIds.push(round1.body.id);

    // Manually update one round to completed status for testing
    await query(
      'UPDATE rounds SET status = $1 WHERE id = $2',
      ['completed', round1.body.id],
    );

    const anotherRound = {
      courseId: createdCourseIds[0],
      name: `Another Round ${testId}${Date.now()}`,
    };
    const round2 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(anotherRound)
      .expect(201);
    createdRoundIds.push(round2.body.id);

    // Filter by completed status
    const completedRes = await request(app)
      .get('/api/rounds?status=completed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(completedRes.body.total).toBe(1);
    expect(completedRes.body.rounds[0]).toMatchObject({
      id: round1.body.id,
      status: 'completed',
      player_count: 1, // Creator is auto-added as player
    });

    // Filter by in_progress status
    const inProgressRes = await request(app)
      .get('/api/rounds?status=in_progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(inProgressRes.body.total).toBe(1);
    expect(inProgressRes.body.rounds[0]).toMatchObject({
      id: round2.body.id,
      status: 'in_progress',
      player_count: 1, // Creator is auto-added as player
    });
  });

  test('should filter rounds by is_private', async () => {
    // Create public and private rounds
    const publicRound = {
      courseId: createdCourseIds[0],
      name: `Public Round ${testId}${Date.now()}`,
      isPrivate: false,
    };
    const privateRound = {
      courseId: createdCourseIds[0],
      name: `Private Round ${testId}${Date.now()}`,
      isPrivate: true,
    };

    const round1 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(publicRound)
      .expect(201);
    createdRoundIds.push(round1.body.id);

    const round2 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(privateRound)
      .expect(201);
    createdRoundIds.push(round2.body.id);

    // Filter by private rounds
    const privateRes = await request(app)
      .get('/api/rounds?is_private=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(privateRes.body.total).toBe(1);
    expect(privateRes.body.rounds[0]).toMatchObject({
      id: round2.body.id,
      is_private: true,
      player_count: 1, // Creator is auto-added as player
    });

    // Filter by public rounds
    const publicRes = await request(app)
      .get('/api/rounds?is_private=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(publicRes.body.total).toBe(1);
    expect(publicRes.body.rounds[0]).toMatchObject({
      id: round1.body.id,
      is_private: false,
      player_count: 1, // Creator is auto-added as player
    });
  });

  test('should filter rounds by name search', async () => {
    // Create rounds with different names
    const round1 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId: createdCourseIds[0],
        name: `Morning Round ${testId}${Date.now()}`,
      })
      .expect(201);
    createdRoundIds.push(round1.body.id);

    const round2 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId: createdCourseIds[0],
        name: `Evening Game ${testId}`,
      })
      .expect(201);
    createdRoundIds.push(round2.body.id);

    // Search for "Morning"
    const searchRes = await request(app)
      .get('/api/rounds?name=Morning')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(searchRes.body.total).toBe(1);
    expect(searchRes.body.rounds[0]).toMatchObject({
      id: round1.body.id,
      name: expect.stringContaining('Morning'),
      player_count: 1, // Creator is auto-added as player
    });
  });

  test('should support pagination with limit and offset', async () => {
    // Create multiple rounds
    const roundPromises = Array.from({ length: 5 }, (_, i) => request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId: createdCourseIds[0],
        name: `Round ${i + 1} ${testId}${Date.now()}`,
      })
      .expect(201));

    const rounds = await Promise.all(roundPromises);
    createdRoundIds.push(...rounds.map((r) => r.body.id));

    // Test pagination
    const firstPageRes = await request(app)
      .get('/api/rounds?limit=2&offset=0')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(firstPageRes.body.total).toBe(5);
    expect(firstPageRes.body.limit).toBe(2);
    expect(firstPageRes.body.offset).toBe(0);
    expect(firstPageRes.body.hasMore).toBe(true);
    expect(firstPageRes.body.rounds).toHaveLength(2);

    const secondPageRes = await request(app)
      .get('/api/rounds?limit=2&offset=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(secondPageRes.body.total).toBe(5);
    expect(secondPageRes.body.limit).toBe(2);
    expect(secondPageRes.body.offset).toBe(2);
    expect(secondPageRes.body.hasMore).toBe(true);
    expect(secondPageRes.body.rounds).toHaveLength(2);

    const lastPageRes = await request(app)
      .get('/api/rounds?limit=2&offset=4')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(lastPageRes.body.total).toBe(5);
    expect(lastPageRes.body.limit).toBe(2);
    expect(lastPageRes.body.offset).toBe(4);
    expect(lastPageRes.body.hasMore).toBe(false);
    expect(lastPageRes.body.rounds).toHaveLength(1);
  });

  test('should return 400 for invalid status filter', async () => {
    const res = await request(app)
      .get('/api/rounds?status=invalid_status')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Status must be one of: in_progress, completed, cancelled',
    });
  });

  test('should return 400 for invalid is_private filter', async () => {
    const res = await request(app)
      .get('/api/rounds?is_private=7000')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'is_private must be a boolean value (true or false)',
    });
  });

  test('should return 400 for invalid skins_enabled filter', async () => {
    const res = await request(app)
      .get('/api/rounds?skins_enabled=invalid')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'skins_enabled must be a boolean value (true or false)',
    });
  });

  test('should accept string "true" and "false" for boolean filters', async () => {
    // Create a round to test with
    const roundData = {
      courseId: createdCourseIds[0],
      name: `Test Round ${testId}${Date.now()}`,
      isPrivate: true,
      skinsEnabled: false,
    };
    const round = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);
    createdRoundIds.push(round.body.id);

    // Test string "true" for is_private
    const privateTrueRes = await request(app)
      .get('/api/rounds?is_private=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(privateTrueRes.body.total).toBe(1);
    expect(privateTrueRes.body.rounds[0]).toMatchObject({
      id: round.body.id,
      is_private: true,
      player_count: 1, // Creator is auto-added as player
    });

    // Test string "false" for skins_enabled
    const skinsFalseRes = await request(app)
      .get('/api/rounds?skins_enabled=false')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(skinsFalseRes.body.total).toBe(1);
    expect(skinsFalseRes.body.rounds[0]).toMatchObject({
      id: round.body.id,
      skins_enabled: false,
      player_count: 1, // Creator is auto-added as player
    });
  });

  test('should accept all valid status values', async () => {
    // Create rounds with different statuses
    const round1 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId: createdCourseIds[0],
        name: `Round 1 ${testId}${Date.now()}`,
      })
      .expect(201);
    createdRoundIds.push(round1.body.id);

    const round2 = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        courseId: createdCourseIds[0],
        name: `Round 2 ${testId}${Date.now()}`,
      })
      .expect(201);
    createdRoundIds.push(round2.body.id);

    // Update one to completed status
    await query('UPDATE rounds SET status = $1 WHERE id = $2', ['completed', round1.body.id]);

    // Test completed status
    const completedRes = await request(app)
      .get('/api/rounds?status=completed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(completedRes.body).toHaveProperty('rounds');
    expect(completedRes.body).toHaveProperty('total');
    expect(completedRes.body.total).toBe(1);
    expect(completedRes.body.rounds[0]).toMatchObject({
      id: round1.body.id,
      status: 'completed',
      player_count: 1, // Creator is auto-added as player
    });

    // Test in_progress status
    const inProgressRes = await request(app)
      .get('/api/rounds?status=in_progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(inProgressRes.body).toHaveProperty('rounds');
    expect(inProgressRes.body).toHaveProperty('total');
    expect(inProgressRes.body.total).toBe(1);
    expect(inProgressRes.body.rounds[0]).toMatchObject({
      id: round2.body.id,
      status: 'in_progress',
      player_count: 1, // Creator is auto-added as player
    });

    // Test cancelled status
    const cancelledRes = await request(app)
      .get('/api/rounds?status=cancelled')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cancelledRes.body).toHaveProperty('rounds');
    expect(cancelledRes.body).toHaveProperty('total');
    expect(cancelledRes.body.total).toBe(0);
  });
});
