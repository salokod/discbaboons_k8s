import {
  describe, test, expect, afterAll, beforeEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET /api/profile/search - Integration', () => {
  let user1; let
    user2;
  let profile1Data; let
    profile2Data;

  beforeEach(async () => {
    // Generate random user and profile data
    const user1Username = `testuser1_${chance.string({ length: 5 })}`;
    const user2Username = `testuser2_${chance.string({ length: 5 })}`;
    const user1Email = `test-profile-${chance.guid()}@example.com`;
    const user2Email = `test-profile-${chance.guid()}@example.com`;
    const user1City = chance.city();
    const user2City = user1City; // ensure both are in the same city for city search

    user1 = await prisma.users.create({
      data: {
        username: user1Username,
        email: user1Email,
        password_hash: chance.hash(),
      },
    });
    user2 = await prisma.users.create({
      data: {
        username: user2Username,
        email: user2Email,
        password_hash: chance.hash(),
      },
    });

    profile1Data = {
      user_id: user1.id,
      name: `test-profile-${chance.name()}`,
      bio: chance.sentence(),
      city: user1City,
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
      isnamepublic: true,
      isbiopublic: false,
      islocationpublic: true,
    };

    profile2Data = {
      user_id: user2.id,
      name: `test-profile-${chance.name()}`,
      bio: chance.sentence(),
      city: user2City,
      country: chance.country({ full: true }),
      state_province: chance.state({ full: true }),
      isnamepublic: false,
      isbiopublic: true,
      islocationpublic: false,
    };

    await prisma.user_profiles.create({ data: profile1Data });
    await prisma.user_profiles.create({ data: profile2Data });
  });

  afterAll(async () => {
    await prisma.user_profiles.deleteMany({
      where: {
        name: { contains: 'test-profile-' },
      },
    });
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test-profile-' } },
          { username: { contains: 'testuser' } },
        ],
      },
    });
  });

  test('should return only public fields for matching profiles by city', async () => {
    const response = await request(app)
      .get('/api/profile/search')
      .query({ city: profile1Data.city })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.results)).toBe(true);

    console.log('RESULTS:', response.body.results);
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
      .query({ username: user1.username }) // <-- FIXED
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
