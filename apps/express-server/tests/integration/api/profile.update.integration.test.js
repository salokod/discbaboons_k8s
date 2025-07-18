import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

// Generate unique identifier for this test file
const timestamp = Date.now().toString().slice(-6);
const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
const testId = `pu${timestamp}${random}`;

describe('PUT /api/profile - Integration', () => {
  let userData;
  let accessToken;
  let user;
  let createdUserIds = [];

  beforeEach(async () => {
    createdUserIds = [];
    // Clean up any leftover test data
    await query('DELETE FROM users WHERE email LIKE $1', [`%${testId}%`]);

    // Register a new user
    const userSuffix = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    userData = {
      username: `u${timestamp}${userSuffix}`,
      email: `${testId}-${userSuffix}@example.com`,
      password: `Abcdef1!${chance.word({ length: 5 })}`,
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    createdUserIds.push(registerRes.body.user.id);

    // Login as that user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password,
      })
      .expect(200);

    accessToken = loginRes.body.tokens.accessToken;
    user = loginRes.body.user;
  });

  afterEach(async () => {
    // Clean up users created in this test by ID
    if (createdUserIds.length > 0) {
      await query('DELETE FROM user_profiles WHERE user_id = ANY($1)', [createdUserIds]);
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
    // Fallback cleanup by email pattern
    await query('DELETE FROM users WHERE email LIKE $1', [`%${testId}%`]);
    createdUserIds = [];

    vi.restoreAllMocks();
  });

  test('should update profile fields including privacy fields', async () => {
    const updateData = {
      name: 'Updated Name',
      bio: 'Updated bio',
      isnamepublic: true,
      isbiopublic: true,
      islocationpublic: true,
    };

    // Use the access token to update the profile
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.profile).toMatchObject({
      user_id: user.id,
      ...updateData,
    });

    // Optionally, fetch the profile from DB to verify
    const dbProfile = await queryOne(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [user.id],
    );
    expect(dbProfile).toMatchObject(updateData);
  });
});
