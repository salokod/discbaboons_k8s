import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('POST /api/discs/master - Integration', () => {
  let user;
  let token;
  let createdDisc;
  const testBrand = `Brand-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })}`;
  const testModel = `Model-${chance.string({ length: 5 })}`;

  beforeEach(async () => {
    // Clean up
    await prisma.users.deleteMany({ where: { email: { contains: 'test-disc-create' } } });
    await prisma.disc_master.deleteMany({ where: { brand: testBrand } });

    // Register user
    const password = `Abcdef1!${chance.word({ length: 5 })}`;
    const userData = {
      username: `testdiscuser_${chance.string({ length: 5 })}`,
      email: `test-disc-create-${chance.guid()}@example.com`,
      password,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);

    // Login
    const loginRes = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = loginRes.body.tokens.accessToken;
    user = loginRes.body.user;
  });

  afterEach(async () => {
    await prisma.disc_master.deleteMany({ where: { brand: testBrand } });
    await prisma.users.deleteMany({ where: { email: { contains: 'test-disc-create' } } });
  });

  test('should require authentication', async () => {
    const discData = {
      brand: testBrand,
      model: testModel,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };
    const res = await request(app)
      .post('/api/discs/master')
      .send(discData);
    expect(res.status).toBe(401);
  });

  test('should create a disc with pending approval and return the created disc', async () => {
    const discData = {
      brand: testBrand,
      model: testModel,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
    };

    const res = await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(201);

    expect(res.body).toMatchObject({
      brand: discData.brand,
      model: discData.model,
      speed: discData.speed,
      glide: discData.glide,
      turn: discData.turn,
      fade: discData.fade,
      approved: false,
      added_by_id: user.id,
    });

    // Confirm in DB
    createdDisc = await prisma.disc_master.findUnique({
      where: { id: res.body.id },
    });
    expect(createdDisc).not.toBeNull();
    expect(createdDisc.brand).toBe(discData.brand);
    expect(createdDisc.model).toBe(discData.model);
    expect(createdDisc.approved).toBe(false);
    expect(createdDisc.added_by_id).toBe(user.id);
  });

  test('should fail with 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/discs/master')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // missing all fields
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/required/i);
  });
});
