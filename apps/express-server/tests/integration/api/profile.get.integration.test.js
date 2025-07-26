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
  cleanupUsers,
} from '../test-helpers.js';

const chance = new Chance();

describe('GET /api/profile - Integration', () => {
  let user;
  let token;
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'profileget' });
    user = testUser.user;
    token = testUser.token;
    createdUserIds.push(user.id);
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdUserIds.length > 0) {
      await query('DELETE FROM user_profiles WHERE user_id = ANY($1)', [createdUserIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - middleware authentication
  test('should require authentication', async () => {
    await request(app)
      .get('/api/profile')
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - profile retrieval from database
  test('should retrieve user profile from database', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
    });

    // Integration: Verify profile data structure (may be null or have user_id)
    if (response.body.profile) {
      expect(response.body.profile.user_id).toBe(user.id);
    }
  });

  // GOOD: Integration concern - profile creation and persistence
  test('should retrieve profile after creation in database', async () => {
    // Create profile directly in DB
    const profileData = {
      name: chance.name(),
      bio: chance.sentence(),
      city: chance.city(),
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
      isnamepublic: chance.bool(),
      isbiopublic: chance.bool(),
      islocationpublic: chance.bool(),
    };

    await query(
      `INSERT INTO user_profiles (user_id, name, bio, city, country, state_province, 
        isnamepublic, isbiopublic, islocationpublic) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user.id,
        profileData.name,
        profileData.bio,
        profileData.city,
        profileData.country,
        profileData.state_province,
        profileData.isnamepublic,
        profileData.isbiopublic,
        profileData.islocationpublic,
      ],
    );

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      profile: {
        user_id: user.id,
        name: profileData.name,
        bio: profileData.bio,
        city: profileData.city,
        country: profileData.country,
        state_province: profileData.state_province,
      },
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Invalid token format (unit test concern)
  // - Token expiration (unit test concern)
  // These are all tested at the service unit test level
});
