import 'dotenv/config';
import {
  describe, test, expect, afterAll, beforeEach, vi,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('PUT /api/profile - Integration', () => {
  let userData;
  let accessToken;
  let user;

  beforeEach(async () => {
    // Register a new user
    userData = {
      username: `testupdate_${chance.string({ length: 5 })}`,
      email: `test-update-${chance.guid()}@example.com`,
      password: `Abcdef1!${chance.word({ length: 5 })}`,
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

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

  afterAll(async () => {
    await query(
      'DELETE FROM user_profiles WHERE name LIKE $1',
      ['%test-update-%'],
    );
    await query(
      'DELETE FROM users WHERE email LIKE $1 OR username LIKE $2',
      ['%test-update-%', '%testupdate%'],
    );

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
