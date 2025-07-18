import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('POST /api/bags/:id/discs - Integration', () => {
  let user;
  let token;
  let testId;
  let timestamp;
  let createdUserIds = [];
  let createdBag;
  let createdDisc;

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `bc${timestamp}${random}`;
    createdUserIds = [];

    // Register user with unique identifier
    const password = `Test1!${chance.word({ length: 2 })}`;
    const userData = {
      username: `tbc${timestamp}`, // tbc for "test bag content"
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

    // Create an approved test disc with dynamic flight numbers
    const discSpeed = chance.integer({ min: 1, max: 14 });
    const discGlide = chance.integer({ min: 1, max: 7 });
    const discTurn = chance.integer({ min: -5, max: 2 });
    const discFade = chance.integer({ min: 0, max: 5 });

    createdDisc = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [`TestBrand${testId}`, `TestModel${testId}`, discSpeed, discGlide, discTurn, discFade, true, user.id],
    );
  });

  afterEach(async () => {
    // Clean up test data in proper order to avoid foreign key violations
    // 1. Delete bag_contents first (has foreign keys to bags and disc_master)
    if (createdDisc) {
      await query('DELETE FROM bag_contents WHERE disc_id = $1', [createdDisc.id]);
    }

    // 2. Delete bags (has foreign key to users)
    if (createdBag) {
      await query('DELETE FROM bags WHERE id = $1', [createdBag.id]);
    }

    // 3. Delete disc_master (has foreign key to users)
    if (createdDisc) {
      await query('DELETE FROM disc_master WHERE id = $1', [createdDisc.id]);
    }

    // 4. Delete users last (referenced by other tables)
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
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

  test('should successfully add disc with custom flight numbers', async () => {
    const discData = {
      disc_id: createdDisc.id,
      notes: 'Custom flight numbers',
      speed: 9,
      glide: 4,
      turn: -2,
      fade: 2,
      weight: 170.0,
      condition: 'good',
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
      speed: discData.speed,
      glide: discData.glide,
      turn: discData.turn,
      fade: discData.fade,
      weight: discData.weight.toString(),
      condition: discData.condition,
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
      username: `oth${timestamp}`,
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

  test('should successfully add disc with custom brand and model', async () => {
    const discData = {
      disc_id: createdDisc.id,
      notes: chance.sentence(),
      brand: chance.word(),
      model: chance.word(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
      condition: chance.pickone(['new', 'good', 'worn', 'beat-in']),
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
      brand: discData.brand,
      model: discData.model,
      weight: discData.weight.toString(),
      condition: discData.condition,
      is_lost: false,
    });
  });

  test('should return 400 for brand exceeding 50 characters', async () => {
    const discData = {
      disc_id: createdDisc.id,
      brand: 'a'.repeat(51), // 51 characters, exceeds limit
    };

    const res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/brand must be a string with maximum 50 characters/i);
  });

  test('should return 400 for model exceeding 50 characters', async () => {
    const discData = {
      disc_id: createdDisc.id,
      model: 'b'.repeat(51), // 51 characters, exceeds limit
    };

    const res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/model must be a string with maximum 50 characters/i);
  });

  test('should return 400 for non-string brand', async () => {
    const discData = {
      disc_id: createdDisc.id,
      brand: 123, // Not a string
    };

    const res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(discData)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/brand must be a string with maximum 50 characters/i);
  });
});
