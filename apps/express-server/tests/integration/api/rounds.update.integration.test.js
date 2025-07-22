import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';
import { createUniqueCourseData } from '../test-helpers.js';

const chance = new Chance();

describe('PUT /api/rounds/:id - Integration', () => {
  let user;
  let token;
  let testId;
  let timestamp;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    // Use process ID + timestamp + random for guaranteed uniqueness across parallel tests
    const fullTimestamp = Date.now();
    timestamp = fullTimestamp.toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const pid = process.pid.toString().slice(-3);
    testId = `trur${timestamp}${pid}${random}`;
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user
    const userData = {
      username: `tu${timestamp}${pid}`, // tu = "test update" - keep under 20 chars
      email: `trur${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    const login = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = login.body.tokens.accessToken;
    user = login.body.user;
    createdUserIds.push(user.id);

    // Create a test course to use in rounds with globally unique identifiers
    const courseData = createUniqueCourseData('trur'); // TRUR = Test Round Update Round
    const courseCreateRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);
    createdCourseIds.push(courseCreateRes.body.id);

    // Get the course to know its hole count for valid starting hole
    const courseGetRes = await request(app)
      .get(`/api/courses/${createdCourseIds[0]}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Create a test round to update
    const roundData = {
      courseId: createdCourseIds[0],
      name: `Test Round ${testId}${Date.now()}`,
      startingHole: chance.integer({ min: 1, max: courseGetRes.body.hole_count }),
      isPrivate: false,
      skinsEnabled: false,
      skinsValue: 5.00,
    };
    const roundRes = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);
    createdRoundIds.push(roundRes.body.id);
  });

  afterEach(async () => {
    // Clean up in reverse order due to foreign key constraints
    await query('DELETE FROM round_players WHERE round_id = ANY($1)', [createdRoundIds]);
    if (createdRoundIds.length > 0) {
      await query('DELETE FROM rounds WHERE id = ANY($1)', [createdRoundIds]);
    }
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
  });

  test('should require authentication', async () => {
    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .send(updateData)
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  test('should update round with valid data', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {
      name: `Updated Round ${testId}`,
      status: 'completed',
      starting_hole: 3,
      is_private: true,
      skins_enabled: true,
      skins_value: 10.50,
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      data: {
        id: roundId,
        name: updateData.name,
        status: updateData.status,
        starting_hole: updateData.starting_hole,
        is_private: updateData.is_private,
        skins_enabled: updateData.skins_enabled,
        skins_value: expect.any(String),
        updated_at: expect.any(String),
      },
    });

    // Verify the update in the database
    const dbResult = await query('SELECT * FROM rounds WHERE id = $1', [roundId]);
    expect(dbResult.rows).toHaveLength(1);
    const updatedRound = dbResult.rows[0];
    expect(updatedRound.name).toBe(updateData.name);
    expect(updatedRound.status).toBe(updateData.status);
    expect(updatedRound.starting_hole).toBe(updateData.starting_hole);
    expect(updatedRound.is_private).toBe(updateData.is_private);
    expect(updatedRound.skins_enabled).toBe(updateData.skins_enabled);
    expect(parseFloat(updatedRound.skins_value)).toBe(updateData.skins_value);
  });

  test('should update only provided fields', async () => {
    const roundId = createdRoundIds[0];
    const originalName = 'Original Round Name';

    // First, set a known state
    await query(
      'UPDATE rounds SET name = $1 WHERE id = $2',
      [originalName, roundId],
    );

    // Update only the status
    const updateData = {
      status: 'cancelled',
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data.name).toBe(originalName); // Should remain unchanged

    // Verify in database
    const dbResult = await query('SELECT * FROM rounds WHERE id = $1', [roundId]);
    const updatedRound = dbResult.rows[0];
    expect(updatedRound.status).toBe('cancelled');
    expect(updatedRound.name).toBe(originalName); // Should remain unchanged
  });

  test('should return 400 when roundId is not a valid UUID', async () => {
    const invalidRoundId = 'invalid-uuid';
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .put(`/api/rounds/${invalidRoundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round ID must be a valid UUID',
    });
  });

  test('should return 404 when round does not exist', async () => {
    const nonExistentRoundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .put(`/api/rounds/${nonExistentRoundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Round not found',
    });
  });

  test('should return 400 when update data is empty', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {};

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Update data cannot be empty',
    });
  });

  test('should return 400 when status is invalid', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {
      status: 'invalid_status',
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Status must be one of: in_progress, completed, cancelled',
    });
  });

  test('should return 400 when starting_hole is not a positive integer', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {
      starting_hole: -1,
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Starting hole must be a positive integer',
    });
  });

  test('should return 400 when name is not a string', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {
      name: 123,
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Name must be a string',
    });
  });

  test('should return 400 when is_private is not a boolean', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {
      is_private: 'not a boolean',
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Is private must be a boolean',
    });
  });

  test('should return 400 when skins_value is not a valid decimal', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {
      skins_value: 'not a number',
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Skins value must be a valid decimal number',
    });
  });

  test('should return 400 when trying to update invalid fields', async () => {
    const roundId = createdRoundIds[0];
    const updateData = {
      name: chance.sentence({ words: 3 }),
      invalid_field: 'should not be allowed',
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Invalid update fields: invalid_field',
    });
  });

  test('should return 403 when user is not a participant in the round', async () => {
    // Create another user who is not a participant in the round
    const otherUserData = {
      username: `other${timestamp}${process.pid}`,
      email: `other${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLogin.body.tokens.accessToken;
    createdUserIds.push(otherLogin.body.user.id);

    const roundId = createdRoundIds[0];
    const updateData = {
      name: chance.sentence({ words: 3 }),
    };

    const res = await request(app)
      .put(`/api/rounds/${roundId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send(updateData)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Permission denied: You are not a participant in this round',
    });
  });
});
