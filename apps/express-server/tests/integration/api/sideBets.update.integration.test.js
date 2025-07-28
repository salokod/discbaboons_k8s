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

describe('PUT /api/rounds/:id/side-bets/:betId - Integration', () => {
  let user;
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
    const updateData = { name: chance.word() };

    const res = await request(app)
      .put(`/api/rounds/${round.id}/side-bets/${betId}`)
      .send(updateData)
      .expect(401);

    expect(res.body).toMatchObject({
      success: false, message: 'Access token required',
    });
  });
});
