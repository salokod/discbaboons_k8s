import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET /api/discs/pending - Integration', () => {
  let adminUser;
  let adminToken;
  let normalUser;
  let normalToken;

  // eslint-disable-next-line no-unused-vars
  let discs = [];
  const testBrand = `Brand-${chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz' })}`;
  const testModelA = `ModelA-${chance.string({ length: 5 })}`;
  const testModelB = `ModelB-${chance.string({ length: 5 })}`;
  const testModelC = `ModelC-${chance.string({ length: 5 })}`;

  beforeEach(async () => {
    // Clean up
    await prisma.users.deleteMany({ where: { email: { contains: 'test-disc-pending' } } });
    await prisma.disc_master.deleteMany({ where: { brand: testBrand } });

    // Register admin user
    const adminPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const adminData = {
      username: `testadmin_${chance.string({ length: 5 })}`,
      email: `test-disc-pending-admin-${chance.guid()}@example.com`,
      password: adminPassword,
    };
    await request(app).post('/api/auth/register').send(adminData).expect(201);
    // Make admin in DB
    adminUser = await prisma.users.update({
      where: { username: adminData.username },
      data: { is_admin: true },
    });
    // Login admin
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      username: adminData.username,
      password: adminData.password,
    }).expect(200);
    adminToken = adminLoginRes.body.tokens.accessToken;

    // Register normal user
    const userPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const userData = {
      username: `testuser_${chance.string({ length: 5 })}`,
      email: `test-disc-pending-user-${chance.guid()}@example.com`,
      password: userPassword,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    normalUser = await prisma.users.findUnique({ where: { username: userData.username } });
    // Login normal user
    const userLoginRes = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    normalToken = userLoginRes.body.tokens.accessToken;

    // Seed discs
    discs = await Promise.all([
      prisma.disc_master.create({
        data: {
          brand: testBrand,
          model: testModelA,
          speed: chance.integer({ min: 1, max: 14 }),
          glide: chance.integer({ min: 1, max: 7 }),
          turn: chance.integer({ min: -5, max: 2 }),
          fade: chance.integer({ min: 0, max: 5 }),
          approved: true,
          added_by_id: adminUser.id,
        },
      }),
      prisma.disc_master.create({
        data: {
          brand: testBrand,
          model: testModelB,
          speed: chance.integer({ min: 1, max: 14 }),
          glide: chance.integer({ min: 1, max: 7 }),
          turn: chance.integer({ min: -5, max: 2 }),
          fade: chance.integer({ min: 0, max: 5 }),
          approved: true,
          added_by_id: normalUser.id,
        },
      }),
      prisma.disc_master.create({
        data: {
          brand: testBrand,
          model: testModelC,
          speed: chance.integer({ min: 1, max: 14 }),
          glide: chance.integer({ min: 1, max: 7 }),
          turn: chance.integer({ min: -5, max: 2 }),
          fade: chance.integer({ min: 0, max: 5 }),
          approved: false,
          added_by_id: normalUser.id,
        },
      }),
    ]);
  });

  afterEach(async () => {
    await prisma.disc_master.deleteMany({ where: { brand: testBrand } });
    await prisma.users.deleteMany({ where: { email: { contains: 'test-disc-pending' } } });
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .get('/api/discs/pending');
    expect(res.status).toBe(401);
  });

  test('should forbid access for non-admin users', async () => {
    const res = await request(app)
      .get('/api/discs/pending')
      .set('Authorization', `Bearer ${normalToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  test('should allow admin to view only pending discs', async () => {
    const res = await request(app)
      .get('/api/discs/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((d) => d.approved === false)).toBe(true);
    expect(res.body.some((d) => d.model === testModelC)).toBe(true);
    // Should not include approved discs
    expect(res.body.some((d) => d.model === testModelA)).toBe(false);
    expect(res.body.some((d) => d.model === testModelB)).toBe(false);
  });
});
