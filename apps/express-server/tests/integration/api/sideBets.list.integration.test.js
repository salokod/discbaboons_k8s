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

describe('GET /api/rounds/:id/side-bets - Integration', () => {
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

  test('should require authentication', async () => {
    const res = await request(app)
      .get(`/api/rounds/${round.id}/side-bets`)
      .expect(401);

    expect(res.body).toMatchObject({
      success: false, message: 'Access token required',
    });
  });

  test('should return empty list when no side bets exist', async () => {
    const res = await request(app)
      .get(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      roundId: round.id,
      sideBets: [],
      playerSummary: expect.any(Array),
    });

    // Should include round players in summary even with no bets
    expect(res.body.playerSummary).toHaveLength(1);
    expect(res.body.playerSummary[0]).toMatchObject({
      userId: user.id,
      displayName: expect.any(String),
      moneyIn: '0.00',
      moneyOut: '0.00',
      total: '0.00',
      betCount: 0,
    });
  });

  test('should return side bets with participants and money calculations', async () => {
    // Create another user and add to round
    const player2 = await createTestUser();
    createdUserIds.push(player2.user.id);

    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, player2.user.id],
    );

    // Get player IDs
    const players = await query(
      'SELECT id, user_id FROM round_players WHERE round_id = $1 ORDER BY user_id',
      [round.id],
    );

    const player1Id = players.rows.find((p) => p.user_id === user.id).id;
    const player2Id = players.rows.find((p) => p.user_id === player2.user.id).id;

    // Create a side bet with both participants
    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: 15.50,
      betType: 'hole',
      holeNumber: 5,
      participants: [player1Id, player2Id],
    };

    const createRes = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(201);

    createdSideBetIds.push(createRes.body.id);

    // Now test the list endpoint
    const res = await request(app)
      .get(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      roundId: round.id,
      sideBets: expect.any(Array),
      playerSummary: expect.any(Array),
    });

    expect(res.body.sideBets).toHaveLength(1);
    const sideBet = res.body.sideBets[0];

    expect(sideBet).toMatchObject({
      id: createRes.body.id,
      name: betData.name,
      amount: '15.50',
      betType: 'hole',
      holeNumber: 5,
      status: 'active',
      participants: expect.any(Array),
    });

    expect(sideBet.participants).toHaveLength(2);
    expect(sideBet.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          playerId: player1Id,
          userId: user.id,
          displayName: expect.any(String),
        }),
        expect.objectContaining({
          playerId: player2Id,
          userId: player2.user.id,
          displayName: expect.any(String),
        }),
      ]),
    );

    // Check player summaries
    expect(res.body.playerSummary).toHaveLength(2);
    res.body.playerSummary.forEach((player) => {
      expect(player).toMatchObject({
        playerId: expect.any(String),
        userId: expect.any(Number),
        displayName: expect.any(String),
        moneyIn: '0.00',
        moneyOut: '15.50', // Both players have money at risk
        total: '-15.50',
        betCount: 1, // Both players are in 1 active bet
      });
    });
  });

  test('should return 403 when user is not participant in round', async () => {
    // Create another user who is NOT in the round
    const otherUser = await createTestUser();
    createdUserIds.push(otherUser.user.id);

    const res = await request(app)
      .get(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You must be a participant in this round to view side bets',
    });
  });

  test('should return 404 for non-existent round', async () => {
    const fakeRoundId = chance.guid();

    const res = await request(app)
      .get(`/api/rounds/${fakeRoundId}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  test('should handle cancelled bets correctly', async () => {
    // Create another user and add to round for minimum 2 participants
    const player2 = await createTestUser();
    createdUserIds.push(player2.user.id);

    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, player2.user.id],
    );

    // Get both player IDs
    const players = await query(
      'SELECT id FROM round_players WHERE round_id = $1 ORDER BY id',
      [round.id],
    );

    const betData = {
      name: 'Test Cancelled Bet',
      amount: 20.00,
      betType: 'round',
      participants: [players.rows[0].id, players.rows[1].id], // Need at least 2 participants
    };

    const createRes = await request(app)
      .post(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .send(betData)
      .expect(201);

    createdSideBetIds.push(createRes.body.id);

    // Cancel the bet directly in database
    await query(
      'UPDATE side_bets SET cancelled_at = NOW(), cancelled_by_id = $1 WHERE id = $2',
      [players.rows[0].id, createRes.body.id],
    );

    // Test the list endpoint
    const res = await request(app)
      .get(`/api/rounds/${round.id}/side-bets`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.sideBets).toHaveLength(1);
    expect(res.body.sideBets[0]).toMatchObject({
      id: createRes.body.id,
      status: 'cancelled',
      cancelledAt: expect.any(String),
      cancelledById: expect.any(String),
    });

    // Cancelled bets should not contribute to moneyOut or betCount
    expect(res.body.playerSummary[0]).toMatchObject({
      moneyIn: '0.00',
      moneyOut: '0.00',
      total: '0.00',
      betCount: 0,
    });
  });
});
