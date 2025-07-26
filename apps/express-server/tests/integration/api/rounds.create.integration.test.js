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
  cleanupRounds,
  cleanupCourses,
  cleanupUsers,
} from '../test-helpers.js';

const chance = new Chance();

describe('POST /api/rounds - Integration', () => {
  let user;
  let token;
  let course;
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
  });

  afterEach(async () => {
    // Clean up in reverse order for foreign key constraints
    await cleanupRounds(createdRoundIds);
    await cleanupCourses(createdCourseIds);
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware
  test('should require authentication', async () => {
    const roundData = {
      courseId: course.id,
      name: chance.sentence({ words: 3 }),
    };

    await request(app)
      .post('/api/rounds')
      .send(roundData)
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - DB persistence and transaction
  test('should create round successfully and persist to database', async () => {
    const roundData = {
      courseId: course.id,
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: course.hole_count }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
      skinsValue: chance.floating({ min: 1, max: 50, fixed: 2 }),
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);

    // Verify response structure
    expect(res.body).toMatchObject({
      id: expect.any(String),
      created_by_id: user.id,
      course_id: course.id,
      name: roundData.name,
      starting_hole: roundData.startingHole,
      is_private: roundData.isPrivate,
      skins_enabled: roundData.skinsEnabled,
      status: 'in_progress',
    });

    // Track for cleanup
    createdRoundIds.push(res.body.id);

    // Verify DB persistence (integration concern)
    const savedRound = await query('SELECT * FROM rounds WHERE id = $1', [res.body.id]);
    expect(savedRound.rows).toHaveLength(1);
    expect(savedRound.rows[0]).toMatchObject({
      id: res.body.id,
      created_by_id: user.id,
      course_id: course.id,
    });
  });

  // GOOD: Integration concern - transaction creates round AND auto-adds player
  test('should automatically add creator as player in single transaction', async () => {
    const roundData = {
      courseId: course.id,
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: course.hole_count }),
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);

    const roundId = res.body.id;
    createdRoundIds.push(roundId);

    // Verify transaction worked: both round and player exist
    const [roundResult, playerResult] = await Promise.all([
      query('SELECT * FROM rounds WHERE id = $1', [roundId]),
      query('SELECT * FROM round_players WHERE round_id = $1 AND user_id = $2', [roundId, user.id]),
    ]);

    expect(roundResult.rows).toHaveLength(1);
    expect(playerResult.rows).toHaveLength(1);
    expect(playerResult.rows[0]).toMatchObject({
      round_id: roundId,
      user_id: user.id,
      is_guest: false,
    });
  });

  // GOOD: Integration concern - DB foreign key validation
  test('should return 400 when course does not exist in database', async () => {
    const roundData = {
      courseId: chance.guid(), // Non-existent course ID
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Course not found',
    });
  });

  // GOOD: Integration concern - course validation against actual DB
  test('should validate starting hole against actual course hole count from database', async () => {
    const roundData = {
      courseId: course.id,
      name: chance.sentence({ words: 3 }),
      startingHole: course.hole_count + 1, // Exceed actual hole count
    };

    const res = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Starting hole cannot exceed course hole count',
    });
  });

  // GOOD: Integration concern - transaction rollback on failure
  test('should handle database transaction rollback on error', async () => {
    // Create data that will cause a DB constraint violation
    const roundData = {
      courseId: course.id,
      name: chance.string({ length: 300 }), // Exceeds VARCHAR limit
    };

    await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(500); // Database error

    // Verify no partial data was saved (transaction rolled back)
    const rounds = await query('SELECT * FROM rounds WHERE created_by_id = $1', [user.id]);
    const players = await query('SELECT * FROM round_players WHERE user_id = $1', [user.id]);

    expect(rounds.rows).toHaveLength(0);
    expect(players.rows).toHaveLength(0);
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing courseId (unit test concern)
  // - Missing name (unit test concern)
  // - Missing userId (unit test concern)
  // - Invalid data types (unit test concern)
  // These are all tested at the service unit test level
});
