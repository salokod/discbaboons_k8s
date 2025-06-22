import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('POST /api/friends/request - Integration', () => {
  let userA; let userB; let tokenA; let
    tokenB;

  const userAPrefix = `test-friendreq-a-${chance.string({ length: 2 })}`;
  const userBPrefix = `test-friendreq-b-${chance.string({ length: 2 })}`;

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
      username: `${userBPrefix}`,
      email: `${userBPrefix}@example.com`,
      password: `Abcdef1!${chance.word({ length: 5 })}`,
    };
    await request(app).post('/api/auth/register').send(userBData).expect(201);
    const loginB = await request(app).post('/api/auth/login').send({
      username: userBData.username,
      password: userBData.password,
    }).expect(200);
    tokenB = loginB.body.tokens.accessToken;
    userB = loginB.body.user;
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
        ],
      },
    });
    await prisma.users.deleteMany({
      where: {
        OR: [
          { username: { contains: userAPrefix } },
          { username: { contains: userBPrefix } },
        ],
      },
    });
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .send({ recipientId: userB.id });
    expect(res.status).toBe(401);
  });

  test('should not allow sending request to self', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userA.id });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/yourself/i);
  });

  test('should create a friend request', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.requester_id).toBe(userA.id);
    expect(res.body.recipient_id).toBe(userB.id);
    expect(res.body.status).toBe('pending');
  });

  test('should not allow duplicate friend requests', async () => {
    // First request
    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(200);

    // Duplicate request
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/already exists/i);
  });

  test('should not allow reverse friend request if pending', async () => {
    // User A requests User B
    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(200);

    // User B tries to request User A (reverse)
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ recipientId: userA.id });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/already exists/i);
  });

  test('should allow a new request if reverse request was denied', async () => {
  // User B requests User A and gets denied
    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ recipientId: userA.id })
      .expect(200);

    // Simulate denial in DB
    await prisma.friendship_requests.updateMany({
      where: { requester_id: userB.id, recipient_id: userA.id },
      data: { status: 'denied' },
    });

    // Now User A can request User B
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });

    expect(res.status).toBe(200);
    expect(res.body.requester_id).toBe(userA.id);
    expect(res.body.recipient_id).toBe(userB.id);
    expect(res.body.status).toBe('pending');
  });

  test('should not allow a new request if reverse request was accepted', async () => {
  // User B requests User A and gets accepted
    await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ recipientId: userA.id })
      .expect(200);

    // Simulate acceptance in DB
    await prisma.friendship_requests.updateMany({
      where: { requester_id: userB.id, recipient_id: userA.id },
      data: { status: 'accepted' },
    });

    // Now User A cannot request User B
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id });

    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/already exists/i);
  });
});
