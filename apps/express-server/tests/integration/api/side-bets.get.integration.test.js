import 'dotenv/config';
import {
  describe, it, expect, beforeEach, afterEach,
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

describe('GET /api/rounds/:id/side-bets/:betId', () => {
  let user;
  let token;
  let course;
  let round;
  let bet;
  let playerId;
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
    playerId = roundData.player.id;
    createdRoundIds.push(round.id);

    // Create test side bet
    const betResult = await query(
      `INSERT INTO side_bets (round_id, name, description, amount, bet_type, hole_number, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [round.id, `testsbg_${chance.word()}`, chance.sentence(), '10.00', 'hole', 5, playerId],
    );
    bet = { id: betResult.rows[0].id };
    createdSideBetIds.push(bet.id);

    // Add participant to bet
    await query(
      'INSERT INTO side_bet_participants (side_bet_id, player_id) VALUES ($1, $2)',
      [bet.id, playerId],
    );
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

  it('should require authentication', async () => {
    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .expect(401);

    expect(response.body).toEqual({ error: 'Access token required' });
  });

  it('should return 400 for invalid bet ID format', async () => {
    const invalidBetId = 'not-a-valid-uuid';

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${invalidBetId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Invalid bet ID format',
    });
  });

  it('should return 400 for invalid round ID format', async () => {
    const invalidRoundId = 'not-a-valid-uuid';

    const response = await request(app)
      .get(`/api/rounds/${invalidRoundId}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Invalid round ID format',
    });
  });

  it('should return 404 when bet does not exist', async () => {
    const fakeBetId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${fakeBetId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Side bet not found',
    });
  });

  it('should return 403 when user is not round participant', async () => {
    // Create another user who is NOT in the round
    const otherUser = await createTestUser();
    createdUserIds.push(otherUser.user.id);

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      message: 'You must be a participant in this round to view side bets',
    });
  });

  it('should return bet details with participants', async () => {
    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: bet.id,
      roundId: round.id,
      name: expect.stringContaining('testsbg_'),
      amount: '10.00',
      betType: 'hole',
      holeNumber: 5,
      status: 'active',
      participants: expect.arrayContaining([
        expect.objectContaining({
          playerId,
          userId: user.id,
          displayName: user.username,
          isWinner: false,
          wonAt: null,
          declaredById: null,
          betAmount: -10,
        }),
      ]),
    });
  });

  it('should show correct status when bet has winner', async () => {
    // Declare winner
    await query(
      'UPDATE side_bet_participants SET is_winner = true, won_at = NOW(), declared_by_id = $1 WHERE side_bet_id = $2 AND player_id = $3',
      [playerId, bet.id, playerId],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.status).toBe('completed');
    expect(response.body.participants[0]).toMatchObject({
      isWinner: true,
      wonAt: expect.any(String),
      declaredById: playerId,
      betAmount: 0, // Only 1 participant, so no winnings
    });
  });

  it('should include guest players in participants', async () => {
    // Add guest player to round
    const guestResult = await query(
      'INSERT INTO round_players (round_id, is_guest, guest_name) VALUES ($1, $2, $3) RETURNING id',
      [round.id, true, 'Guest Player'],
    );
    const guestPlayerId = guestResult.rows[0].id;

    // Add guest to bet
    await query(
      'INSERT INTO side_bet_participants (side_bet_id, player_id) VALUES ($1, $2)',
      [bet.id, guestPlayerId],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.participants).toHaveLength(2);
    expect(response.body.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          playerId: guestPlayerId,
          userId: null,
          displayName: 'Guest Player',
          betAmount: -10,
        }),
      ]),
    );
  });

  it('should show realistic financial breakdown with multiple participants', async () => {
    // Add two more players to the round
    const player2 = await createTestUser();
    const player3 = await createTestUser();
    createdUserIds.push(player2.user.id, player3.user.id);

    const player2Result = await query(
      'INSERT INTO round_players (round_id, user_id) VALUES ($1, $2) RETURNING id',
      [round.id, player2.user.id],
    );
    const player3Result = await query(
      'INSERT INTO round_players (round_id, user_id) VALUES ($1, $2) RETURNING id',
      [round.id, player3.user.id],
    );

    // Add both new players to the bet (now 3 total participants)
    await query(
      'INSERT INTO side_bet_participants (side_bet_id, player_id) VALUES ($1, $2), ($1, $3)',
      [bet.id, player2Result.rows[0].id, player3Result.rows[0].id],
    );

    // Declare the original player as winner
    await query(
      'UPDATE side_bet_participants SET is_winner = true, won_at = NOW(), declared_by_id = $1 WHERE side_bet_id = $2 AND player_id = $3',
      [playerId, bet.id, playerId],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.status).toBe('completed');
    expect(response.body.participants).toHaveLength(3);

    // Find winner and losers
    const winner = response.body.participants.find((p) => p.isWinner);
    const losers = response.body.participants.filter((p) => !p.isWinner);

    // Winner should get $20 (2 losers × $10 each)
    expect(winner.betAmount).toBe(20);

    // Each loser should owe $10
    losers.forEach((loser) => {
      expect(loser.betAmount).toBe(-10);
    });

    // Verify total balance is zero (no money created/destroyed)
    const totalAmount = response.body.participants.reduce(
      (sum, participant) => sum + participant.betAmount,
      0,
    );
    expect(totalAmount).toBe(0);
  });

  it('should return 400 when bet has no participants', async () => {
    // Remove all participants from the bet
    await query(
      'DELETE FROM side_bet_participants WHERE side_bet_id = $1',
      [bet.id],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Side bet participants not found',
    });
  });

  it('should return 400 when bet has multiple winners', async () => {
    // Add another player to round and bet
    const player2 = await createTestUser();
    createdUserIds.push(player2.user.id);

    const player2Result = await query(
      'INSERT INTO round_players (round_id, user_id) VALUES ($1, $2) RETURNING id',
      [round.id, player2.user.id],
    );

    await query(
      'INSERT INTO side_bet_participants (side_bet_id, player_id) VALUES ($1, $2)',
      [bet.id, player2Result.rows[0].id],
    );

    // Set BOTH participants as winners (data corruption scenario)
    await query(
      'UPDATE side_bet_participants SET is_winner = true, won_at = NOW(), declared_by_id = $1 WHERE side_bet_id = $2',
      [playerId, bet.id],
    );

    const response = await request(app)
      .get(`/api/rounds/${round.id}/side-bets/${bet.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Side bet cannot have multiple winners',
    });
  });
});
