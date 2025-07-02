import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('PUT /api/bags/:id/discs/:contentId - Integration', () => {
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
      username: `tbed${testId}`, // tbed for "test bag edit disc"
      email: `tbed${testId}@ex.co`,
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
      name: `Test Bag Edit ${testId}`,
      description: 'Test bag for editing disc content',
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

    // Add disc to bag to create content for editing
    const addToBagData = {
      disc_id: createdDisc.id,
      notes: 'Original notes',
      weight: 175.0,
      condition: 'good',
      plastic_type: 'Champion',
      color: 'Red',
      speed: 11, // Custom flight number
      glide: 6, // Custom flight number
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

  test('should successfully edit bag content with authentication', async () => {
    const updateData = {
      notes: 'Updated notes for testing',
      weight: 174.5,
      condition: 'worn',
      plastic_type: 'Star',
      color: 'Blue',
      speed: chance.integer({ min: 1, max: 15 }), // Updated flight number
      glide: chance.integer({ min: 1, max: 7 }), // Updated flight number
      turn: chance.integer({ min: -5, max: 2 }), // New flight number
      fade: chance.integer({ min: 0, max: 5 }), // New flight number
      brand: chance.word(), // Custom disc name
      model: chance.word(), // Custom disc model
    };

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.bag_content).toBeDefined();
    expect(response.body.bag_content.id).toBe(createdBagContent.id);
    expect(response.body.bag_content.notes).toBe(updateData.notes);
    expect(Number(response.body.bag_content.weight)).toBe(updateData.weight);
    expect(response.body.bag_content.condition).toBe(updateData.condition);
    expect(response.body.bag_content.plastic_type).toBe(updateData.plastic_type);
    expect(response.body.bag_content.color).toBe(updateData.color);
    expect(response.body.bag_content.speed).toBe(updateData.speed);
    expect(response.body.bag_content.glide).toBe(updateData.glide);
    expect(response.body.bag_content.turn).toBe(updateData.turn);
    expect(response.body.bag_content.fade).toBe(updateData.fade);
  });

  test('should return 401 if no authorization token provided', async () => {
    const updateData = { notes: 'Should fail without auth' };

    await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .send(updateData)
      .expect(401);
  });

  test('should return 400 for invalid speed value', async () => {
    const updateData = { speed: 16 }; // Invalid: speed must be 1-15

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/speed must be between 1 and 15/i);
  });

  test('should return 400 for invalid glide value', async () => {
    const updateData = { glide: 8 }; // Invalid: glide must be 1-7

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/glide must be between 1 and 7/i);
  });

  test('should return 400 for invalid turn value', async () => {
    const updateData = { turn: 3 }; // Invalid: turn must be -5 to 2

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/turn must be between -5 and 2/i);
  });

  test('should return 400 for invalid fade value', async () => {
    const updateData = { fade: 6 }; // Invalid: fade must be 0-5

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/fade must be between 0 and 5/i);
  });

  test('should return 403 if user tries to edit content from another user\'s bag', async () => {
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

    const updateData = { notes: 'Should not be allowed' };

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send(updateData);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/access denied/i);
  });

  test('should return 404 if bag content does not exist', async () => {
    const nonExistentContentId = '00000000-0000-4000-8000-000000000000';
    const updateData = { notes: 'Should not find content' };

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${nonExistentContentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/access denied/i);
  });

  test('should allow partial updates (only some fields)', async () => {
    const updateData = {
      notes: 'Only updating notes',
    };

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.bag_content.notes).toBe(updateData.notes);
    // Other fields should remain unchanged
    expect(Number(response.body.bag_content.weight)).toBe(175.0);
    expect(response.body.bag_content.condition).toBe('good');
  });

  test('should return 400 for brand exceeding 50 characters', async () => {
    const updateData = { brand: 'a'.repeat(51) }; // 51 characters, exceeds limit

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/brand must be a string with maximum 50 characters/i);
  });

  test('should return 400 for model exceeding 50 characters', async () => {
    const updateData = { model: 'b'.repeat(51) }; // 51 characters, exceeds limit

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/model must be a string with maximum 50 characters/i);
  });

  test('should return 400 for non-string brand', async () => {
    const updateData = { brand: chance.integer() }; // Not a string

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/brand must be a string with maximum 50 characters/i);
  });

  test('should successfully update only brand and model', async () => {
    const updateData = {
      brand: chance.word(),
      model: chance.word(),
    };

    const response = await request(app)
      .put(`/api/bags/${createdBag.id}/discs/${createdBagContent.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.bag_content.brand).toBe(updateData.brand);
    expect(response.body.bag_content.model).toBe(updateData.model);
    // Other fields should remain unchanged
    expect(Number(response.body.bag_content.weight)).toBe(175.0);
    expect(response.body.bag_content.condition).toBe('good');
  });
});
