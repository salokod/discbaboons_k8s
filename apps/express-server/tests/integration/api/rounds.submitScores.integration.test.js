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

describe('POST /api/rounds/:id/scores - Integration', () => {
  let user;
  let token;
  let course;
  let round;
  let testPlayer;
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
    testPlayer = roundData.player; // Auto-added player record
    createdRoundIds.push(round.id);
  });

  afterEach(async () => {
    // Clean up in reverse order for foreign key constraints
    await query('DELETE FROM scores WHERE round_id = ANY($1)', [createdRoundIds]);
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware
  test('should require authentication', async () => {
    const scores = [{ playerId: testPlayer.id, holeNumber: 1, strokes: 4 }];

    await request(app)
      .post(`/api/rounds/${round.id}/scores`)
      .send({ scores })
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation with JOIN to courses table
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();
    const scores = [{ playerId: testPlayer.id, holeNumber: 1, strokes: 4 }];

    const res = await request(app)
      .post(`/api/rounds/${fakeRoundId}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores })
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - permission validation against actual DB
  test('should return 403 when user is not participant in round', async () => {
    // Create user who is NOT a participant in the round
    const otherUser = await createTestUser({ prefix: 'outsider' });
    createdUserIds.push(otherUser.user.id);

    const scores = [{ playerId: testPlayer.id, holeNumber: 1, strokes: 4 }];

    const res = await request(app)
      .post(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send({ scores })
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Permission denied: User is not a participant in this round',
    });
  });

  // GOOD: Integration concern - DB persistence and batch processing
  test('should submit multiple scores successfully and persist to database', async () => {
    const scores = [
      { playerId: testPlayer.id, holeNumber: 1, strokes: 3 },
      { playerId: testPlayer.id, holeNumber: 2, strokes: 4 },
      { playerId: testPlayer.id, holeNumber: 5, strokes: 5 },
    ];

    const response = await request(app)
      .post(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      scoresSubmitted: 3,
    });

    // Verify DB persistence (integration concern)
    const savedScores = await query(
      'SELECT * FROM scores WHERE round_id = $1 AND player_id = $2 ORDER BY hole_number',
      [round.id, testPlayer.id],
    );

    expect(savedScores.rows).toHaveLength(3);
    expect(savedScores.rows[0]).toMatchObject({
      round_id: round.id,
      player_id: testPlayer.id,
      hole_number: 1,
      strokes: 3,
    });
    expect(savedScores.rows[1]).toMatchObject({
      hole_number: 2,
      strokes: 4,
    });
    expect(savedScores.rows[2]).toMatchObject({
      hole_number: 5,
      strokes: 5,
    });
  });

  // GOOD: Integration concern - player validation against round participants
  test('should return 400 when player is not in round', async () => {
    // Create another user and their own round
    const otherUser = await createTestUser({ prefix: 'other' });
    createdUserIds.push(otherUser.user.id);

    const otherRound = await createTestRound(otherUser.user.id, course.id, { prefix: 'other' });
    createdRoundIds.push(otherRound.round.id);

    // Try to submit scores for other user's player in our round
    const scores = [{ playerId: otherRound.player.id, holeNumber: 1, strokes: 4 }];

    const res = await request(app)
      .post(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores })
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('is not a participant in this round'),
    });
  });

  // GOOD: Integration concern - hole validation against actual course data from DB JOIN
  test('should validate hole number against actual course hole count from database', async () => {
    // Use hole number that exceeds actual course hole count from DB
    const invalidHoleNumber = course.hole_count + 1;
    const scores = [{ playerId: testPlayer.id, holeNumber: invalidHoleNumber, strokes: 4 }];

    const res = await request(app)
      .post(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores })
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining(`Hole number cannot exceed course hole count (${course.hole_count})`),
    });
  });

  // GOOD: Integration concern - UPSERT functionality in database
  test('should update existing scores using UPSERT', async () => {
    // Submit initial scores
    const initialScores = [
      { playerId: testPlayer.id, holeNumber: 1, strokes: 4 },
      { playerId: testPlayer.id, holeNumber: 2, strokes: 5 },
    ];

    await request(app)
      .post(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores: initialScores })
      .expect(200);

    // Update scores (should UPSERT)
    const updatedScores = [
      { playerId: testPlayer.id, holeNumber: 1, strokes: 3 }, // Changed from 4 to 3
      { playerId: testPlayer.id, holeNumber: 3, strokes: 4 }, // New hole
    ];

    const response = await request(app)
      .post(`/api/rounds/${round.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scores: updatedScores })
      .expect(200);

    expect(response.body).toMatchObject({ success: true, scoresSubmitted: 2 });

    // Verify UPSERT worked: updated hole 1, kept hole 2, added hole 3
    const allScores = await query(
      'SELECT * FROM scores WHERE round_id = $1 AND player_id = $2 ORDER BY hole_number',
      [round.id, testPlayer.id],
    );

    expect(allScores.rows).toHaveLength(3);
    expect(allScores.rows[0]).toMatchObject({ hole_number: 1, strokes: 3 }); // Updated
    expect(allScores.rows[1]).toMatchObject({ hole_number: 2, strokes: 5 }); // Unchanged
    expect(allScores.rows[2]).toMatchObject({ hole_number: 3, strokes: 4 }); // New
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Missing scores array (unit test concern)
  // - Empty scores array (unit test concern)
  // - Missing playerId in score (unit test concern)
  // - Invalid playerId format (unit test concern)
  // - Missing holeNumber (unit test concern)
  // - Invalid holeNumber range (unit test concern)
  // - Missing strokes (unit test concern)
  // - Invalid strokes range (unit test concern)
  // These are all tested at the service unit test level
});
