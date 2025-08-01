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

describe('DELETE /api/rounds/:id/side-bets/:betId - Integration', () => {
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
    const betId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${round.id}/side-bets/${betId}`)
      .expect(401);

    expect(res.body).toMatchObject({
      success: false, message: 'Access token required',
    });
  });

  test('should successfully cancel bet and persist to database', async () => {
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

    // Create a side bet
    const betResult = await query(
      'INSERT INTO side_bets (round_id, name, amount, bet_type, created_by_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [round.id, 'Test Bet', '10.00', 'round', players.rows[0].id],
    );
    const bet = betResult.rows[0];
    createdSideBetIds.push(bet.id);

    // Add participants
    await query(
      'INSERT INTO side_bet_participants (side_bet_id, player_id) VALUES ($1, $2), ($1, $3)',
      [bet.id, players.rows[0].id, players.rows[1].id],
    );

    const res = await request(app)
      .delete(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
    });

    // Verify bet was cancelled in database (integration concern)
    const cancelledBet = await query(
      'SELECT cancelled_at, cancelled_by_id FROM side_bets WHERE id = $1',
      [bet.id],
    );
    expect(cancelledBet.rows).toHaveLength(1);
    expect(cancelledBet.rows[0].cancelled_at).not.toBeNull();
    expect(cancelledBet.rows[0].cancelled_by_id).toBe(players.rows[0].id);
  });

  test('should return 404 when bet does not exist', async () => {
    const fakeBeId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${round.id}/side-bets/${fakeBeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Side bet not found',
    });
  });

  test('should return 404 when bet is already cancelled', async () => {
    // Get player ID
    const players = await query(
      'SELECT id FROM round_players WHERE round_id = $1',
      [round.id],
    );

    // Create a side bet that is already cancelled
    const betResult = await query(
      'INSERT INTO side_bets (round_id, name, amount, bet_type, created_by_id, cancelled_at, cancelled_by_id) VALUES ($1, $2, $3, $4, $5, NOW(), $5) RETURNING *',
      [round.id, 'Cancelled Bet', '10.00', 'round', players.rows[0].id],
    );
    const bet = betResult.rows[0];
    createdSideBetIds.push(bet.id);

    const res = await request(app)
      .delete(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Side bet not found',
    });
  });

  test('should return 403 when user is not participant in round', async () => {
    // Create another user who is NOT in the round
    const otherUser = await createTestUser();
    createdUserIds.push(otherUser.user.id);

    // Get player ID for creating bet
    const players = await query(
      'SELECT id FROM round_players WHERE round_id = $1',
      [round.id],
    );

    // Create a side bet
    const betResult = await query(
      'INSERT INTO side_bets (round_id, name, amount, bet_type, created_by_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [round.id, 'Test Bet', '10.00', 'round', players.rows[0].id],
    );
    const bet = betResult.rows[0];
    createdSideBetIds.push(bet.id);

    const res = await request(app)
      .delete(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'User must be a participant in this round',
    });

    // Verify bet was NOT cancelled
    const unchangedBet = await query(
      'SELECT cancelled_at FROM side_bets WHERE id = $1',
      [bet.id],
    );
    expect(unchangedBet.rows[0].cancelled_at).toBeNull();
  });

  test('should return 404 when round does not exist', async () => {
    const fakeRoundId = chance.guid();
    const betId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${fakeRoundId}/side-bets/${betId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Side bet not found',
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid betId format
  // - Invalid roundId format
  // - Missing betId
  // - Missing roundId
  // These are all tested at the unit level in the service tests
});
