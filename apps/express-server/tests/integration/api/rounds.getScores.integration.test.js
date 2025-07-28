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

describe('GET /api/rounds/:id/scores - Integration', () => {
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

    // Add a guest player directly in DB for speed
    const guestName = chance.name();
    const guestResult = await query(
      'INSERT INTO round_players (round_id, guest_name, is_guest) VALUES ($1, $2, true) RETURNING *',
      [round.id, guestName],
    );
    [testPlayer2] = guestResult.rows;
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
      .get(`/api/rounds/${round.id}/scores`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();

    const res = await request(app)
      .get(`/api/rounds/${fakeRoundId}/scores`)
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
      .get(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You must be a participant in this round to view scores',
    });
  });

  // GOOD: Integration concern - JOIN with users table and empty state
  test('should return empty scorecard with player data from database JOIN', async () => {
    const response = await request(app)
      .get(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify JOIN with users table worked for registered user
    expect(response.body[testPlayer1.id]).toMatchObject({
      username: user.username, // Integration: Verifies JOIN with users table
      guestName: null,
      isGuest: false,
      holes: {},
      total: 0,
      totalPar: 0,
      relativeScore: 0,
    });

    // Verify guest player data
    expect(response.body[testPlayer2.id]).toMatchObject({
      username: null,
      guestName: expect.any(String), // Integration: Guest name from DB
      isGuest: true,
      holes: {},
      total: 0,
      totalPar: 0,
      relativeScore: 0,
    });
  });

  // GOOD: Integration concern - complex business logic with multiple DB queries
  test('should return scores with dynamic par lookup and calculations from database', async () => {
    // Get player IDs for foreign key constraints
    const playerResult = await query(
      'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
      [round.id, user.id],
    );
    const playerId = playerResult.rows[0].id;

    // Set custom pars directly in DB for speed
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 1, 4, playerId],
    );
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 2, 5, playerId],
    );

    // Submit scores directly in DB for speed
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 1, 3],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 2, 6],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer1.id, 3, 4],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 1, 5],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, testPlayer2.id, 2, 4],
    );

    // Get scores via API
    const response = await request(app)
      .get(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify complex business logic combining scores, pars, and calculations
    expect(response.body[testPlayer1.id]).toMatchObject({
      username: user.username,
      isGuest: false,
      holes: {
        1: { strokes: 3, par: 4, relative: -1 }, // Custom par from DB
        2: { strokes: 6, par: 5, relative: 1 }, // Custom par from DB
        3: { strokes: 4, par: 3, relative: 1 }, // Default par (3)
      },
      total: 13, // Sum of strokes
      totalPar: 12, // Sum of pars (custom + default)
      relativeScore: 1, // Total - totalPar
    });

    // Guest player with partial scores
    expect(response.body[testPlayer2.id]).toMatchObject({
      guestName: expect.any(String),
      isGuest: true,
      holes: {
        1: { strokes: 5, par: 4, relative: 1 },
        2: { strokes: 4, par: 5, relative: -1 },
        // No hole 3 score
      },
      total: 9,
      totalPar: 9,
      relativeScore: 0,
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Missing requestingUserId (unit test concern)
  // - Invalid requestingUserId format (unit test concern)
  // These are all tested at the service unit test level
});
