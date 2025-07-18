import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

// Generate unique identifier for this test file
const timestamp = Date.now().toString().slice(-6);
const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
const testId = `pg${timestamp}${random}`;

describe('GET/PUT /api/profile - Integration', () => {
  let userData;
  let accessToken;
  let user;
  let createdUserIds = [];

  beforeEach(async () => {
    createdUserIds = [];
    // Clean up any leftover test data
    await query('DELETE FROM users WHERE email LIKE $1', [`%${testId}%`]);

    // Register a new user
    const password = `Abcdef1!${chance.string({ length: 5 })}`;
    const userSuffix = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    userData = {
      username: `u${timestamp}${userSuffix}`,
      email: `${testId}-${userSuffix}@example.com`,
      password,
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

  test('should get empty or default profile, update it, and get updated profile', async () => {
    // 1. GET profile (should be empty or default)
    const getRes1 = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Accept either null or a default profile (depends on your implementation)
    expect(getRes1.body.success).toBe(true);
    // If your app auto-creates a profile, check for user_id match
    if (getRes1.body.profile) {
      expect(getRes1.body.profile.user_id).toBe(user.id);
    } else {
      expect(getRes1.body.profile).toBeNull();
    }

    // 2. Update profile
    const updateData = {
      name: `Updated Name ${chance.name()}`,
      bio: `Updated bio ${chance.sentence()}`,
      city: chance.city(),
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
      isnamepublic: true,
      isbiopublic: true,
      islocationpublic: true,
    };

    const putRes = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData)
      .expect(200);

    expect(putRes.body.success).toBe(true);
    expect(putRes.body.profile).toMatchObject({
      user_id: user.id,
      ...updateData,
    });

    // 3. GET profile again (should match updated data)
    const getRes2 = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(getRes2.body.success).toBe(true);
    expect(getRes2.body.profile).toMatchObject({
      user_id: user.id,
      ...updateData,
    });
  });

  // You can add more tests for edge cases, e.g.:
  test('should return 401 if no token is provided', async () => {
    await request(app)
      .get('/api/profile')
      .expect(401);
  });

  test('should return 401 for invalid token', async () => {
    await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
  });
});
