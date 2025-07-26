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

describe('GET /api/rounds/:id/pars - Integration', () => {
  let user;
  let token;
  let course;
  let round;
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
    createdRoundIds.push(round.id);
  });

  afterEach(async () => {
    // Clean up in reverse order for foreign key constraints
    await query('DELETE FROM round_hole_pars WHERE round_id = ANY($1)', [createdRoundIds]);
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware
  test('should require authentication', async () => {
    await request(app)
      .get(`/api/rounds/${round.id}/pars`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - empty state from database
  test('should return empty object when no pars have been set in database', async () => {
    const response = await request(app)
      .get(`/api/rounds/${round.id}/pars`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({});
  });

  // GOOD: Integration concern - DB query and data transformation
  test('should return pars with correct format from database query', async () => {
    // Get player ID for foreign key constraint
    const playerResult = await query(
      'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
      [round.id, user.id],
    );
    const playerId = playerResult.rows[0].id;

    // Set pars directly in DB for speed
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 1, 3, playerId],
    );
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 3, 4, playerId],
    );
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 7, 5, playerId],
    );

    // Get all pars via API
    const response = await request(app)
      .get(`/api/rounds/${round.id}/pars`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify data transformation: array to object with hole numbers as keys
    expect(response.body).toEqual({
      1: 3,
      3: 4,
      7: 5,
    });
  });

  // GOOD: Integration concern - database ordering
  test('should return pars ordered by hole number from database', async () => {
    const playerResult = await query(
      'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
      [round.id, user.id],
    );
    const playerId = playerResult.rows[0].id;

    // Insert holes in non-sequential order
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 5, 4, playerId],
    );
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 2, 3, playerId],
    );
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 9, 5, playerId],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/pars`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify object keys reflect proper ordering (integration: ORDER BY hole_number)
    const holes = Object.keys(response.body).map(Number);
    expect(holes).toEqual([2, 5, 9]); // Should be ordered by hole_number
    expect(response.body).toEqual({
      2: 3,
      5: 4,
      9: 5,
    });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${fakeRoundId}/pars`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - permission validation against actual DB
  test('should return 403 when user is not participant in round', async () => {
    // Create user who is NOT a participant in the round
    const otherUser = await createTestUser({ prefix: 'outsider' });
    createdUserIds.push(otherUser.user.id);

    const response = await request(app)
      .get(`/api/rounds/${round.id}/pars`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Permission denied: User is not a participant in this round',
    });
  });

  // GOOD: Integration concern - participant can view pars
  test('should allow existing participant to view pars', async () => {
    // Add another user as participant
    const participantUser = await createTestUser({ prefix: 'participant' });
    createdUserIds.push(participantUser.user.id);

    // Add user as participant directly in DB
    const participantResult = await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false) RETURNING *',
      [round.id, participantUser.user.id],
    );
    const participantPlayerId = participantResult.rows[0].id;

    // Set a par as the participant
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 1, 4, participantPlayerId],
    );

    // Participant should be able to view pars
    const response = await request(app)
      .get(`/api/rounds/${round.id}/pars`)
      .set('Authorization', `Bearer ${participantUser.token}`)
      .expect(200);

    expect(response.body).toEqual({
      1: 4,
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Missing requestingUserId (unit test concern)
  // - Invalid requestingUserId format (unit test concern)
  // These are all tested at the service unit test level
});
