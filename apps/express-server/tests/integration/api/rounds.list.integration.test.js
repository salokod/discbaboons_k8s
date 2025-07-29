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

describe('GET /api/rounds - Integration', () => {
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

    // Small delay to ensure FK references are fully committed
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
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
      .get('/api/rounds')
      .expect(401, {
        success: false, message: 'Access token required',
      });
  });

  // GOOD: Integration concern - empty state
  test('should return empty list when user has no rounds', async () => {
    const res = await request(app)
      .get('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      rounds: [],
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    });
  });

  // GOOD: Integration concern - DB query with JOIN and pagination
  test('should return user rounds with correct structure and player count', async () => {
    // Small delay to ensure FK references are committed
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Create rounds directly in DB for faster setup
    const round1Data = await createTestRound(user.id, course.id, {
      prefix: 'list1',
      isPrivate: false,
      skinsEnabled: true,
    });
    const round2Data = await createTestRound(user.id, course.id, {
      prefix: 'list2',
      isPrivate: true,
      skinsEnabled: false,
    });

    createdRoundIds.push(round1Data.round.id, round2Data.round.id);

    const res = await request(app)
      .get('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      total: 2,
      limit: 50,
      offset: 0,
      hasMore: false,
    });

    expect(res.body.rounds).toHaveLength(2);
    expect(res.body.rounds[0]).toMatchObject({
      id: expect.any(String),
      created_by_id: user.id,
      course_id: course.id,
      name: expect.any(String),
      status: 'in_progress',
      player_count: 1, // Integration: Verifies JOIN with round_players works
    });
  });

  // GOOD: Integration concern - user isolation
  test('should only return rounds created by authenticated user', async () => {
    // Create another user with their own round
    const otherUser = await createTestUser({ prefix: 'other' });
    createdUserIds.push(otherUser.user.id);

    // Create rounds in correct order, ensuring FK references exist
    const myRound = await createTestRound(user.id, course.id, { prefix: 'mine' });
    const otherRound = await createTestRound(otherUser.user.id, course.id, { prefix: 'other' });

    createdRoundIds.push(myRound.round.id, otherRound.round.id);

    const res = await request(app)
      .get('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.rounds).toHaveLength(1);
    expect(res.body.rounds[0]).toMatchObject({
      id: myRound.round.id,
      created_by_id: user.id,
    });
  });

  // GOOD: Integration concern - DB filtering works
  test('should filter rounds by status', async () => {
    const round1 = await createTestRound(user.id, course.id, { prefix: 'active' });
    const round2 = await createTestRound(user.id, course.id, { prefix: 'done' });
    createdRoundIds.push(round1.round.id, round2.round.id);

    // Update one round to completed status directly in DB
    await query('UPDATE rounds SET status = $1 WHERE id = $2', ['completed', round1.round.id]);

    // Test filtering works with DB
    const completedRes = await request(app)
      .get('/api/rounds?status=completed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(completedRes.body.total).toBe(1);
    expect(completedRes.body.rounds[0]).toMatchObject({
      id: round1.round.id,
      status: 'completed',
    });

    const inProgressRes = await request(app)
      .get('/api/rounds?status=in_progress')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(inProgressRes.body.total).toBe(1);
    expect(inProgressRes.body.rounds[0]).toMatchObject({
      id: round2.round.id,
      status: 'in_progress',
    });
  });

  // GOOD: Integration concern - pagination with DB
  test('should support pagination with correct metadata calculation', async () => {
    // Small delay to ensure FK references are committed
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Create 5 rounds sequentially to avoid deadlocks
    const rounds = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const round = await createTestRound(user.id, course.id, { prefix: `page${i}` });
      rounds.push(round);
    }
    createdRoundIds.push(...rounds.map((r) => r.round.id));

    // Test first page
    const firstPage = await request(app)
      .get('/api/rounds?limit=2&offset=0')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(firstPage.body).toMatchObject({
      total: 5,
      limit: 2,
      offset: 0,
      hasMore: true,
    });
    expect(firstPage.body.rounds).toHaveLength(2);

    // Test last page
    const lastPage = await request(app)
      .get('/api/rounds?limit=2&offset=4')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(lastPage.body).toMatchObject({
      total: 5,
      limit: 2,
      offset: 4,
      hasMore: false,
    });
    expect(lastPage.body.rounds).toHaveLength(1);
  });

  // GOOD: Integration concern - case-insensitive search with DB
  test('should filter rounds by name search case-insensitively', async () => {
    const searchTerm = chance.word().toUpperCase();
    const round1 = await createTestRound(user.id, course.id, {
      prefix: `morning-${searchTerm.toLowerCase()}`,
    });
    const round2 = await createTestRound(user.id, course.id, {
      prefix: 'evening-nomatch',
    });
    createdRoundIds.push(round1.round.id, round2.round.id);

    // Update round name to include search term
    await query(
      'UPDATE rounds SET name = $1 WHERE id = $2',
      [`Morning ${searchTerm} Round`, round1.round.id],
    );

    const res = await request(app)
      .get(`/api/rounds?name=${searchTerm.toLowerCase()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.rounds[0]).toMatchObject({
      id: round1.round.id,
      name: expect.stringContaining(searchTerm),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid status values (unit test concern)
  // - Invalid boolean filters (unit test concern)
  // - String/boolean conversion (unit test concern)
  // These are all tested at the service unit test level
});
