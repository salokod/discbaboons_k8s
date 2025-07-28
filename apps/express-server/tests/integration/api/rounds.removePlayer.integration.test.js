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

describe('DELETE /api/rounds/:id/players/:playerId - Integration', () => {
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
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware
  test('should require authentication', async () => {
    const playerId = chance.guid();

    await request(app)
      .delete(`/api/rounds/${round.id}/players/${playerId}`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();
    const playerId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${fakeRoundId}/players/${playerId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - player validation against actual DB
  test('should return 404 when player does not exist in round', async () => {
    const fakePlayerId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${round.id}/players/${fakePlayerId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Player not found in this round',
    });
  });

  // GOOD: Integration concern - creator permission and DB deletion
  test('should allow creator to remove any player and delete from database', async () => {
    // Create and add a player to the round
    const playerUser = await createTestUser({ prefix: 'removeme' });
    createdUserIds.push(playerUser.user.id);

    // Add player directly in DB
    const playerResult = await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false) RETURNING *',
      [round.id, playerUser.user.id],
    );
    const playerId = playerResult.rows[0].id;

    // Verify player exists before removal
    const beforeRemoval = await query(
      'SELECT * FROM round_players WHERE id = $1',
      [playerId],
    );
    expect(beforeRemoval.rows).toHaveLength(1);

    // Creator removes the player
    const res = await request(app)
      .delete(`/api/rounds/${round.id}/players/${playerId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
    });

    // Verify player was deleted from DB (integration concern)
    const afterRemoval = await query(
      'SELECT * FROM round_players WHERE id = $1',
      [playerId],
    );
    expect(afterRemoval.rows).toHaveLength(0);
  });

  // GOOD: Integration concern - player can remove themselves
  test('should allow player to remove themselves from round', async () => {
    // Create player and add to round
    const playerUser = await createTestUser({ prefix: 'removemyself' });
    createdUserIds.push(playerUser.user.id);

    // Add player directly in DB
    const playerResult = await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false) RETURNING *',
      [round.id, playerUser.user.id],
    );
    const playerId = playerResult.rows[0].id;

    // Player removes themselves
    const res = await request(app)
      .delete(`/api/rounds/${round.id}/players/${playerId}`)
      .set('Authorization', `Bearer ${playerUser.token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
    });

    // Verify player was deleted from DB
    const afterRemoval = await query(
      'SELECT * FROM round_players WHERE id = $1',
      [playerId],
    );
    expect(afterRemoval.rows).toHaveLength(0);
  });

  // GOOD: Integration concern - permission validation against actual DB
  test('should return 403 when user is neither creator nor the player being removed', async () => {
    // Create two additional users
    const playerUser = await createTestUser({ prefix: 'player' });
    const otherUser = await createTestUser({ prefix: 'other' });
    createdUserIds.push(playerUser.user.id, otherUser.user.id);

    // Add player to round
    const playerResult = await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false) RETURNING *',
      [round.id, playerUser.user.id],
    );
    const playerId = playerResult.rows[0].id;

    // Other user (not creator, not the player) tries to remove player
    const res = await request(app)
      .delete(`/api/rounds/${round.id}/players/${playerId}`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You can only remove yourself or you must be the round creator',
    });

    // Verify player was NOT deleted from DB
    const afterAttempt = await query(
      'SELECT * FROM round_players WHERE id = $1',
      [playerId],
    );
    expect(afterAttempt.rows).toHaveLength(1);
  });

  // GOOD: Integration concern - guest player removal and DB constraints
  test('should allow creator to remove guest player from database', async () => {
    const guestName = chance.name();

    // Add guest player directly in DB
    const playerResult = await query(
      'INSERT INTO round_players (round_id, guest_name, is_guest) VALUES ($1, $2, true) RETURNING *',
      [round.id, guestName],
    );
    const playerId = playerResult.rows[0].id;

    // Creator removes the guest player
    const res = await request(app)
      .delete(`/api/rounds/${round.id}/players/${playerId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
    });

    // Verify guest player was deleted from DB
    const afterRemoval = await query(
      'SELECT * FROM round_players WHERE id = $1',
      [playerId],
    );
    expect(afterRemoval.rows).toHaveLength(0);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format for roundId (unit test concern)
  // - Missing playerId (unit test concern)
  // - Invalid UUID format for playerId (unit test concern)
  // - Missing requestingUserId (unit test concern)
  // - Invalid requestingUserId format (unit test concern)
  // These are all tested at the service unit test level
});
