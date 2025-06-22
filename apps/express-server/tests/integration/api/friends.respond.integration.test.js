import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('POST /api/friends/respond - Integration', () => {
  let userA; let userB; let tokenA; let tokenB; let
    requestId;
  const userAPrefix = `test-friendresp-a-${chance.string({ length: 2 })}`;
  const userBPrefix = `test-friendresp-b-${chance.string({ length: 2 })}`;

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

    // User A sends friend request to User B
    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(200);
    requestId = reqRes.body.id;
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
      .post('/api/friends/respond')
      .send({ requestId, action: 'accept' });
    expect(res.status).toBe(401);
  });

  test('should not allow non-recipient to respond', async () => {
    const res = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenA}`) // requester, not recipient
      .send({ requestId, action: 'accept' });
    expect(res.status).toBe(403); // or 401/400 depending on your error handling
    expect(res.body.error || res.body.message).toMatch(/not authorized/i);
  });

  test('should not allow invalid action', async () => {
    const res = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'foobar' });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/action/i);
  });

  test('should not allow responding to non-pending request', async () => {
    // Accept the request first
    await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'accept' })
      .expect(200);

    // Try to accept again
    const res = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'accept' });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/pending/i);
  });

  test('should allow recipient to accept a friend request', async () => {
    const res = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId, action: 'accept' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('accepted');
    expect(res.body.request.id).toBe(requestId);
  });

  test('should allow recipient to deny a friend request', async () => {
  // Clean up any existing requests between these users
    await prisma.friendship_requests.deleteMany({
      where: {
        requester_id: userA.id,
        recipient_id: userB.id,
      },
    });

    // Create a new request for this test
    const reqRes = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ recipientId: userB.id })
      .expect(200);
    const newRequestId = reqRes.body.id;

    const res = await request(app)
      .post('/api/friends/respond')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ requestId: newRequestId, action: 'deny' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('denied');
    expect(res.body.request.id).toBe(newRequestId);
  });
});
