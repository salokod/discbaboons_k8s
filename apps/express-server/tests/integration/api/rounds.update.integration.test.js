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

describe('PUT /api/rounds/:id - Integration', () => {
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
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    await request(app)
      .put(`/api/rounds/${round.id}`)
      .send(updateData)
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - round validation against DB
  test('should return 404 when round does not exist in database', async () => {
    const fakeRoundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .put(`/api/rounds/${fakeRoundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
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

    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .put(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${otherUser.token}`)
      .send(updateData)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Permission denied: You are not a participant in this round',
    });
  });

  // GOOD: Integration concern - DB persistence and update operations
  test('should update round successfully and persist to database', async () => {
    const updateData = {
      name: chance.sentence({ words: 3 }),
      status: chance.pickone(['in_progress', 'completed', 'cancelled']),
      starting_hole: chance.integer({ min: 1, max: course.hole_count }),
      is_private: chance.bool(),
      skins_enabled: chance.bool(),
      skins_value: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
    };

    const response = await request(app)
      .put(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: round.id,
        name: updateData.name,
        status: updateData.status,
        starting_hole: updateData.starting_hole,
        is_private: updateData.is_private,
        skins_enabled: updateData.skins_enabled,
        skins_value: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    // Verify DB persistence (integration concern)
    const savedRound = await query('SELECT * FROM rounds WHERE id = $1', [round.id]);
    expect(savedRound.rows).toHaveLength(1);
    expect(savedRound.rows[0]).toMatchObject({
      id: round.id,
      name: updateData.name,
      status: updateData.status,
      starting_hole: updateData.starting_hole,
      is_private: updateData.is_private,
      skins_enabled: updateData.skins_enabled,
    });
    expect(parseFloat(savedRound.rows[0].skins_value)).toBe(updateData.skins_value);
  });

  // GOOD: Integration concern - partial update capability
  test('should update only provided fields in database', async () => {
    // Update only the name field
    const updateData = {
      name: chance.sentence({ words: 4 }),
    };

    const response = await request(app)
      .put(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(updateData.name);
    expect(response.body.data.status).toBe(round.status); // Should remain unchanged

    // Verify partial update in DB
    const savedRound = await query('SELECT * FROM rounds WHERE id = $1', [round.id]);
    expect(savedRound.rows[0].name).toBe(updateData.name);
    expect(savedRound.rows[0].status).toBe(round.status); // Original value preserved
  });

  // GOOD: Integration concern - timestamp update behavior
  test('should update updated_at timestamp in database', async () => {
    const originalTimestamp = round.updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    const response = await request(app)
      .put(`/api/rounds/${round.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    // Verify timestamp was updated
    expect(new Date(response.body.data.updated_at).getTime()).toBeGreaterThan(
      new Date(originalTimestamp).getTime(),
    );

    // Verify in DB
    const savedRound = await query('SELECT * FROM rounds WHERE id = $1', [round.id]);
    expect(new Date(savedRound.rows[0].updated_at).getTime()).toBeGreaterThan(
      new Date(originalTimestamp).getTime(),
    );
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing roundId (unit test concern)
  // - Invalid UUID format (unit test concern)
  // - Empty update data (unit test concern)
  // - Invalid status values (unit test concern)
  // - Invalid field types (unit test concern)
  // - Invalid field values (unit test concern)
  // - Disallowed fields (unit test concern)
  // These are all tested at the service unit test level
});
