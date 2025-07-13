import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('GET /api/bags/friends/:friendUserId - Integration', () => {
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

    // Register User A (will view friend's bags)
    const userAData = {
      username: `tfba${testId}`, // tfba = "test friend bags A"
      email: `tfba${testId}@ex.co`,
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
      username: `tfbb${testId}`, // tfbb = "test friend bags B"
      email: `tfbb${testId}@ex.co`,
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
      username: `tfbc${testId}`, // tfbc = "test friend bags C"
      email: `tfbc${testId}@ex.co`,
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
    // Clean up bags first (foreign key constraints)
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
    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}`)
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should return 400 for invalid friendUserId format', async () => {
    const res = await request(app)
      .get('/api/bags/friends/invalid')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'friendUserId must be a valid integer',
    });
  });

  test('should return 403 when users are not friends', async () => {
    const res = await request(app)
      .get(`/api/bags/friends/${userC.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(403);

    expect(res.body).toMatchObject({
      success: false,
      message: 'You are not friends with this user',
    });
  });

  test('should return friends visible bags with disc counts', async () => {
    // Create bags for User B with different visibility settings
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

    // User A should be able to see User B's visible bags
    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bags: expect.arrayContaining([
        expect.objectContaining({
          name: publicBagData.name,
          is_public: true,
          disc_count: 0,
        }),
        expect.objectContaining({
          name: friendsBagData.name,
          is_friends_visible: true,
          disc_count: 0,
        }),
      ]),
    });

    // Should NOT include the private bag
    expect(res.body.bags).toHaveLength(2);
    expect(res.body.bags.find((bag) => bag.name === privateBagData.name)).toBeUndefined();
  });

  test('should work bidirectionally - User B can view User A bags', async () => {
    // Create a friends-visible bag for User A
    const userABagData = {
      name: `UserABag-${testId}`,
      description: 'User A friends bag',
      is_public: false,
      is_friends_visible: true,
    };
    const userABagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(userABagData)
      .expect(201);
    createdBagIds.push(userABagRes.body.bag.id);

    // User B should be able to see User A's visible bags
    const res = await request(app)
      .get(`/api/bags/friends/${userA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      friend: {
        id: userA.id,
      },
      bags: expect.arrayContaining([
        expect.objectContaining({
          name: userABagData.name,
          is_friends_visible: true,
          disc_count: 0,
        }),
      ]),
    });
  });

  test('should return empty bags array if friend has no visible bags', async () => {
    // User B has no bags, or only private bags
    const res = await request(app)
      .get(`/api/bags/friends/${userB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      friend: {
        id: userB.id,
      },
      bags: [],
    });
  });
});
