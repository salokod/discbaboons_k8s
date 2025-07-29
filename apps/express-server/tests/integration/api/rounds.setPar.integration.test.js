import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';
import {
  createTestUser,
  createTestCourse,
  createTestRound,
  cleanupRounds,
  cleanupCourses,
  cleanupUsers,
} from '../test-helpers.js';

const chance = new Chance();

describe('PUT /api/rounds/:id/holes/:holeNumber/par - Integration', () => {
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
    await query('DELETE FROM round_hole_pars WHERE round_id = ANY($1)', [createdRoundIds]);
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware
  test('should require authentication', async () => {
    const holeNumber = chance.integer({ min: 1, max: course.hole_count });
    const par = chance.integer({ min: 3, max: 5 });

    await request(app)
      .put(`/api/rounds/${round.id}/holes/${holeNumber}/par`)
      .send({ par })
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - DB INSERT and foreign key constraints
  test('should set par for hole successfully and persist to database', async () => {
    const holeNumber = chance.integer({ min: 1, max: course.hole_count });
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${round.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par })
      .expect(200);

    expect(response.body).toMatchObject({ success: true });

    // Verify DB persistence with foreign key constraints (integration concern)
    const savedPar = await queryOne(
      'SELECT rhp.*, rp.user_id FROM round_hole_pars rhp JOIN round_players rp ON rhp.set_by_player_id = rp.id WHERE rhp.round_id = $1 AND rhp.hole_number = $2',
      [round.id, holeNumber],
    );

    expect(savedPar).toBeTruthy();
    expect(savedPar).toMatchObject({
      par,
      round_id: round.id,
      hole_number: holeNumber,
      user_id: user.id, // Verifies foreign key constraint worked
    });
  });

  // GOOD: Integration concern - UPSERT functionality in database
  test('should update existing par using UPSERT and maintain single record', async () => {
    const holeNumber = chance.integer({ min: 1, max: course.hole_count });
    const originalPar = 3;
    const newPar = 4;

    // Set initial par
    await request(app)
      .put(`/api/rounds/${round.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: originalPar })
      .expect(200);

    // Update par (should UPSERT)
    const response = await request(app)
      .put(`/api/rounds/${round.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par: newPar })
      .expect(200);

    expect(response.body).toMatchObject({ success: true });

    // Verify UPSERT worked: updated value, single record (integration concern)
    const savedPar = await queryOne(
      'SELECT * FROM round_hole_pars WHERE round_id = $1 AND hole_number = $2',
      [round.id, holeNumber],
    );
    expect(savedPar.par).toBe(newPar);

    // Verify UPSERT: only one record exists (no duplicates)
    const allPars = await query(
      'SELECT * FROM round_hole_pars WHERE round_id = $1 AND hole_number = $2',
      [round.id, holeNumber],
    );
    expect(allPars.rows).toHaveLength(1);
  });

  // GOOD: Integration concern - round validation with JOIN to courses table
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: course.hole_count });
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${fakeRoundId}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par })
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  // GOOD: Integration concern - hole validation against actual course data from DB JOIN
  test('should validate hole number against actual course hole count from database', async () => {
    // Use hole number that exceeds actual course hole count from DB
    const invalidHoleNumber = course.hole_count + 1;
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${round.id}/holes/${invalidHoleNumber}/par`)
      .set('Authorization', `Bearer ${token}`)
      .send({ par })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: `Hole number cannot exceed course hole count (${course.hole_count})`,
    });
  });

  // GOOD: Integration concern - permission validation against actual DB
  test('should return 403 when user is not participant in round', async () => {
    // Create user who is NOT a participant in the round
    const otherUser = await createTestUser({ prefix: 'outsider' });
    createdUserIds.push(otherUser.user.id);

    const holeNumber = chance.integer({ min: 1, max: course.hole_count });
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${round.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send({ par })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Permission denied: User is not a participant in this round',
    });

    // Verify no par was set in DB
    const noPar = await queryOne(
      'SELECT * FROM round_hole_pars WHERE round_id = $1 AND hole_number = $2',
      [round.id, holeNumber],
    );
    expect(noPar).toBeNull();
  });

  // GOOD: Integration concern - participant can set par
  test('should allow existing participant to set par', async () => {
    // Add another user as participant
    const participantUser = await createTestUser({ prefix: 'participant' });
    createdUserIds.push(participantUser.user.id);

    // Add user as participant directly in DB
    await query(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, false)',
      [round.id, participantUser.user.id],
    );

    const holeNumber = chance.integer({ min: 1, max: course.hole_count });
    const par = chance.integer({ min: 3, max: 5 });

    // Participant should be able to set par
    const response = await request(app)
      .put(`/api/rounds/${round.id}/holes/${holeNumber}/par`)
      .set('Authorization', `Bearer ${participantUser.token}`)
      .send({ par })
      .expect(200);

    expect(response.body).toMatchObject({ success: true });

    // Verify par was set with correct player reference
    const savedPar = await queryOne(
      'SELECT rhp.*, rp.user_id FROM round_hole_pars rhp JOIN round_players rp ON rhp.set_by_player_id = rp.id WHERE rhp.round_id = $1 AND rhp.hole_number = $2',
      [round.id, holeNumber],
    );
    expect(savedPar.user_id).toBe(participantUser.user.id);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Missing holeNumber (unit test concern)
  // - Invalid holeNumber format (unit test concern)
  // - Hole number range 1-50 (unit test concern)
  // - Missing par (unit test concern)
  // - Invalid par format (unit test concern)
  // - Par range 1-10 (unit test concern)
  // - Missing requestingUserId (unit test concern)
  // These are all tested at the service unit test level
});
