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

describe('GET /api/profile/search - Integration', () => {
  let user1;
  let user2;
  let sharedCity;
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];

    // Create users directly in DB for speed
    const testUser1 = await createTestUser({ prefix: 'profilesearch1' });
    user1 = testUser1.user;
    createdUserIds.push(user1.id);

    const testUser2 = await createTestUser({ prefix: 'profilesearch2' });
    user2 = testUser2.user;
    createdUserIds.push(user2.id);

    // Create shared test data
    sharedCity = chance.city();

    // Create profiles directly in DB with different privacy settings
    // User1: name and city public, bio private
    await query(
      `INSERT INTO user_profiles (user_id, name, bio, city, country, state_province,
        isnamepublic, isbiopublic, islocationpublic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user1.id,
        chance.name(),
        chance.sentence(),
        sharedCity,
        chance.country({ full: true }),
        chance.state({ full: true }),
        true, // name public
        false, // bio private
        true, // location public
      ],
    );

    // User2: bio public, name and city private
    await query(
      `INSERT INTO user_profiles (user_id, name, bio, city, country, state_province,
        isnamepublic, isbiopublic, islocationpublic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user2.id,
        chance.name(),
        chance.sentence(),
        sharedCity,
        chance.country({ full: true }),
        chance.state({ full: true }),
        false, // name private
        true, // bio public
        false, // location private
      ],
    );
  });

  afterEach(async () => {
    // Clean up in FK order
    if (createdUserIds.length > 0) {
      await query('DELETE FROM user_profiles WHERE user_id = ANY($1)', [createdUserIds]);
    }
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - search functionality with privacy filtering
  test('should search profiles and filter based on privacy settings', async () => {
    const response = await request(app)
      .get('/api/profile/search')
      .query({ city: sharedCity })
      .expect(200);

    expect(response.body).toMatchObject({
      profiles: expect.any(Array),
      total: expect.any(Number),
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: expect.any(Boolean),
    });

    // Integration: Verify privacy filtering - user1 has name/city public
    const user1Result = response.body.profiles.find((p) => p.user_id === user1.id);
    expect(user1Result).toBeDefined();
    expect(user1Result).toHaveProperty('name');
    expect(user1Result).toHaveProperty('city', sharedCity);
    expect(user1Result).not.toHaveProperty('bio'); // bio is private

    // Integration: Verify privacy filtering - user2 has bio public
    const user2Result = response.body.profiles.find((p) => p.user_id === user2.id);
    expect(user2Result).toBeDefined();
    expect(user2Result).toHaveProperty('bio');
    expect(user2Result).not.toHaveProperty('name'); // name is private
    expect(user2Result).not.toHaveProperty('city'); // location is private
  });

  // GOOD: Integration concern - search by username with privacy filtering
  test('should search by username and respect privacy settings', async () => {
    const response = await request(app)
      .get('/api/profile/search')
      .query({ username: user1.username })
      .expect(200);

    expect(response.body).toMatchObject({
      profiles: expect.any(Array),
      total: expect.any(Number),
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: expect.any(Boolean),
    });

    // Integration: Should find user1 and respect privacy settings
    const user1Result = response.body.profiles.find((p) => p.user_id === user1.id);
    expect(user1Result).toBeDefined();
    expect(user1Result).toHaveProperty('name');
    expect(user1Result).toHaveProperty('city');
    expect(user1Result).not.toHaveProperty('bio'); // bio is private
  });

  // GOOD: Integration concern - empty search results
  test('should return empty results when no profiles match', async () => {
    const response = await request(app)
      .get('/api/profile/search')
      .query({ city: chance.city() }) // Random city that doesn't exist
      .expect(200);

    expect(response.body).toMatchObject({
      profiles: [],
      total: 0,
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: false,
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing search parameters (unit test concern)
  // - Invalid search parameter formats (unit test concern)
  // These are all tested at the service unit test level
});
