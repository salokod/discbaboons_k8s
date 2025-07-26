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

describe('PUT /api/profile - Integration', () => {
  let user;
  let token;
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];

    // Create user directly in DB for speed
    const testUser = await createTestUser({ prefix: 'profileupdate' });
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
      .put('/api/profile')
      .send({ name: chance.name() })
      .expect(401, {
        error: 'Access token required',
      });
  });

  // GOOD: Integration concern - profile update and database persistence
  test('should update profile and persist to database', async () => {
    const updateData = {
      name: chance.name(),
      bio: chance.sentence(),
      city: chance.city(),
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
      isnamepublic: chance.bool(),
      isbiopublic: chance.bool(),
      islocationpublic: chance.bool(),
    };

    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      profile: {
        user_id: user.id,
        name: updateData.name,
        bio: updateData.bio,
        city: updateData.city,
        country: updateData.country,
        state_province: updateData.state_province,
      },
    });

    // Integration: Verify persistence to database
    const dbProfile = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [user.id],
    );
    expect(dbProfile.rows[0]).toMatchObject({
      user_id: user.id,
      name: updateData.name,
      bio: updateData.bio,
      city: updateData.city,
      country: updateData.country,
      state_province: updateData.state_province,
      isnamepublic: updateData.isnamepublic,
      isbiopublic: updateData.isbiopublic,
      islocationpublic: updateData.islocationpublic,
    });
  });

  // GOOD: Integration concern - partial update functionality
  test('should allow partial profile updates', async () => {
    // First create a profile
    const initialData = {
      name: chance.name(),
      bio: chance.sentence(),
      city: chance.city(),
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
    };

    await query(
      `INSERT INTO user_profiles (user_id, name, bio, city, country, state_province)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        initialData.name,
        initialData.bio,
        initialData.city,
        initialData.country,
        initialData.state_province,
      ],
    );

    // Update only name and bio
    const partialUpdate = {
      name: chance.name(),
      bio: chance.sentence(),
    };

    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(partialUpdate)
      .expect(200);

    expect(response.body.profile).toMatchObject({
      name: partialUpdate.name,
      bio: partialUpdate.bio,
      city: initialData.city, // Should remain unchanged
      country: initialData.country, // Should remain unchanged
      state_province: initialData.state_province, // Should remain unchanged
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Field length validation (unit test concern)
  // - Invalid data types (unit test concern)
  // These are all tested at the service unit test level
});
