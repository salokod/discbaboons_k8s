import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('GET /api/friends/requests - Integration', () => {
  let userA; let userB; let tokenA; let tokenB; let
    requestId;
  const userAPrefix = `req-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' })}`;
  const userBPrefix = `req-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' })}`;

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
    await query(
      'DELETE FROM friendship_requests WHERE requester_id = ANY($1) OR recipient_id = ANY($1)',
      [[userA?.id, userB?.id].filter(Boolean)],
    );
    await query(
      'DELETE FROM users WHERE username LIKE $1 OR username LIKE $2 OR username LIKE $3',
      ['test-friendreqs-c-%', `%${userAPrefix}%`, `%${userBPrefix}%`],
    );
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .get('/api/friends/requests')
      .query({ type: 'incoming' });
    expect(res.status).toBe(401);
  });

  test('should return incoming requests for recipient', async () => {
    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`)
      .query({ type: 'incoming' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requests)).toBe(true);
    expect(res.body.requests.some((r) => r.id === requestId)).toBe(true);
    expect(res.body.requests.every((r) => r.recipient_id === userB.id)).toBe(true);
  });

  test('should return outgoing requests for requester', async () => {
    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ type: 'outgoing' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requests)).toBe(true);
    expect(res.body.requests.some((r) => r.id === requestId)).toBe(true);
    expect(res.body.requests.every((r) => r.requester_id === userA.id)).toBe(true);
  });

  test('should return all requests for user', async () => {
    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenB}`)
      .query({ type: 'all' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requests)).toBe(true);
    // Should include at least the incoming request
    expect(res.body.requests.some((r) => r.id === requestId)).toBe(true);
  });

  test('should return empty array if user has no requests', async () => {
    // Register a new user with no requests
    const userCData = {
      username: `test-friendreqs-c-${chance.string({ length: 2 })}`,
      email: `test-friendreqs-c-${chance.string({ length: 2 })}@example.com`,
      password: `Abcdef1!${chance.word({ length: 5 })}`,
    };
    await request(app).post('/api/auth/register').send(userCData).expect(201);
    const loginC = await request(app).post('/api/auth/login').send({
      username: userCData.username,
      password: userCData.password,
    }).expect(200);
    const tokenC = loginC.body.tokens.accessToken;

    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenC}`)
      .query({ type: 'incoming' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requests)).toBe(true);
    expect(res.body.requests.length).toBe(0);
  });

  test('should return 400 for invalid type', async () => {
    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ type: 'foobar' });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/type must be/i);
  });
});
