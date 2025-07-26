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

describe('GET /api/rounds/:id/players - Integration', () => {
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
    await request(app)
      .get(`/api/rounds/${round.id}/players`)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();

    const res = await request(app)
      .get(`/api/rounds/${fakeRoundId}/players`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - permission validation against actual DB
  test('should return 403 when user is not creator or player', async () => {
    // Create user who is NOT creator or player in the round
    const otherUser = await createTestUser({ prefix: 'outsider' });
    createdUserIds.push(otherUser.user.id);

    const res = await request(app)
      .get(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You must be the round creator or a player to view players',
    });
  });

  // GOOD: Integration concern - DB query with JOIN for player details
  test('should return creator player with username from database JOIN', async () => {
    const res = await request(app)
      .get(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: expect.any(String),
      round_id: round.id,
      user_id: user.id,
      username: user.username, // Integration: Verifies JOIN with users table works
      is_guest: false,
      guest_name: null,
      joined_at: expect.any(String),
    });
  });

  // GOOD: Integration concern - multiple player types with correct JOIN data
  test('should return all player types ordered by joined_at from database', async () => {
    // Add different types of players directly to DB for speed
    const user2 = await createTestUser({ prefix: 'player2' });
    createdUserIds.push(user2.user.id);

    const guestName1 = chance.name();
    const guestName2 = chance.name();

    // Insert players directly in DB with known order
    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest, joined_at) VALUES ($1, $2, false, NOW() + INTERVAL \'1 second\')',
      [round.id, user2.user.id],
    );
    await query(
      'INSERT INTO round_players (round_id, guest_name, is_guest, joined_at) VALUES ($1, $2, true, NOW() + INTERVAL \'2 seconds\')',
      [round.id, guestName1],
    );
    await query(
      'INSERT INTO round_players (round_id, guest_name, is_guest, joined_at) VALUES ($1, $2, true, NOW() + INTERVAL \'3 seconds\')',
      [round.id, guestName2],
    );

    const res = await request(app)
      .get(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(4); // Creator + 1 user + 2 guests

    // Verify JOIN worked for user players (username populated)
    const userPlayers = res.body.filter((p) => !p.is_guest);
    expect(userPlayers).toHaveLength(2);
    userPlayers.forEach((player) => {
      expect(player.username).toBeTruthy();
      expect(player.user_id).toBeTruthy();
      expect(player.guest_name).toBeNull();
    });

    // Verify guest players (no username from JOIN)
    const guestPlayers = res.body.filter((p) => p.is_guest);
    expect(guestPlayers).toHaveLength(2);
    guestPlayers.forEach((player) => {
      expect(player.username).toBeNull();
      expect(player.user_id).toBeNull();
      expect(player.guest_name).toBeTruthy();
    });

    // Verify ordering by joined_at (integration concern)
    expect(res.body[0].user_id).toBe(user.id); // Creator first
    expect(res.body[1].user_id).toBe(user2.user.id); // User player second
    expect(res.body[2].guest_name).toBe(guestName1); // First guest
    expect(res.body[3].guest_name).toBe(guestName2); // Second guest
  });

  // GOOD: Integration concern - existing player can view (permission validation)
  test('should allow existing player to view players list', async () => {
    // Create another user and add them as a player
    const playerUser = await createTestUser({ prefix: 'player' });
    createdUserIds.push(playerUser.user.id);

    // Add user as player directly in DB
    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, playerUser.user.id],
    );

    // Player should be able to view players list
    const res = await request(app)
      .get(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${playerUser.token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2); // Creator + added player

    // Verify player can see all players
    const userIds = res.body.map((p) => p.user_id);
    expect(userIds).toContain(user.id); // Creator
    expect(userIds).toContain(playerUser.user.id); // Added player
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Missing userId (unit test concern)
  // These are all tested at the service unit test level
});
