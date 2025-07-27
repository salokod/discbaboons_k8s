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

describe('GET /api/rounds/:id/skins - Integration', () => {
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

    // Small delay to ensure FK references are fully committed
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Create test round with skins enabled
    const roundData = await createTestRound(user.id, course.id, {
      skinsEnabled: true,
      skinsValue: 5.00,
    });
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
      .get(`/api/rounds/${round.id}/skins`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();

    const res = await request(app)
      .get(`/api/rounds/${fakeRoundId}/skins`)
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
      .get(`/api/rounds/${round.id}/skins`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('participant'),
    });
  });

  // GOOD: Integration concern - skins disabled validation
  test('should return 400 when skins are not enabled for round', async () => {
    // Create round without skins enabled
    const noSkinsRound = await createTestRound(user.id, course.id, {
      skinsEnabled: false,
    });
    createdRoundIds.push(noSkinsRound.round.id);

    const res = await request(app)
      .get(`/api/rounds/${noSkinsRound.round.id}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Skins are not enabled for this round',
    });
  });

  // GOOD: Integration concern - complex skins calculation with scores from DB
  test('should calculate skins with scores from database', async () => {
    // Set up scores directly in DB for skins calculation
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 1, 3], // Hole 1: Player 1 wins
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 1, 4], // Hole 1: Player 2 loses
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 2, 4], // Hole 2: Tie
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 2, 4], // Hole 2: Tie
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify skins calculation from actual DB data
    expect(response.body).toMatchObject({
      roundId: round.id,
      skinsEnabled: true,
      skinsValue: '5.00',
      holes: expect.any(Object),
      playerSummary: expect.any(Object),
      totalCarryOver: expect.any(Number),
    });

    // Verify hole-by-hole skins calculation
    expect(response.body.holes).toHaveProperty('1');
    expect(response.body.holes).toHaveProperty('2');

    // Hole 1 should have a winner (player 1 with 3 strokes)
    expect(response.body.holes['1']).toMatchObject({
      winner: testPlayer1.id,
      winnerScore: 3,
      skinsValue: '5.00',
      carriedOver: 0,
    });

    // Hole 2 should be a tie (carry over)
    expect(response.body.holes['2']).toMatchObject({
      winner: null,
      tied: true,
      tiedScore: 4,
      skinsValue: '5.00',
      carriedOver: 0,
    });
  });

  // GOOD: Integration concern - empty scores state
  test('should handle round with no scores', async () => {
    const response = await request(app)
      .get(`/api/rounds/${round.id}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      roundId: round.id,
      skinsEnabled: true,
      skinsValue: '5.00',
      holes: {},
      playerSummary: expect.any(Object),
      totalCarryOver: expect.any(Number),
    });

    // Verify that moneyIn, moneyOut, and total exist in playerSummary for both players
    expect(response.body.playerSummary[testPlayer1.id]).toHaveProperty('moneyIn');
    expect(response.body.playerSummary[testPlayer1.id]).toHaveProperty('moneyOut');
    expect(response.body.playerSummary[testPlayer1.id]).toHaveProperty('total');
    expect(response.body.playerSummary[testPlayer2.id]).toHaveProperty('moneyIn');
    expect(response.body.playerSummary[testPlayer2.id]).toHaveProperty('moneyOut');
    expect(response.body.playerSummary[testPlayer2.id]).toHaveProperty('total');

    // With no scores, all values should be 0 (no money exchanged)
    expect(response.body.playerSummary[testPlayer1.id].moneyIn).toBe(0);
    expect(response.body.playerSummary[testPlayer1.id].moneyOut).toBe(0);
    expect(response.body.playerSummary[testPlayer1.id].total).toBe(0);
    expect(response.body.playerSummary[testPlayer2.id].moneyIn).toBe(0);
    expect(response.body.playerSummary[testPlayer2.id].moneyOut).toBe(0);
    expect(response.body.playerSummary[testPlayer2.id].total).toBe(0);
  });

  // GOOD: Integration concern - money flow calculation with actual scores
  test('should calculate money flow correctly with scores from database', async () => {
    // Set up scores: Player 1 wins hole 1, Player 2 wins hole 2
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 1, 3], // Hole 1: Player 1 wins
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 1, 4], // Hole 1: Player 2 loses
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 2, 4], // Hole 2: Player 1 loses
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 2, 3], // Hole 2: Player 2 wins
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify money flow calculation
    // Player 1: Won $5 on hole 1 (moneyIn), paid $5 on hole 2 (moneyOut)
    expect(response.body.playerSummary[testPlayer1.id].moneyIn).toBe(5);
    expect(response.body.playerSummary[testPlayer1.id].moneyOut).toBe(-5);
    expect(response.body.playerSummary[testPlayer1.id].total).toBe(0);
    // Player 2: Won $5 on hole 2 (moneyIn), paid $5 on hole 1 (moneyOut)
    expect(response.body.playerSummary[testPlayer2.id].moneyIn).toBe(5);
    expect(response.body.playerSummary[testPlayer2.id].moneyOut).toBe(-5);
    expect(response.body.playerSummary[testPlayer2.id].total).toBe(0);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Missing userId (unit test concern)
  // - Invalid userId format (unit test concern)
  // These are all tested at the service unit test level
});
