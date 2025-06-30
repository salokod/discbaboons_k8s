import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('POST /api/bags/:id/discs - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdBag;
  let createdDisc;

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];

    // Register user with unique identifier
    const password = `Test1!${chance.word({ length: 2 })}`;
    const userData = {
      username: `tbc${testId}`, // tbc for "test bag content"
      email: `tbc${testId}@ex.co`,
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
      name: `Test Bag ${testId}`,
      description: 'Test bag for disc content',
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
        brand: 'Test Brand',
        model: `Test Model ${testId}`,
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
        approved: true,
        added_by_id: user.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    if (createdDisc) {
      await prisma.bag_contents.deleteMany({ where: { disc_id: createdDisc.id } });
      await prisma.disc_master.delete({ where: { id: createdDisc.id } });
    }
    if (createdUserIds.length > 0) {
      await prisma.bags.deleteMany({ where: { user_id: { in: createdUserIds } } });
      await prisma.users.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  });

  test('should successfully add disc to bag', async () => {
    const discData = {
      disc_id: createdDisc.id,
      notes: 'My favorite driver',
      weight: 175.0,
      condition: 'good',
      plastic_type: 'Champion',
      color: 'Red',
    };

    const res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.bag_content).toMatchObject({
      user_id: user.id,
      bag_id: createdBag.id,
      disc_id: createdDisc.id,
      notes: discData.notes,
      weight: discData.weight.toString(), // Prisma returns Decimal as string
      condition: discData.condition,
      plastic_type: discData.plastic_type,
      color: discData.color,
      is_lost: false,
    });
    expect(res.body.bag_content.id).toBeDefined();
  });

  test('should return 401 when not authenticated', async () => {
    const discData = { disc_id: createdDisc.id };

    await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .send(discData)
      .expect(401);
  });

  test('should return 400 when disc_id is missing', async () => {
    const discData = {
      notes: 'Missing disc_id',
    };

    const res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('disc_id is required');
  });

  test('should return 403 when trying to add disc to another user\'s bag', async () => {
    // Create another user and their bag
    const otherUserData = {
      username: `other${testId}`,
      email: `other${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);

    const otherLoginRes = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLoginRes.body.tokens.accessToken;
    const otherUser = otherLoginRes.body.user;
    createdUserIds.push(otherUser.id);

    const otherBagData = {
      name: `Other Bag ${testId}`,
      description: 'Another user\'s bag',
    };
    const otherBagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${otherToken}`)
      .send(otherBagData)
      .expect(201);

    // Try to add disc to other user's bag
    const discData = { disc_id: createdDisc.id };

    const res = await request(app)
      .post(`/api/bags/${otherBagRes.body.bag.id}/discs`)
      .set('Authorization', `Bearer ${token}`) // Using first user's token
      .send(discData)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Bag not found or access denied');
  });

  test('should return 404 when disc does not exist', async () => {
    const discData = {
      disc_id: chance.guid({ version: 4 }), // Non-existent disc
    };

    const res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Disc not found');
  });
});
