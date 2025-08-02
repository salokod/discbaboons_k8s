import {
  describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { query } from './setup.js';
import {
  createTestUser,
  createTestCourse,
  cleanupUsers,
  cleanupCourses,
} from './test-helpers.js';

let testUser;
let testToken;
let testCourse;
let testRoundId;
let testPlayerId;
let testGuestPlayerId;
let createdUserIds = [];
let createdCourseIds = [];
let createdRoundIds = [];

describe('POST /api/rounds/:id/complete', () => {
  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Create test user and token
    const userResult = await createTestUser();
    testUser = userResult.user;
    testToken = userResult.token;
    createdUserIds.push(testUser.id);

    // Create test course
    testCourse = await createTestCourse();
    createdCourseIds.push(testCourse.id);

    // Create test round in progress
    const roundResult = await query(
      `INSERT INTO rounds (course_id, name, starting_hole, created_by_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [testCourse.id, 'Test Round', 1, testUser.id, 'in_progress'],
    );
    testRoundId = roundResult.rows[0].id;
    createdRoundIds.push(testRoundId);

    // Add creator as player
    const playerResult = await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, $3) RETURNING id',
      [testRoundId, testUser.id, false],
    );
    testPlayerId = playerResult.rows[0].id;

    // Add guest player
    const guestPlayerResult = await query(
      'INSERT INTO round_players (round_id, guest_name, is_guest) VALUES ($1, $2, $3) RETURNING id',
      [testRoundId, 'Guest Player', true],
    );
    testGuestPlayerId = guestPlayerResult.rows[0].id;

    // Set up pars for all 18 holes (par 4 each)
    const parInserts = Array.from({ length: 18 }, (_, i) => `($1, ${i + 1}, 4, $2)`).join(', ');
    await query(
      `INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ${parInserts}`,
      [testRoundId, testPlayerId],
    );

    // Add scores for all holes for both players
    const scoreInserts = [];
    const scoreParams = [testRoundId];
    let paramIndex = 2;

    Array.from({ length: 18 }, (_, hole) => {
      // User scores (par)
      scoreInserts.push(`($1, $${paramIndex}, ${hole + 1}, $${paramIndex + 1})`);
      scoreParams.push(testPlayerId, 4);
      paramIndex += 2;

      // Guest scores (bogey)
      scoreInserts.push(`($1, $${paramIndex}, ${hole + 1}, $${paramIndex + 1})`);
      scoreParams.push(testGuestPlayerId, 5);
      paramIndex += 2;

      return null; // Satisfy eslint array-callback-return rule
    });

    await query(
      `INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ${scoreInserts.join(', ')}`,
      scoreParams,
    );
  });

  afterEach(async () => {
    // Clean up in reverse FK order
    if (testRoundId) {
      await query('DELETE FROM scores WHERE round_id = $1', [testRoundId]);
      await query('DELETE FROM round_hole_pars WHERE round_id = $1', [testRoundId]);
      await query('DELETE FROM round_players WHERE round_id = $1', [testRoundId]);
      await query('DELETE FROM rounds WHERE id = $1', [testRoundId]);
    }
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  it('should complete round when user is participant and all scores are submitted', async () => {
    const response = await request(app)
      .post(`/api/rounds/${testRoundId}/complete`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      round: expect.objectContaining({
        id: testRoundId,
        status: 'completed',
        updated_at: expect.any(String),
      }),
    });

    // Verify round status in database
    const updatedRoundResult = await query(
      'SELECT status, updated_at FROM rounds WHERE id = $1',
      [testRoundId],
    );
    expect(updatedRoundResult.rows[0].status).toBe('completed');
    expect(updatedRoundResult.rows[0].updated_at).toBeTruthy();
  });

  it('should return 404 for non-existent round', async () => {
    const nonExistentRoundId = '12345678-1234-1234-8abc-123456789abc';

    const response = await request(app)
      .post(`/api/rounds/${nonExistentRoundId}/complete`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Round not found',
    });
  });

  it('should return 403 when user is not a participant', async () => {
    // Create different user
    const otherUserResult = await createTestUser({ prefix: 'otheruser' });
    createdUserIds.push(otherUserResult.user.id);

    const response = await request(app)
      .post(`/api/rounds/${testRoundId}/complete`)
      .set('Authorization', `Bearer ${otherUserResult.token}`)
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      message: 'Permission denied: You are not a participant in this round',
    });
  });

  it('should return 400 when round is not in progress', async () => {
    // Mark round as completed
    await query(
      'UPDATE rounds SET status = $1 WHERE id = $2',
      ['completed', testRoundId],
    );

    const response = await request(app)
      .post(`/api/rounds/${testRoundId}/complete`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Round must be in progress to be completed',
    });
  });

  it('should return 400 when not all players have completed scoring', async () => {
    // Remove one score to make the round incomplete
    await query(
      'DELETE FROM scores WHERE round_id = $1 AND player_id = $2 AND hole_number = $3',
      [testRoundId, testPlayerId, 18],
    );

    const response = await request(app)
      .post(`/api/rounds/${testRoundId}/complete`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'All players must complete scoring before the round can be completed',
    });
  });

  it('should return 400 for invalid UUID format', async () => {
    const response = await request(app)
      .post('/api/rounds/invalid-uuid/complete')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Round ID must be a valid UUID',
    });
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .post(`/api/rounds/${testRoundId}/complete`)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: 'Access token required',
    });
  });
});
