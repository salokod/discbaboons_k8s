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

describe('POST /api/rounds/:id/side-bets - Integration', () => {
  let user;
  let token;
  let course;
  let round;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];
  let createdSideBetIds = [];

  beforeEach(async () => {
    // Reset arrays
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];
    createdSideBetIds = [];

    // Use test helpers for direct DB setup
    const testUser = await createTestUser();
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);

    // Create test course
    course = await createTestCourse();
    createdCourseIds.push(course.id);

    // Create test round with user as participant
    const roundData = await createTestRound(user.id, course.id);
    round = roundData.round;
    createdRoundIds.push(round.id);
  });

  afterEach(async () => {
    // Clean up in reverse order due to foreign key constraints
    if (createdSideBetIds.length > 0) {
      await query('DELETE FROM side_bet_participants WHERE side_bet_id = ANY($1)', [createdSideBetIds]);
      await query('DELETE FROM side_bets WHERE id = ANY($1)', [createdSideBetIds]);
    }
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concerns only
  test('should require authentication', async () => {
    const betType = chance.pickone(['hole', 'round']);
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType,
      ...(betType === 'hole' && { holeNumber: chance.integer({ min: 1, max: 18 }) }),
    };

    const res = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .send(betData)
      .expect(401);

    expect(res.body).toMatchObject({
      success: false, message: 'Access token required',
    });
  });

  test('should create hole bet successfully and persist to database', async () => {
    // Create another user and add to round
    const player2 = await createTestUser();
    createdUserIds.push(player2.user.id);

    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, player2.user.id],
    );

    // Get player IDs
    const players = await query(
      'SELECT id FROM round_players WHERE round_id = $1',
      [round.id],
    );

    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'hole',
      description: chance.sentence(),
      holeNumber: chance.integer({ min: 1, max: course.hole_count }),
      participants: players.rows.map((p) => p.id), // Include all players
    };

    const res = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(201);

    // Verify response structure
    expect(res.body).toMatchObject({
      id: expect.any(String),
      round_id: round.id,
      name: betData.name,
      amount: expect.any(String),
      bet_type: betData.betType,
      hole_number: betData.holeNumber,
    });

    // Track for cleanup
    createdSideBetIds.push(res.body.id);

    // Verify DB persistence (integration concern)
    const savedBet = await query('SELECT * FROM side_bets WHERE id = $1', [res.body.id]);
    expect(savedBet.rows).toHaveLength(1);

    // Verify all participants were added
    const participants = await query('SELECT * FROM side_bet_participants WHERE side_bet_id = $1', [res.body.id]);
    expect(participants.rows).toHaveLength(2); // Both players added
  });

  test('should create round bet successfully and persist to database', async () => {
    // Create another user and add to round
    const player2 = await createTestUser();
    createdUserIds.push(player2.user.id);

    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, player2.user.id],
    );

    // Get player IDs
    const players = await query(
      'SELECT id FROM round_players WHERE round_id = $1',
      [round.id],
    );

    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      description: chance.sentence(),
      participants: players.rows.map((p) => p.id), // Include all players
    };

    const res = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      round_id: round.id,
      name: betData.name,
      bet_type: 'round',
      hole_number: null,
    });

    // Track for cleanup
    createdSideBetIds.push(res.body.id);
  });

  test('should return 403 when round does not exist (user not participant)', async () => {
    const fakeRoundId = chance.guid();
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
    };

    const res = await request(app)
      .post(`/api/rounds/${fakeRoundId}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'User must be a participant in this round',
    });
  });

  test('should return 403 when user is not participant in round', async () => {
    // Create another user who is NOT in the round
    const otherUser = await createTestUser();
    createdUserIds.push(otherUser.user.id);

    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
    };

    const res = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send(betData)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'User must be a participant in this round',
    });
  });

  test('should create bet with specific participants successfully', async () => {
    // Create additional users and add them to the round
    const player2 = await createTestUser();
    const player3 = await createTestUser();
    createdUserIds.push(player2.user.id, player3.user.id);

    // Add players to the round
    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false), ($1, $3, false)',
      [round.id, player2.user.id, player3.user.id],
    );

    // Get player IDs for the round
    const players = await query(
      'SELECT id, user_id FROM round_players WHERE round_id = $1 ORDER BY user_id',
      [round.id],
    );

    const creatorPlayerId = players.rows.find((p) => p.user_id === user.id).id;
    const player2Id = players.rows.find((p) => p.user_id === player2.user.id).id;
    const player3Id = players.rows.find((p) => p.user_id === player3.user.id).id;

    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: [creatorPlayerId, player2Id, player3Id],
    };

    const res = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(201);

    // Track for cleanup
    createdSideBetIds.push(res.body.id);

    // Verify all 3 participants were added to the database
    const participants = await query(
      'SELECT player_id FROM side_bet_participants WHERE side_bet_id = $1 ORDER BY player_id',
      [res.body.id],
    );

    expect(participants.rows).toHaveLength(3);
    const participantIds = participants.rows.map((p) => p.player_id);
    expect(participantIds).toContain(creatorPlayerId);
    expect(participantIds).toContain(player2Id);
    expect(participantIds).toContain(player3Id);
  });

  test('should return 400 when participants array contains invalid player ID', async () => {
    // Get the real player ID for the first participant
    const realPlayer = await query(
      'SELECT id FROM round_players WHERE round_id = $1 LIMIT 1',
      [round.id],
    );
    const fakePlayerId = chance.guid();

    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: [realPlayer.rows[0].id, fakePlayerId], // 1 real, 1 fake
    };

    const res = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'All participants must be players in this round',
    });

    // Verify no bet was created (transaction rolled back)
    const bets = await query('SELECT * FROM side_bets WHERE round_id = $1', [round.id]);
    expect(bets.rows).toHaveLength(0);
  });

  test('should handle database transaction rollback on error', async () => {
    // Create another user and add to round for minimum 2 participants
    const player2 = await createTestUser();
    createdUserIds.push(player2.user.id);

    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, player2.user.id],
    );

    // Get player IDs for participants
    const players = await query(
      'SELECT id FROM round_players WHERE round_id = $1',
      [round.id],
    );

    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'round',
      participants: players.rows.map((p) => p.id), // Valid participants
    };

    // Mock a database error by attempting to create with very long name that exceeds DB limit
    const longNameBet = {
      ...betData,
      name: chance.string({ length: 300 }), // Exceeds VARCHAR(200)
    };

    await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(longNameBet)
      .expect(500); // Database error

    // Verify no partial data was saved (transaction rolled back)
    const bets = await query('SELECT * FROM side_bets WHERE round_id = $1', [round.id]);
    expect(bets.rows).toHaveLength(0);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing name
  // - Missing amount
  // - Invalid betType
  // - Missing holeNumber for hole bets
  // - Negative amounts
  // These are all tested at the unit level in the service tests
});
