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

describe('GET /api/rounds/:id/leaderboard - Integration', () => {
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
    testId = `tlbd${timestamp}${pid}${random}`; // TLBD = Test Leaderboard
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `lb${timestamp}${pid}`, // lb = "leaderboard" - keep under 20 chars
      email: `tlbd${testId}@ex.co`,
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
    const courseData = createUniqueCourseData('tlbd'); // TLBD = Test Leaderboard
    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);
    testCourse = courseResponse.body;
    createdCourseIds.push(testCourse.id);

    // Create test round with skins enabled
    const roundData = {
      courseId: testCourse.id,
      name: `Test Round ${testId}${Date.now()}`,
      startingHole: 1,
      skinsEnabled: true,
      skinsValue: 5.00,
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
      .get(`/api/rounds/${testRound.id}/leaderboard`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 400 when round ID is invalid UUID', async () => {
    const response = await request(app)
      .get('/api/rounds/invalid-uuid/leaderboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Round ID must be a valid UUID');
  });

  test('should return 404 when round does not exist', async () => {
    const nonexistentRoundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${nonexistentRoundId}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Round not found');
  });

  test('should return empty leaderboard when no scores exist', async () => {
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Should return both players with 0 scores, sorted alphabetically by default
    expect(response.body.players).toHaveLength(2);
    expect(response.body.players[0]).toEqual({
      playerId: testPlayer1.id,
      username: user.username,
      guestName: null,
      isGuest: false,
      position: 1,
      totalStrokes: 0,
      totalPar: 0,
      relativeScore: 0,
      holesCompleted: 0,
      currentHole: 1,
      skinsWon: 0,
    });

    expect(response.body.roundSettings).toEqual({
      skinsEnabled: true,
      skinsValue: '5.00',
      currentCarryOver: 0,
    });
  });

  test('should return leaderboard sorted by total strokes with skins settings', async () => {
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

    // Submit scores - player2 has lower total strokes and should be first
    const scoresData = {
      scores: [
        { playerId: testPlayer1.id, holeNumber: 1, strokes: 5 }, // +1 over par 4
        { playerId: testPlayer1.id, holeNumber: 2, strokes: 6 }, // +1 over par 5
        { playerId: testPlayer2.id, holeNumber: 1, strokes: 3 }, // -1 under par 4
      ],
    };

    await request(app)
      .post(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send(scoresData)
      .expect(200);

    // Get leaderboard
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.players).toHaveLength(2);

    // Player 2 (guest) should be first with lower total strokes
    expect(response.body.players[0]).toEqual({
      playerId: testPlayer2.id,
      username: null,
      guestName: 'Test Guest Player',
      isGuest: true,
      position: 1,
      totalStrokes: 3,
      totalPar: 4,
      relativeScore: -1,
      holesCompleted: 1,
      currentHole: 2,
      skinsWon: 1, // Player 2 wins hole 1
    });

    // Player 1 (creator) should be second with higher total strokes
    expect(response.body.players[1]).toEqual({
      playerId: testPlayer1.id,
      username: user.username,
      guestName: null,
      isGuest: false,
      position: 2,
      totalStrokes: 11,
      totalPar: 9,
      relativeScore: 2,
      holesCompleted: 2,
      currentHole: 3,
      skinsWon: 1, // Wins hole 2
    });

    // Round settings should include skins info
    expect(response.body.roundSettings).toEqual({
      skinsEnabled: true,
      skinsValue: '5.00',
      currentCarryOver: 0, // Placeholder
    });
  });

  test('should include real skins data when skins are enabled', async () => {
    // Submit scores where player2 wins hole 1, player1 wins hole 2
    const scoresData = {
      scores: [
        { playerId: testPlayer1.id, holeNumber: 1, strokes: 4 },
        { playerId: testPlayer1.id, holeNumber: 2, strokes: 3 },
        { playerId: testPlayer2.id, holeNumber: 1, strokes: 3 }, // Wins hole 1
        { playerId: testPlayer2.id, holeNumber: 2, strokes: 5 },
      ],
    };

    await request(app)
      .post(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send(scoresData)
      .expect(200);

    // Get leaderboard
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify real skins data is integrated
    expect(response.body.players[0].skinsWon).toBe(1); // Player 2 won hole 1
    expect(response.body.players[1].skinsWon).toBe(1); // Player 1 won hole 2

    // Verify no carry over
    expect(response.body.roundSettings.currentCarryOver).toBe(0);
  });

  test('should show skins carry over when holes tie', async () => {
    // Submit scores where holes 1 and 2 tie, player1 wins hole 3
    const scoresData = {
      scores: [
        { playerId: testPlayer1.id, holeNumber: 1, strokes: 3 }, // Tie
        { playerId: testPlayer1.id, holeNumber: 2, strokes: 4 }, // Tie
        { playerId: testPlayer1.id, holeNumber: 3, strokes: 2 }, // Wins with carry
        { playerId: testPlayer2.id, holeNumber: 1, strokes: 3 }, // Tie
        { playerId: testPlayer2.id, holeNumber: 2, strokes: 4 }, // Tie
        { playerId: testPlayer2.id, holeNumber: 3, strokes: 5 },
      ],
    };

    await request(app)
      .post(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send(scoresData)
      .expect(200);

    // Get leaderboard
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Player 1 should have won 3 skins (2 carry over + 1)
    const player1 = response.body.players.find((p) => p.playerId === testPlayer1.id);
    expect(player1.skinsWon).toBe(3);

    // Player 2 should have 0 skins
    const player2 = response.body.players.find((p) => p.playerId === testPlayer2.id);
    expect(player2.skinsWon).toBe(0);

    // No remaining carry over since hole 3 was won
    expect(response.body.roundSettings.currentCarryOver).toBe(0);
  });

  test('should return 403 when user is not participant', async () => {
    // Create another user with unique identifier
    const otherUserData = {
      username: `lbother${timestamp}${chance.string({ length: 3, pool: 'abcdefghijklmnopqrstuvwxyz' })}`,
      email: `lbother${testId}${Date.now()}@ex.co`,
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
      .get(`/api/rounds/${testRound.id}/leaderboard`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You must be a participant in this round to view leaderboard');
  });
});
