import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('PATCH /api/bags/discs/:contentId/lost - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdBag;
  let createdDisc;
  let createdBagContent;

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];

    // Register user with unique identifier
    const password = `Test1!${chance.word({ length: 2 })}`;
    const userData = {
      username: `tbml${testId}`, // tbml for "test bag mark lost"
      email: `tbml${testId}@ex.co`,
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
    createdUserIds.push(user.id);

    // Create a test bag
    const bagData = {
      name: `Test Bag Lost ${testId}`,
      description: chance.sentence(),
      is_public: false,
      is_friends_visible: false,
    };
    const bagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);
    createdBag = bagRes.body.bag;

    // Create an approved test disc
    createdDisc = await prisma.disc_master.create({
      data: {
        brand: chance.company(),
        model: chance.word(),
        speed: chance.integer({ min: 1, max: 15 }),
        glide: chance.integer({ min: 1, max: 7 }),
        turn: chance.integer({ min: -5, max: 2 }),
        fade: chance.integer({ min: 0, max: 5 }),
        approved: true, // Pre-approved for testing
        added_by_id: user.id,
      },
    });

    // Add disc to bag to create content for testing
    const addToBagData = {
      disc_id: createdDisc.id,
      notes: chance.sentence(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
      condition: chance.pickone(['new', 'good', 'worn', 'beat-in']),
      plastic_type: chance.word(),
      color: chance.color({ format: 'name' }),
    };

    const addToBagRes = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(addToBagData)
      .expect(201);
    createdBagContent = addToBagRes.body.bag_content;
  });

  afterEach(async () => {
    // Clean up test data
    if (createdBagContent) {
      await prisma.bag_contents.deleteMany({
        where: { id: createdBagContent.id },
      });
    }

    if (createdDisc) {
      await prisma.disc_master.deleteMany({
        where: { id: createdDisc.id },
      });
    }

    if (createdBag) {
      await prisma.bags.deleteMany({
        where: { id: createdBag.id },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.users.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  });

  test('should mark disc as lost with notes and automatic date', async () => {
    const lostNotes = chance.sentence();
    const beforeTime = new Date();

    const response = await request(app)
      .patch(`/api/bags/discs/${createdBagContent.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: true,
        lost_notes: lostNotes,
      })
      .expect(200);

    const afterTime = new Date();

    expect(response.body.success).toBe(true);
    expect(response.body.bag_content).toBeDefined();
    expect(response.body.bag_content.is_lost).toBe(true);
    expect(response.body.bag_content.lost_notes).toBe(lostNotes);
    expect(response.body.bag_content.lost_at).toBeDefined();

    // Verify lost_at timestamp is reasonable
    const lostAt = new Date(response.body.bag_content.lost_at);
    expect(lostAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(lostAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  test('should mark disc as found and clear lost data', async () => {
    // First mark as lost
    await request(app)
      .patch(`/api/bags/discs/${createdBagContent.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: true,
        lost_notes: chance.sentence(),
      })
      .expect(200);

    // Then mark as found
    const response = await request(app)
      .patch(`/api/bags/discs/${createdBagContent.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: false,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.bag_content.is_lost).toBe(false);
    expect(response.body.bag_content.lost_notes).toBeNull();
    expect(response.body.bag_content.lost_at).toBeNull();
  });

  test('should return 404 for non-existent bag content', async () => {
    const fakeContentId = chance.guid();

    const response = await request(app)
      .patch(`/api/bags/discs/${fakeContentId}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({ is_lost: true })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not found or access denied/i);
  });

  test('should return 401 without authentication', async () => {
    await request(app)
      .patch(`/api/bags/discs/${createdBagContent.id}/lost`)
      .send({ is_lost: true })
      .expect(401);
  });

  test('should return 400 for missing is_lost field', async () => {
    const response = await request(app)
      .patch(`/api/bags/discs/${createdBagContent.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        lost_notes: chance.sentence(),
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/is_lost/i);
  });

  test('should return 400 for invalid is_lost value', async () => {
    const response = await request(app)
      .patch(`/api/bags/discs/${createdBagContent.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: 'not_boolean',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/is_lost/i);
  });

  test('should deny access to other users bag content', async () => {
    // Create another user
    const otherUserData = {
      username: `other${testId}`,
      email: `other${testId}@ex.co`,
      password: `Test1!${chance.word()}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);

    // Login as other user
    const otherLoginRes = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLoginRes.body.tokens.accessToken;
    createdUserIds.push(otherLoginRes.body.user.id);

    // Try to mark first user's disc as lost
    const response = await request(app)
      .patch(`/api/bags/discs/${createdBagContent.id}/lost`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ is_lost: true })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/not found or access denied/i);
  });
});
