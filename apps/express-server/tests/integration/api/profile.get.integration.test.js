import 'dotenv/config';
import {
  describe, test, expect, afterAll, beforeEach, vi,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET/PUT /api/profile - Integration', () => {
  let userData;
  let accessToken;
  let user;

  beforeEach(async () => {
    // Clean up before each test
    await prisma.user_profiles.deleteMany({
      where: { name: { contains: 'test-get-' } },
    });
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test-get-' } },
          { username: { contains: 'testget' } },
        ],
      },
    });

    // Register a new user
    const password = `Abcdef1!${chance.string({ length: 5 })}`;
    userData = {
      username: `testget_${chance.string({ length: 5 })}`,
      email: `test-get-${chance.guid()}@example.com`,
      password,
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
    await prisma.user_profiles.deleteMany({
      where: { name: { contains: 'test-get-' } },
    });
    await prisma.users.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test-get-' } },
          { username: { contains: 'testget' } },
        ],
      },
    });

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
