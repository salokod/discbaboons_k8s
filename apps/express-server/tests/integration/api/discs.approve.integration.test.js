import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();
// Unique suffix for this test file run
const uniqueSuffix = chance.string({ length: 8, pool: 'abcdefghijklmnopqrstuvwxyz0123456789' });

describe('PATCH /api/discs/:id/approve - Integration', () => {
  // eslint-disable-next-line
  let adminUser;
  let adminToken;
  let normalUser;
  let normalToken;
  let pendingDisc;
  const testBrand = `Brand-${uniqueSuffix}`;
  const testModel = `Model-${chance.string({ length: 5 })}`;

  beforeEach(async () => {
    // Clean up only users/discs created by this test file
    await prisma.users.deleteMany({ where: { email: { contains: uniqueSuffix } } });
    await prisma.disc_master.deleteMany({ where: { brand: testBrand } });

    // Register admin user
    const adminPassword = `Abcdef1!${chance.word({ length: 5 })}`;
    const adminData = {
      username: `ta_${uniqueSuffix}`,
      email: `ta_${uniqueSuffix}@ex.co`,
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
      username: `tu_${uniqueSuffix}`,
      email: `tu_${uniqueSuffix}@ex.co`,
      password: userPassword,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    // Use the login response to get the user object (fix)
    const userLoginRes = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    normalUser = userLoginRes.body.user;
    normalToken = userLoginRes.body.tokens.accessToken;
    if (!normalUser || !normalUser.id) {
      throw new Error('Test setup failed: normalUser not found');
    }

    // Seed a pending disc
    pendingDisc = await prisma.disc_master.create({
      data: {
        brand: testBrand,
        model: testModel,
        speed: chance.integer({ min: 1, max: 14 }),
        glide: chance.integer({ min: 1, max: 7 }),
        turn: chance.integer({ min: -5, max: 2 }),
        fade: chance.integer({ min: 0, max: 5 }),
        approved: false,
        added_by_id: normalUser.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.disc_master.deleteMany({ where: { brand: testBrand } });
    await prisma.users.deleteMany({ where: { email: { contains: uniqueSuffix } } });
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .patch(`/api/discs/${pendingDisc.id}/approve`);
    expect(res.status).toBe(401);
  });

  test('should forbid access for non-admin users', async () => {
    const res = await request(app)
      .patch(`/api/discs/${pendingDisc.id}/approve`)
      .set('Authorization', `Bearer ${normalToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  test('should approve a pending disc for admin', async () => {
    const res = await request(app)
      .patch(`/api/discs/${pendingDisc.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: pendingDisc.id,
      brand: testBrand,
      model: testModel,
      approved: true,
    });

    // Confirm in DB
    const updated = await prisma.disc_master.findUnique({ where: { id: pendingDisc.id } });
    expect(updated).not.toBeNull();
    expect(updated.approved).toBe(true);
  });

  test('should 404 if disc does not exist', async () => {
    const res = await request(app)
      .patch(`/api/discs/${chance.guid}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
