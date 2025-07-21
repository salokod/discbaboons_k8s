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

describe('POST /api/rounds/:id/players - Integration', () => {
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
    testId = `trap${timestamp}${pid}${random}`;
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `tp${timestamp}${pid}`, // tp = "test player" - keep under 20 chars
      email: `trap${testId}@ex.co`,
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
    const courseData = createUniqueCourseData('trap'); // TRAP = Test Round Add Player
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

    // Create a test round to add players to
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
    const playerData = { userId: chance.integer({ min: 1, max: 1000 }) };

    const res = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .send(playerData)
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  test('should add a user player to a round successfully', async () => {
    // Create another user to add as a player
    const playerUserData = {
      username: `pl${Date.now().toString().slice(-8)}${process.pid.toString().slice(-3)}`,
      email: `player${testId}${Date.now()}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    const playerRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(playerUserData)
      .expect(201);

    const playerId = playerRegisterResponse.body.user.id;
    createdUserIds.push(playerId);

    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ userId: playerId }] })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].round_id).toBe(createdRoundIds[0]);
    expect(response.body[0].user_id).toBe(playerId);
    expect(response.body[0].is_guest).toBe(false);
    expect(response.body[0].guest_name).toBeNull();
    expect(response.body[0]).toHaveProperty('joined_at');
  });

  test('should add a guest player to a round successfully', async () => {
    const guestName = chance.name();

    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ guestName }] })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].round_id).toBe(createdRoundIds[0]);
    expect(response.body[0].user_id).toBeNull();
    expect(response.body[0].is_guest).toBe(true);
    expect(response.body[0].guest_name).toBe(guestName);
    expect(response.body[0]).toHaveProperty('joined_at');
  });

  test('should return 400 when neither userId nor guestName provided', async () => {
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({}) // Empty body
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Players array is required and must contain at least one player');
  });

  test('should return 400 when both userId and guestName provided in single player', async () => {
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        players: [{
          userId: chance.integer({ min: 1, max: 1000 }),
          guestName: chance.name(),
        }],
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('cannot have both userId and guestName');
  });

  test('should return 404 when round does not exist', async () => {
    const fakeRoundId = chance.guid();

    const response = await request(app)
      .post(`/api/rounds/${fakeRoundId}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        players: [{ userId: chance.integer({ min: 1, max: 1000 }) }],
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Round not found');
  });

  test('should return 409 when user is already a player in the round', async () => {
    // Create another user
    const uniqueTimestamp = Date.now().toString();
    const playerUserData = {
      username: `tr${uniqueTimestamp.slice(-8)}${process.pid.toString().slice(-3)}`,
      email: `trapplayer${testId}${uniqueTimestamp}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    const playerRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(playerUserData)
      .expect(201);

    const playerId = playerRegisterResponse.body.user.id;
    createdUserIds.push(playerId);

    // Add player first time
    await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ userId: playerId }] })
      .expect(201);

    // Try to add same player again
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ userId: playerId }] })
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(`User ${playerId} is already a player in this round`);
  });

  test('should return 403 when user is not creator or existing player', async () => {
    // Create another user who is not creator or player
    const otherUserData = {
      username: `ot${Date.now().toString().slice(-8)}${process.pid.toString().slice(-3)}`,
      email: `other${testId}${Date.now()}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    const otherRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(otherUserData)
      .expect(201);

    const otherUserId = otherRegisterResponse.body.user.id;
    createdUserIds.push(otherUserId);

    // Login to get the auth token
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherAuthToken = otherLogin.body.tokens.accessToken;

    // Try to add player as non-creator/non-player
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${otherAuthToken}`)
      .send({ players: [{ userId: chance.integer({ min: 1, max: 1000 }) }] })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You must be the round creator or a player to add new players');
  });

  test('should return 400 when players array is missing', async () => {
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Players array is required and must contain at least one player');
  });

  test('should return 400 when players array is empty', async () => {
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [] })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Players array is required and must contain at least one player');
  });

  test('should return 400 when player has neither userId nor guestName', async () => {
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{}] })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('must include either userId or guestName');
  });

  test('should return 400 when duplicate userId in batch', async () => {
    const duplicateUserId = chance.integer({ min: 1, max: 1000 });
    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        players: [
          { userId: duplicateUserId },
          { userId: duplicateUserId },
        ],
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Duplicate userId');
  });

  test('should successfully add single user player', async () => {
    // Create another user
    const playerUserData = {
      username: `sg${Date.now().toString().slice(-8)}${process.pid.toString().slice(-3)}`,
      email: `single${testId}${Date.now()}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    const playerRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(playerUserData)
      .expect(201);

    const playerId = playerRegisterResponse.body.user.id;
    createdUserIds.push(playerId);

    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ userId: playerId }] })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].user_id).toBe(playerId);
    expect(response.body[0].is_guest).toBe(false);
  });

  test('should successfully add single guest player', async () => {
    const guestName = chance.name();

    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ guestName }] })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].guest_name).toBe(guestName);
    expect(response.body[0].is_guest).toBe(true);
    expect(response.body[0].user_id).toBeNull();
  });

  test('should successfully add multiple players (users and guests)', async () => {
    // Create two users
    const user1Data = {
      username: `m1${Date.now().toString().slice(-8)}${process.pid.toString().slice(-3)}`,
      email: `multi1${testId}${Date.now()}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    const user2Data = {
      username: `m2${Date.now().toString().slice(-8)}${process.pid.toString().slice(-3)}`,
      email: `multi2${testId}${Date.now()}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };

    const user1Response = await request(app)
      .post('/api/auth/register')
      .send(user1Data)
      .expect(201);
    const user2Response = await request(app)
      .post('/api/auth/register')
      .send(user2Data)
      .expect(201);

    const user1Id = user1Response.body.user.id;
    const user2Id = user2Response.body.user.id;
    createdUserIds.push(user1Id, user2Id);

    const guest1Name = chance.name();
    const guest2Name = chance.name();

    const response = await request(app)
      .post(`/api/rounds/${createdRoundIds[0]}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        players: [
          { userId: user1Id },
          { guestName: guest1Name },
          { userId: user2Id },
          { guestName: guest2Name },
        ],
      })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(4);

    // Check user players
    const userPlayers = response.body.filter((p) => !p.is_guest);
    expect(userPlayers).toHaveLength(2);
    expect(userPlayers.map((p) => p.user_id)).toContain(user1Id);
    expect(userPlayers.map((p) => p.user_id)).toContain(user2Id);

    // Check guest players
    const guestPlayers = response.body.filter((p) => p.is_guest);
    expect(guestPlayers).toHaveLength(2);
    expect(guestPlayers.map((p) => p.guest_name)).toContain(guest1Name);
    expect(guestPlayers.map((p) => p.guest_name)).toContain(guest2Name);
  });
});
