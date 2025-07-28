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

describe('DELETE /api/rounds/:id - Integration', () => {
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
      .delete(`/api/rounds/${round.id}`)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();

    const res = await request(app)
      .delete(`/api/rounds/${fakeRoundId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - permission validation (only creator can delete)
  test('should return 403 when user is not the round creator', async () => {
    // Create user who is NOT the creator of the round
    const otherUser = await createTestUser({ prefix: 'outsider' });
    createdUserIds.push(otherUser.user.id);

    const res = await request(app)
      .delete(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Permission denied: Only the round creator can delete the round',
    });
  });

  // GOOD: Integration concern - basic DB deletion
  test('should delete round successfully from database', async () => {
    const response = await request(app)
      .delete(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
    });

    // Verify round is deleted from DB (integration concern)
    const deletedRound = await query('SELECT * FROM rounds WHERE id = $1', [round.id]);
    expect(deletedRound.rows).toHaveLength(0);

    // Remove from cleanup tracking since it's deleted
    createdRoundIds = [];
  });

  // GOOD: Integration concern - CASCADE deletion of related data
  test('should cascade delete all related data when round is deleted', async () => {
    // Set up related data in multiple tables
    const playerId = await query(
      'SELECT id FROM round_players WHERE round_id = $1 LIMIT 1',
      [round.id],
    );
    const playerIdValue = playerId.rows[0].id;

    // Add scores
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, playerIdValue, 1, 4],
    );

    // Add custom pars
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 1, 4, playerIdValue],
    );

    // Add side bet (if table exists)
    let sideBetId = null;
    try {
      const sideBetResult = await query(
        'INSERT INTO side_bets (round_id, name, amount, bet_type, created_by_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [round.id, 'Test Bet', 5.00, 'round', playerIdValue],
      );
      sideBetId = sideBetResult.rows[0].id;
    } catch (error) {
      // Side bets table might not exist yet, skip this test part
    }

    // Verify all related data exists before deletion
    const beforeScores = await query('SELECT * FROM scores WHERE round_id = $1', [round.id]);
    const beforePars = await query('SELECT * FROM round_hole_pars WHERE round_id = $1', [round.id]);
    const beforePlayers = await query('SELECT * FROM round_players WHERE round_id = $1', [round.id]);

    expect(beforeScores.rows.length).toBeGreaterThan(0);
    expect(beforePars.rows.length).toBeGreaterThan(0);
    expect(beforePlayers.rows.length).toBeGreaterThan(0);

    // Delete the round
    await request(app)
      .delete(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify CASCADE deletion worked (critical integration concern)
    const afterScores = await query('SELECT * FROM scores WHERE round_id = $1', [round.id]);
    const afterPars = await query('SELECT * FROM round_hole_pars WHERE round_id = $1', [round.id]);
    const afterPlayers = await query('SELECT * FROM round_players WHERE round_id = $1', [round.id]);

    expect(afterScores.rows).toHaveLength(0);
    expect(afterPars.rows).toHaveLength(0);
    expect(afterPlayers.rows).toHaveLength(0);

    // Check side bet CASCADE if we created one
    if (sideBetId) {
      const afterSideBets = await query('SELECT * FROM side_bets WHERE round_id = $1', [round.id]);
      expect(afterSideBets.rows).toHaveLength(0);
    }

    // Remove from cleanup tracking since it's deleted
    createdRoundIds = [];
  });

  // GOOD: Integration concern - foreign key constraint protection
  test('should handle deletion when round has complex related data structure', async () => {
    // Create a more complex data structure to test FK constraints
    const player2 = await createTestUser({ prefix: 'player2' });
    createdUserIds.push(player2.user.id);

    // Add second player to round
    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, player2.user.id],
    );

    // Get both player IDs
    const players = await query(
      'SELECT id FROM round_players WHERE round_id = $1 ORDER BY joined_at',
      [round.id],
    );
    const player1Id = players.rows[0].id;
    const player2Id = players.rows[1].id;

    // Create cross-referencing data (scores from multiple players, pars set by different players)
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, player1Id, 1, 4],
    );
    await query(
      'INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)',
      [round.id, player2Id, 1, 3],
    );
    await query(
      'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
      [round.id, 1, 4, player1Id],
    );

    // Verify complex structure exists
    const beforeCheck = await query(
      'SELECT COUNT(*) as total FROM scores WHERE round_id = $1',
      [round.id],
    );
    expect(parseInt(beforeCheck.rows[0].total, 10)).toBe(2);

    // Delete should handle all FK constraints properly
    const response = await request(app)
      .delete(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);

    // Verify everything was properly cascaded
    const afterCheck = await query(
      'SELECT COUNT(*) as total FROM scores WHERE round_id = $1',
      [round.id],
    );
    expect(parseInt(afterCheck.rows[0].total, 10)).toBe(0);

    // Remove from cleanup tracking since it's deleted
    createdRoundIds = [];
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // These are all tested at the service unit test level
});
