import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET /api/friends - Integration', () => {
  let userA; let userB; let userC; let tokenA; let tokenB; let tokenC; let
    requestId;
  const userAPrefix = `tfa-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' })}`;
  const userBPrefix = `tfb-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' })}`;
  const userCPrefix = `tfc-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' })}`;

  beforeEach(async () => {
    // Register User A
    const userAData = {
      username: `${userAPrefix}`,
      email: `${userAPrefix}@example.com`,
      password: `Abcdef1!${chance.word({ length: 5 })}`,
    };
    await request(app).post('/api/auth/register').send(userAData).expect(201);
    const loginA = await request(app).post('/api/auth/login').send({
      username: userAData.username,
      password: userAData.password,
    }).expect(200);
    tokenA = loginA.body.tokens.accessToken;
    userA = loginA.body.user;

    // Register User B
    const userBData = {
      username: userBPrefix,
      email: `${userBPrefix}@example.com`,
      password: `Abcdef1!${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' })}`,
    };
    await request(app).post('/api/auth/register').send(userBData).expect(201);
    const loginB = await request(app).post('/api/auth/login').send({
      username: userBData.username,
      password: userBData.password,
    }).expect(200);
    tokenB = loginB.body.tokens.accessToken;
    userB = loginB.body.user;

    // Register User C (no friends)
    const userCData = {
      username: userCPrefix,
      email: `${userCPrefix}@example.com`,
      password: `Abcdef1!${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' })}`,
    };
    await request(app).post('/api/auth/register').send(userCData).expect(201);
    const loginC = await request(app).post('/api/auth/login').send({
      username: userCData.username,
      password: userCData.password,
    }).expect(200);
    tokenC = loginC.body.tokens.accessToken;
    userC = loginC.body.user;

    // User A sends friend request to User B
    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(200);
    requestId = reqRes.body.id;

    // User B accepts friend request from User A
    await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'accept' })
      .expect(200);
  });

  afterEach(async () => {
    // Clean up all friendship_requests and users with the test prefix
    await prisma.friendship_requests.deleteMany({
      where: {
        OR: [
          { requester_id: userA?.id },
          { recipient_id: userA?.id },
          { requester_id: userB?.id },
          { recipient_id: userB?.id },
          { requester_id: userC?.id },
          { recipient_id: userC?.id },
        ],
      },
    });
    await prisma.users.deleteMany({
      where: {
        OR: [
          { username: { contains: userAPrefix } },
          { username: { contains: userBPrefix } },
          { username: { contains: userCPrefix } },
        ],
      },
    });
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .get('/api/friends');
    expect(res.status).toBe(401);
  });

  test('should return accepted friends for both users', async () => {
    // User A's friends
    const resA = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resA.status).toBe(200);
    expect(Array.isArray(resA.body.friends)).toBe(true);
    expect(
      resA.body.friends.some(
        (f) => f.id === userB.id && f.friendship.status === 'accepted',
      ),
    ).toBe(true);

    // Verify enhanced data structure for User A's friend (User B)
    const userBFriend = resA.body.friends.find((f) => f.id === userB.id);
    expect(userBFriend).toHaveProperty('username');
    expect(userBFriend).toHaveProperty('email');
    expect(userBFriend).toHaveProperty('friendship');
    expect(userBFriend).toHaveProperty('bag_stats');
    expect(userBFriend.bag_stats).toHaveProperty('total_bags');
    expect(userBFriend.bag_stats).toHaveProperty('visible_bags');
    expect(userBFriend.bag_stats).toHaveProperty('public_bags');

    // User B's friends
    const resB = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resB.status).toBe(200);
    expect(Array.isArray(resB.body.friends)).toBe(true);
    expect(
      resB.body.friends.some(
        (f) => f.id === userA.id && f.friendship.status === 'accepted',
      ),
    ).toBe(true);

    // Verify enhanced data structure for User B's friend (User A)
    const userAFriend = resB.body.friends.find((f) => f.id === userA.id);
    expect(userAFriend).toHaveProperty('username');
    expect(userAFriend).toHaveProperty('email');
    expect(userAFriend).toHaveProperty('friendship');
    expect(userAFriend).toHaveProperty('bag_stats');
    expect(userAFriend.bag_stats).toHaveProperty('total_bags');
    expect(userAFriend.bag_stats).toHaveProperty('visible_bags');
    expect(userAFriend.bag_stats).toHaveProperty('public_bags');
  });

  test('should return empty array if user has no accepted friends', async () => {
    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${tokenC}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.friends)).toBe(true);
    expect(res.body.friends.length).toBe(0);
  });
});
