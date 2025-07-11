import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('DELETE /api/bags/discs/:contentId - Integration', () => {
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
      username: `tbrd${testId}`, // tbrd for "test bag remove disc"
      email: `tbrd${testId}@ex.co`,
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
      name: `Test Bag Remove ${testId}`,
      description: 'Test bag for removing disc content',
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
        brand: `TestBrand${testId}`,
        model: `TestModel${testId}`,
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
        approved: true, // Pre-approved for testing
        added_by_id: user.id,
      },
    });

    // Add disc to bag to create content for removal
    const addToBagData = {
      disc_id: createdDisc.id,
      notes: 'Disc to be removed',
      weight: 175.0,
      condition: 'good',
      plastic_type: 'Champion',
      color: 'Red',
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

    if (createdBag) {
      await prisma.bags.deleteMany({
        where: { id: createdBag.id },
      });
    }

    if (createdDisc) {
      await prisma.disc_master.deleteMany({
        where: { id: createdDisc.id },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.users.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  });

  test('should successfully remove disc content with authentication', async () => {
    const response = await request(app)
      .delete(`/api/bags/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Disc removed from your account successfully');

    // Verify disc is actually deleted from database
    const deletedContent = await prisma.bag_contents.findUnique({
      where: { id: createdBagContent.id },
    });
    expect(deletedContent).toBeNull();

    // Clear the reference so afterEach doesn't try to delete it
    createdBagContent = null;
  });

  test('should return 401 if no authorization token provided', async () => {
    await request(app)
      .delete(`/api/bags/discs/${createdBagContent.id}`)
      .expect(401);
  });

  test('should return 404 for invalid UUID format', async () => {
    const invalidUuid = 'invalid-uuid-format';

    const response = await request(app)
      .delete(`/api/bags/discs/${invalidUuid}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Disc not found or access denied');
  });

  test('should return 404 for non-existent content ID', async () => {
    const nonExistentContentId = '00000000-0000-4000-8000-000000000000';

    const response = await request(app)
      .delete(`/api/bags/discs/${nonExistentContentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Disc not found or access denied');
  });

  test('should return 404 if user tries to remove content from another user\'s account', async () => {
    // Create another user
    const otherUserData = {
      username: `other${testId}`,
      email: `other${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };

    await request(app).post('/api/auth/register').send(otherUserData).expect(201);

    // Login as other user
    const otherLoginRes = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLoginRes.body.tokens.accessToken;
    createdUserIds.push(otherLoginRes.body.user.id);

    const response = await request(app)
      .delete(`/api/bags/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Disc not found or access denied');

    // Verify disc still exists (wasn't deleted by wrong user)
    const stillExists = await prisma.bag_contents.findUnique({
      where: { id: createdBagContent.id },
    });
    expect(stillExists).toBeTruthy();
  });

  test('should handle concurrent removal attempts gracefully', async () => {
    // First removal should succeed
    const response1 = await request(app)
      .delete(`/api/bags/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response1.body.success).toBe(true);

    // Second removal should return 404 (already deleted)
    const response2 = await request(app)
      .delete(`/api/bags/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response2.body.success).toBe(false);
    expect(response2.body.message).toBe('Disc not found or access denied');

    // Clear the reference so afterEach doesn't try to delete it
    createdBagContent = null;
  });
});
