import {
  describe, test, expect, afterAll, beforeEach, vi,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('GET /api/profile/search - Integration', () => {
  let user1Data; let
    user2Data;
  let user1; let
    user2;
  let accessToken1; let
    accessToken2;
  let profile1Data; let
    profile2Data;

  beforeEach(async () => {
    // Clean up users and profiles before each test
    await query(
      'DELETE FROM user_profiles WHERE name LIKE $1',
      ['%test-search-%'],
    );
    await query(
      'DELETE FROM users WHERE email LIKE $1 OR username LIKE $2',
      ['%test-search-%', '%testsearch%'],
    );

    // Register user1
    user1Data = {
      username: `testsearch1_${chance.string({ length: 5 })}`,
      email: `test-search-${chance.guid()}@example.com`,
      password: `Abcdef1!${chance.string({ length: 5 })}`,
    };
    await request(app)
      .post('/api/auth/register')
      .send(user1Data)
      .expect(201);

    // Login user1
    const loginRes1 = await request(app)
      .post('/api/auth/login')
      .send({
        username: user1Data.username,
        password: user1Data.password,
      })
      .expect(200);
    accessToken1 = loginRes1.body.tokens.accessToken;
    user1 = loginRes1.body.user;

    // Register user2
    user2Data = {
      username: `testsearch2_${chance.string({ length: 5 })}`,
      email: `test-search-${chance.guid()}@example.com`,
      password: `Abcdef1!${chance.string({ length: 5 })}`,
    };
    await request(app)
      .post('/api/auth/register')
      .send(user2Data)
      .expect(201);

    // Login user2
    const loginRes2 = await request(app)
      .post('/api/auth/login')
      .send({
        username: user2Data.username,
        password: user2Data.password,
      })
      .expect(200);
    accessToken2 = loginRes2.body.tokens.accessToken;
    user2 = loginRes2.body.user;

    // Both users will have the same city for city search
    const sharedCity = chance.city();

    // Update profile for user1 (name and city public, bio private)
    profile1Data = {
      name: `test-search-${chance.name()}`,
      bio: chance.sentence(),
      city: sharedCity,
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
      isnamepublic: true,
      isbiopublic: false,
      islocationpublic: true,
    };
    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(profile1Data)
      .expect(200);

    // Update profile for user2 (bio public, name and city private)
    profile2Data = {
      name: `test-search-${chance.name()}`,
      bio: chance.sentence(),
      city: sharedCity,
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
      isnamepublic: false,
      isbiopublic: true,
      islocationpublic: false,
    };
    await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken2}`)
      .send(profile2Data)
      .expect(200);
  });

  afterAll(async () => {
    await query(
      'DELETE FROM user_profiles WHERE name LIKE $1',
      ['%test-search-%'],
    );
    await query(
      'DELETE FROM users WHERE email LIKE $1 OR username LIKE $2',
      ['%test-search-%', '%testsearch%'],
    );
    vi.restoreAllMocks();
  });

  test('should return only public fields for matching profiles by city', async () => {
    const response = await request(app)
      .get('/api/profile/search')
      .query({ city: profile1Data.city })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.results)).toBe(true);

    // user1: name and city should be public, bio should not
    const user1Result = response.body.results.find((p) => p.user_id === user1.id);
    expect(user1Result).toBeDefined();
    expect(user1Result.name).toBe(profile1Data.name);
    expect(user1Result.city).toBe(profile1Data.city);
    expect(user1Result).not.toHaveProperty('bio');

    // user2: bio should be public, name and city should not
    const user2Result = response.body.results.find((p) => p.user_id === user2.id);
    expect(user2Result).toBeDefined();
    expect(user2Result.bio).toBe(profile2Data.bio);
    expect(user2Result).not.toHaveProperty('name');
    expect(user2Result).not.toHaveProperty('city');
  });

  test('should return only public fields for matching profiles by username', async () => {
    const response = await request(app)
      .get('/api/profile/search')
      .query({ username: user1Data.username })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.results)).toBe(true);

    // Only user1 should match and only public fields should be present
    const user1Result = response.body.results.find((p) => p.user_id === user1.id);
    expect(user1Result).toBeDefined();
    expect(user1Result.name).toBe(profile1Data.name);
    expect(user1Result.city).toBe(profile1Data.city);
    expect(user1Result).not.toHaveProperty('bio');
  });
});
