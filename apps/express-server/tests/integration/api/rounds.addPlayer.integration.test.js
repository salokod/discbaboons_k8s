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

describe('POST /api/rounds/:id/players - Integration', () => {
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
    const playerData = {
      players: [{ userId: chance.guid() }],
    };

    await request(app)
      .post(`/api/rounds/${round.id}/players`)
      .send(playerData)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - DB persistence and foreign key validation
  test('should add user player successfully and persist to database', async () => {
    // Create test user directly in DB
    const newUser = await createTestUser({ prefix: 'player' });
    createdUserIds.push(newUser.user.id);

    const response = await request(app)
      .post(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ userId: newUser.user.id }] })
      .expect(201);

    // Verify response structure
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      round_id: round.id,
      user_id: newUser.user.id,
      is_guest: false,
      guest_name: null,
    });

    // Verify DB persistence (integration concern)
    const savedPlayer = await query(
      'SELECT * FROM round_players WHERE round_id = $1 AND user_id = $2',
      [round.id, newUser.user.id],
    );
    expect(savedPlayer.rows).toHaveLength(1);
    expect(savedPlayer.rows[0]).toMatchObject({
      round_id: round.id,
      user_id: newUser.user.id,
      is_guest: false,
    });
  });

  // GOOD: Integration concern - guest player DB persistence
  test('should add guest player successfully and persist to database', async () => {
    const guestName = chance.name();

    const response = await request(app)
      .post(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ guestName }] })
      .expect(201);

    // Verify response structure
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      round_id: round.id,
      user_id: null,
      is_guest: true,
      guest_name: guestName,
    });

    // Verify DB persistence (integration concern)
    const savedPlayer = await query(
      'SELECT * FROM round_players WHERE round_id = $1 AND guest_name = $2',
      [round.id, guestName],
    );
    expect(savedPlayer.rows).toHaveLength(1);
    expect(savedPlayer.rows[0]).toMatchObject({
      round_id: round.id,
      user_id: null,
      is_guest: true,
      guest_name: guestName,
    });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();
    const newUser = await createTestUser({ prefix: 'fake' });
    createdUserIds.push(newUser.user.id);

    const response = await request(app)
      .post(`/api/rounds/${fakeRoundId}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ userId: newUser.user.id }] })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - duplicate player prevention at DB level
  test('should return 409 when user is already a player in the round', async () => {
    const newUser = await createTestUser({ prefix: 'duplicate' });
    createdUserIds.push(newUser.user.id);

    // Add player first time - direct DB setup
    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, newUser.user.id],
    );

    // Try to add same player again via API
    const response = await request(app)
      .post(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ userId: newUser.user.id }] })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: `User ${newUser.user.id} is already a player in this round`,
    });
  });

  // GOOD: Integration concern - permission validation against actual DB
  test('should return 403 when user is not creator or existing player', async () => {
    // Create user who is NOT creator or player in the round
    const otherUser = await createTestUser({ prefix: 'outsider' });
    createdUserIds.push(otherUser.user.id);

    const playerToAdd = await createTestUser({ prefix: 'newplayer' });
    createdUserIds.push(playerToAdd.user.id);

    // Try to add player as non-creator/non-player
    const response = await request(app)
      .post(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send({ players: [{ userId: playerToAdd.user.id }] })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: 'You must be the round creator or a player to add new players',
    });
  });

  // GOOD: Integration concern - batch transaction handling
  test('should add multiple players in single transaction', async () => {
    // Create multiple test users
    const user1 = await createTestUser({ prefix: 'batch1' });
    const user2 = await createTestUser({ prefix: 'batch2' });
    createdUserIds.push(user1.user.id, user2.user.id);

    const guest1Name = chance.name();
    const guest2Name = chance.name();

    const response = await request(app)
      .post(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        players: [
          { userId: user1.user.id },
          { guestName: guest1Name },
          { userId: user2.user.id },
          { guestName: guest2Name },
        ],
      })
      .expect(201);

    // Verify all players were added
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(4);

    // Verify transaction worked: all players exist in DB
    const allPlayers = await query(
      'SELECT * FROM round_players WHERE round_id = $1 ORDER BY joined_at',
      [round.id],
    );
    // Should have creator + 4 new players = 5 total
    expect(allPlayers.rows).toHaveLength(5);

    // Verify user players
    const userPlayers = allPlayers.rows.filter((p) => !p.is_guest && p.user_id !== user.id);
    expect(userPlayers).toHaveLength(2);
    expect(userPlayers.map((p) => p.user_id)).toContain(user1.user.id);
    expect(userPlayers.map((p) => p.user_id)).toContain(user2.user.id);

    // Verify guest players
    const guestPlayers = allPlayers.rows.filter((p) => p.is_guest);
    expect(guestPlayers).toHaveLength(2);
    expect(guestPlayers.map((p) => p.guest_name)).toContain(guest1Name);
    expect(guestPlayers.map((p) => p.guest_name)).toContain(guest2Name);
  });

  // GOOD: Integration concern - transaction rollback on failure
  test('should handle database transaction rollback on error', async () => {
    // Create data that will cause a DB constraint violation
    // Use a very long guest name that exceeds column limit
    const longGuestName = chance.string({ length: 500 }); // Exceeds VARCHAR limit

    await request(app)
      .post(`/api/rounds/${round.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ guestName: longGuestName }] })
      .expect(500); // Database error

    // Verify no partial data was saved (transaction rolled back)
    const allPlayers = await query(
      'SELECT * FROM round_players WHERE round_id = $1',
      [round.id],
    );
    // Should only have the original creator as player
    expect(allPlayers.rows).toHaveLength(1);
    expect(allPlayers.rows[0].user_id).toBe(user.id);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing players array (unit test concern)
  // - Empty players array (unit test concern)
  // - Missing userId and guestName (unit test concern)
  // - Both userId and guestName provided (unit test concern)
  // - Duplicate userId in batch (unit test concern)
  // These are all tested at the service unit test level
});
