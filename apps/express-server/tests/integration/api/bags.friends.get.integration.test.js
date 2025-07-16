import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET /api/bags/friends/:friendUserId/:bagId - Integration', () => {
  let userA; let userB; let userC; let tokenA; let tokenB;
  let requestId;
  let testId;
  let createdUserIds = [];
  let createdBagIds = [];

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];
    createdBagIds = [];

    // Register User A (will view friend's bag)
    const userAData = {
      username: `tfbga${testId}`, // tfbga = "test friend bag get A"
      email: `tfbga${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(userAData).expect(201);
    const loginA = await request(app).post('/api/auth/login').send({
      username: userAData.username,
      password: userAData.password,
    }).expect(200);
    tokenA = loginA.body.tokens.accessToken;
    userA = loginA.body.user;
    createdUserIds.push(userA.id);

    // Register User B (friend who owns bags)
    const userBData = {
      username: `tfbgb${testId}`, // tfbgb = "test friend bag get B"
      email: `tfbgb${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(userBData).expect(201);
    const loginB = await request(app).post('/api/auth/login').send({
      username: userBData.username,
      password: userBData.password,
    }).expect(200);
    tokenB = loginB.body.tokens.accessToken;
    userB = loginB.body.user;
    createdUserIds.push(userB.id);

    // Register User C (non-friend)
    const userCData = {
      username: `tfbgc${testId}`, // tfbgc = "test friend bag get C"
      email: `tfbgc${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(userCData).expect(201);
    const loginC = await request(app).post('/api/auth/login').send({
      username: userCData.username,
      password: userCData.password,
    }).expect(200);
    userC = loginC.body.user;
    createdUserIds.push(userC.id);

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
    // Clean up bag contents first (foreign key constraints)
    if (createdBagIds.length > 0) {
      await prisma.bag_contents.deleteMany({
        where: {
          bag_id: { in: createdBagIds },
        },
      });
    }

    // Clean up bags
    if (createdBagIds.length > 0) {
      await prisma.bags.deleteMany({
        where: {
          id: { in: createdBagIds },
        },
      });
    }

    // Clean up friendship_requests
    if (createdUserIds.length > 0) {
      await prisma.friendship_requests.deleteMany({
        where: {
          OR: [
            { requester_id: { in: createdUserIds } },
            { recipient_id: { in: createdUserIds } },
          ],
        },
      });

      // Clean up users
      await prisma.users.deleteMany({
        where: {
          id: { in: createdUserIds },
        },
      });
    }
  });

  test('should require authentication', async () => {
    const bagId = chance.guid();
    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}/${bagId}`)
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should return 400 for invalid friendUserId format', async () => {
    const bagId = chance.guid();
    const res = await request(app)
      .get(`/api/bags/friends/invalid/${bagId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'friendUserId must be a valid integer',
    });
  });

  test('should return 400 for invalid bagId format', async () => {
    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}/invalid-uuid`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Invalid bagId format',
    });
  });

  test('should return 403 when users are not friends', async () => {
    const bagId = chance.guid();
    const res = await request(app)
      .get(`/api/bags/friends/${userC.id}/${bagId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You are not friends with this user',
    });
  });

  test('should return 403 for private bag', async () => {
    // Create private bag for User B
    const privateBagData = {
      name: `PrivateBag-${testId}`,
      description: 'This is a private bag',
      is_public: false,
      is_friends_visible: false,
    };
    const privateBagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${tokenB}`)
      .send(privateBagData)
      .expect(201);
    createdBagIds.push(privateBagRes.body.bag.id);

    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}/${privateBagRes.body.bag.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found or not visible',
    });
  });

  test('should return 403 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();
    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found or not visible',
    });
  });

  test('should return public bag with empty contents', async () => {
    // Create public bag for User B
    const publicBagData = {
      name: `PublicBag-${testId}`,
      description: 'This is a public bag',
      is_public: true,
      is_friends_visible: false,
    };
    const publicBagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${tokenB}`)
      .send(publicBagData)
      .expect(201);
    createdBagIds.push(publicBagRes.body.bag.id);

    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}/${publicBagRes.body.bag.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bag: {
        id: publicBagRes.body.bag.id,
        name: publicBagData.name,
        description: publicBagData.description,
        is_public: true,
        is_friends_visible: false,
        contents: [],
      },
    });
  });

  test('should return friends-visible bag with empty contents', async () => {
    // Create friends-visible bag for User B
    const friendsBagData = {
      name: `FriendsBag-${testId}`,
      description: 'This is a friends-visible bag',
      is_public: false,
      is_friends_visible: true,
    };
    const friendsBagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${tokenB}`)
      .send(friendsBagData)
      .expect(201);
    createdBagIds.push(friendsBagRes.body.bag.id);

    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}/${friendsBagRes.body.bag.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bag: {
        id: friendsBagRes.body.bag.id,
        name: friendsBagData.name,
        is_friends_visible: true,
        contents: [],
      },
    });
  });

  test('should work bidirectionally - User B can view User A bag', async () => {
    // Create bag for User A
    const userABagData = {
      name: `UserABag-${testId}`,
      description: 'User A bag',
      is_public: false,
      is_friends_visible: true,
    };
    const userABagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(userABagData)
      .expect(201);
    createdBagIds.push(userABagRes.body.bag.id);

    // User B should be able to view User A's bag
    const res = await request(app)
      .get(`/api/bags/friends/${userA.id}/${userABagRes.body.bag.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      friend: {
        id: userA.id,
      },
      bag: {
        id: userABagRes.body.bag.id,
        name: userABagData.name,
        contents: [],
      },
    });
  });
});
