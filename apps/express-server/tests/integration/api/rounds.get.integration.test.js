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

describe('GET /api/rounds/:id - Integration', () => {
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

    // Small delay to ensure FK references are fully committed
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Create test round with user as creator
    const roundData = await createTestRound(user.id, course.id);
    round = roundData.round;
    createdRoundIds.push(round.id);
  });

  afterEach(async () => {
    // Clean up in reverse order for foreign key constraints
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware
  test('should require authentication', async () => {
    await request(app)
      .get(`/api/rounds/${round.id}`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();

    const res = await request(app)
      .get(`/api/rounds/${fakeRoundId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - permission validation (only participants can view)
  test('should return 403 when user is not participant in round', async () => {
    // Create a round by another user where current user is NOT a participant
    const otherUser = await createTestUser({ prefix: 'other' });
    createdUserIds.push(otherUser.user.id);

    const otherRound = await createTestRound(otherUser.user.id, course.id);
    createdRoundIds.push(otherRound.round.id);

    const res = await request(app)
      .get(`/api/rounds/${otherRound.round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You must be a participant in this round to view details',
    });
  });

  // GOOD: Integration concern - basic round data from database
  test('should return round details with player data from database', async () => {
    const response = await request(app)
      .get(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify basic round data structure
    expect(response.body).toMatchObject({
      id: round.id,
      name: round.name,
      status: round.status,
      starting_hole: round.starting_hole,
      is_private: round.is_private,
      skins_enabled: round.skins_enabled,
      created_at: expect.any(String),
      updated_at: expect.any(String),

      // Complex business logic aggregation
      players: expect.any(Array),
      pars: expect.any(Object),
    });

    // Verify players array includes JOINed user data
    expect(response.body.players).toHaveLength(1);
    expect(response.body.players[0]).toMatchObject({
      id: expect.any(String),
      user_id: user.id,
      username: user.username, // JOIN with users table
      is_guest: false,
      joined_at: expect.any(String),
    });
  });

  // GOOD: Integration concern - custom pars from database
  test('should return custom pars from database when set', async () => {
    // Set up custom par for hole 1
    const playerId = await query(
      'SELECT id FROM round_players WHERE round_id = $1 LIMIT 1',
      [round.id],
    );
    const playerIdValue = playerId.rows[0].id;

    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 1, 5, playerIdValue],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify custom pars are returned from DB
    expect(response.body.pars).toHaveProperty('1', 5);
    expect(typeof response.body.pars).toBe('object');
  });

  // GOOD: Integration concern - participant access validation
  test('should allow access when user is added as participant', async () => {
    // Create another user and add them as participant
    const participant = await createTestUser({ prefix: 'participant' });
    createdUserIds.push(participant.user.id);

    // Add user as participant to the round
    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, participant.user.id],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${participant.token}`)
      .expect(200);

    // Integration: Verify participant access works
    expect(response.body).toMatchObject({
      id: round.id,
      players: expect.any(Array),
      pars: expect.any(Object),
    });

    // Should see both participants
    expect(response.body.players).toHaveLength(2);
  });

  // GOOD: Integration concern - guest player data handling
  test('should properly handle guest players in JOINed player data', async () => {
    // Add a guest player directly in DB
    const guestName = chance.name();
    await query(
      'INSERT INTO round_players (round_id, guest_name, is_guest) VALUES ($1, $2, true)',
      [round.id, guestName],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify guest player data structure
    expect(response.body.players).toHaveLength(2);

    const guestPlayer = response.body.players.find((p) => p.is_guest === true);
    expect(guestPlayer).toMatchObject({
      id: expect.any(String),
      user_id: null, // NULL for guests
      username: null, // NULL for guests
      guest_name: guestName,
      is_guest: true,
      joined_at: expect.any(String),
    });
  });

  // GOOD: Integration concern - round status impact on data
  test('should return consistent data regardless of round status', async () => {
    // Update round status directly in DB
    await query(
      'UPDATE rounds SET status = $1 WHERE id = $2',
      ['completed', round.id],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Integration: Verify completed round still returns full data
    expect(response.body).toMatchObject({
      id: round.id,
      status: 'completed',
      players: expect.any(Array),
      pars: expect.any(Object),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // These are all tested at the service unit test level
});
