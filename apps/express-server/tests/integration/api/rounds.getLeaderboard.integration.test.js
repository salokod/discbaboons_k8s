import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';
import {
  createTestUser,
  createTestCourse,
  createTestRound,
  cleanupRounds,
  cleanupCourses,
  cleanupUsers,
} from '../test-helpers.js';

const chance = new Chance();

describe('GET /api/rounds/:id/leaderboard - Integration', () => {
  let user;
  let token;
  let course;
  let round;
  let testPlayer1;
  let testPlayer2;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Direct DB setup using test helpers
    const testUser = await createTestUser();
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    course = await createTestCourse();
    createdCourseIds.push(course.id);

    // Create test round with user as creator
    const roundData = await createTestRound(user.id, course.id);
    round = roundData.round;
    testPlayer1 = roundData.player; // Auto-added player record
    createdRoundIds.push(round.id);

    // Add a second player directly in DB for speed
    const user2 = await createTestUser({ prefix: 'player2' });
    createdUserIds.push(user2.user.id);

    const player2Result = await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false) RETURNING *',
      [round.id, user2.user.id],
    );
    [testPlayer2] = player2Result.rows;
  });

  afterEach(async () => {
    // Clean up in reverse order for foreign key constraints
    await query('DELETE FROM scores WHERE round_id = ANY($1)', [createdRoundIds]);
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware
  test('should require authentication', async () => {
    await request(app)
      .get(`/api/rounds/${round.id}/leaderboard`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();

    const res = await request(app)
      .get(`/api/rounds/${fakeRoundId}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - permission validation against actual DB
  test('should return 403 when user is not participant in round', async () => {
    // Create user who is NOT a participant in the round
    const otherUser = await createTestUser({ prefix: 'outsider' });
    createdUserIds.push(otherUser.user.id);

    const res = await request(app)
      .get(`/api/rounds/${round.id}/leaderboard`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You must be a participant in this round to view leaderboard',
    });
  });

  // GOOD: Integration concern - complex leaderboard calculation with JOINs
  test('should return leaderboard with player rankings from database calculations', async () => {
    // Set up scores directly in DB for speed
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 1, 4],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 2, 5],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 1, 3],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 2, 4],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify leaderboard calculations and ranking
    expect(response.body).toHaveProperty('players');
    expect(Array.isArray(response.body.players)).toBe(true);
    expect(response.body.players).toHaveLength(2);

    // Should be sorted by position (ascending - best score first)
    const [firstPlayer, secondPlayer] = response.body.players;
    expect(firstPlayer).toMatchObject({
      playerId: testPlayer2.id,
      username: expect.any(String), // Integration: JOIN with users table
      totalStrokes: 7,
      totalPar: 6,
      relativeScore: 1,
      position: 1,
    });

    expect(secondPlayer).toMatchObject({
      playerId: testPlayer1.id,
      username: user.username, // Integration: JOIN with users table
      totalStrokes: 9,
      totalPar: 6,
      relativeScore: 3,
      position: 2,
    });
  });

  // GOOD: Integration concern - skins integration when enabled
  test('should include skins data when round has skins enabled', async () => {
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 });

    // Update round to enable skins directly in DB
    await query(
      'UPDATE rounds SET skins_enabled = true, skins_value = $1 WHERE id = $2',
      [skinsValue, round.id],
    );

    // Set up some scores for skins calculation
    const player1Strokes = chance.integer({ min: 1, max: 5 });
    const player2Strokes = player1Strokes + chance.integer({ min: 1, max: 2 });

    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 1, player1Strokes],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 1, player2Strokes],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify skins service integration
    expect(response.body).toHaveProperty('players');
    expect(response.body).toHaveProperty('roundSettings');
    expect(response.body.roundSettings.skinsEnabled).toBe(true);

    // Verify money flow fields are included in player data
    expect(response.body.players[0]).toHaveProperty('moneyIn');
    expect(response.body.players[0]).toHaveProperty('moneyOut');
    expect(response.body.players[0]).toHaveProperty('total');
    expect(response.body.players[1]).toHaveProperty('moneyIn');
    expect(response.body.players[1]).toHaveProperty('moneyOut');
    expect(response.body.players[1]).toHaveProperty('total');
  });

  // GOOD: Integration concern - money flow calculation in leaderboard
  test('should include money flow calculation for players with skins enabled', async () => {
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 });

    // Update round to enable skins directly in DB
    await query(
      'UPDATE rounds SET skins_enabled = true, skins_value = $1 WHERE id = $2',
      [skinsValue, round.id],
    );

    // Set up scores: Player 1 wins hole 1, Player 2 wins hole 2
    const player1WinStroke = chance.integer({ min: 1, max: 3 });
    const player1LoseStroke = player1WinStroke + chance.integer({ min: 1, max: 2 });
    const player2WinStroke = chance.integer({ min: 1, max: 3 });
    const player2LoseStroke = player2WinStroke + chance.integer({ min: 1, max: 2 });

    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 1, player1WinStroke], // Player 1 wins hole 1
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 1, player2LoseStroke], // Player 2 loses hole 1
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 2, player1LoseStroke], // Player 1 loses hole 2
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 2, player2WinStroke], // Player 2 wins hole 2
    );

    // Small delay to ensure all scores are committed
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    const response = await request(app)
      .get(`/api/rounds/${round.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Find players in response
    const player1Data = response.body.players.find((p) => p.playerId === testPlayer1.id);
    const player2Data = response.body.players.find((p) => p.playerId === testPlayer2.id);

    // Verify money flow calculation exists and is working
    expect(player1Data).toHaveProperty('moneyIn');
    expect(player1Data).toHaveProperty('moneyOut');
    expect(player1Data).toHaveProperty('total');
    expect(player2Data).toHaveProperty('moneyIn');
    expect(player2Data).toHaveProperty('moneyOut');
    expect(player2Data).toHaveProperty('total');
  });

  // GOOD: Integration concern - handles empty scores state
  test('should return empty leaderboard when no scores exist', async () => {
    const response = await request(app)
      .get(`/api/rounds/${round.id}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('players');
    expect(Array.isArray(response.body.players)).toBe(true);
    expect(response.body.players).toHaveLength(2); // Both players with 0 scores
    expect(response.body).toHaveProperty('roundSettings');
    expect(response.body.roundSettings.skinsEnabled).toBe(false);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Missing userId (unit test concern)
  // - Invalid userId format (unit test concern)
  // These are all tested at the service unit test level
});
