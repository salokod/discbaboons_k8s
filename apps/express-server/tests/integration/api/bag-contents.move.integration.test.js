import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne, queryRows } from '../setup.js';

const chance = new Chance();

describe('PUT /api/bags/discs/move - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdSourceBag;
  let createdTargetBag;
  let createdDiscs = [];
  let createdBagContents = [];

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];
    createdDiscs = [];
    createdBagContents = [];

    // Register user with unique identifier
    const password = `Test1!${chance.word({ length: 2 })}`;
    const userData = {
      username: `tbmd${testId}`, // tbmd for "test bag move disc"
      email: `tbmd${testId}@ex.co`,
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

    // Create source and target bags
    const sourceBagData = {
      name: `Source Bag ${testId}`,
      description: 'Source bag for move testing',
      is_public: false,
      is_friends_visible: false,
    };
    const sourceBagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(sourceBagData)
      .expect(201);
    createdSourceBag = sourceBagRes.body.bag;

    const targetBagData = {
      name: `Target Bag ${testId}`,
      description: 'Target bag for move testing',
      is_public: false,
      is_friends_visible: false,
    };
    const targetBagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(targetBagData)
      .expect(201);
    createdTargetBag = targetBagRes.body.bag;

    // Create test discs and add them to source bag
    const discCount = chance.integer({ min: 3, max: 5 });
    const discPromises = Array.from({ length: discCount }).map(async (_, i) => {
      const disc = await queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [`TestBrand${testId}${i}`, `TestModel${testId}${i}`, 12, 5, -1, 3, true, user.id],
      );

      const addToBagData = {
        disc_id: disc.id,
        notes: `Test disc ${i} for moving`,
        weight: 175.0 + i,
        condition: 'good',
        plastic_type: 'Champion',
        color: 'Red',
      };

      const addToBagRes = await request(app)
        .post(`/api/bags/${createdSourceBag.id}/discs`)
        .set('Authorization', `Bearer ${token}`)
        .send(addToBagData)
        .expect(201);

      return { disc, bagContent: addToBagRes.body.bag_content };
    });

    const results = await Promise.all(discPromises);
    results.forEach(({ disc, bagContent }) => {
      createdDiscs.push(disc);
      createdBagContents.push(bagContent);
    });
  });

  afterEach(async () => {
    // Clean up test data
    if (createdBagContents.length > 0) {
      await query(
        'DELETE FROM bag_contents WHERE id = ANY($1)',
        [createdBagContents.map((bc) => bc.id)],
      );
    }

    if (createdSourceBag) {
      await query(
        'DELETE FROM bags WHERE id = $1',
        [createdSourceBag.id],
      );
    }

    if (createdTargetBag) {
      await query(
        'DELETE FROM bags WHERE id = $1',
        [createdTargetBag.id],
      );
    }

    if (createdDiscs.length > 0) {
      await query(
        'DELETE FROM disc_master WHERE id = ANY($1)',
        [createdDiscs.map((d) => d.id)],
      );
    }

    if (createdUserIds.length > 0) {
      await query(
        'DELETE FROM users WHERE id = ANY($1)',
        [createdUserIds],
      );
    }
  });

  test('should successfully move single disc between bags', async () => {
    const contentToMove = createdBagContents[0];
    const moveData = {
      sourceBagId: createdSourceBag.id,
      targetBagId: createdTargetBag.id,
      contentIds: [contentToMove.id],
    };

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${token}`)
      .send(moveData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Discs moved successfully');
    expect(response.body.movedCount).toBe(1);

    // Verify disc was moved to target bag
    const movedDisc = await queryOne(
      'SELECT * FROM bag_contents WHERE id = $1',
      [contentToMove.id],
    );
    expect(movedDisc.bag_id).toBe(createdTargetBag.id);
    expect(new Date(movedDisc.updated_at)).toBeInstanceOf(Date);
  });

  test('should successfully move multiple discs between bags', async () => {
    const contentsToMove = createdBagContents.slice(0, 2);
    const moveData = {
      sourceBagId: createdSourceBag.id,
      targetBagId: createdTargetBag.id,
      contentIds: contentsToMove.map((bc) => bc.id),
    };

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${token}`)
      .send(moveData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Discs moved successfully');
    expect(response.body.movedCount).toBe(2);

    // Verify discs were moved to target bag
    const movedDiscs = await queryRows(
      'SELECT * FROM bag_contents WHERE id = ANY($1)',
      [contentsToMove.map((content) => content.id)],
    );
    expect(movedDiscs).toHaveLength(contentsToMove.length);
    movedDiscs.forEach((disc) => {
      expect(disc.bag_id).toBe(createdTargetBag.id);
    });
  });

  test('should successfully move all discs when no contentIds provided', async () => {
    const moveData = {
      sourceBagId: createdSourceBag.id,
      targetBagId: createdTargetBag.id,
    };

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${token}`)
      .send(moveData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Discs moved successfully');
    expect(response.body.movedCount).toBe(createdBagContents.length);

    // Verify all discs were moved to target bag
    const allMovedDiscs = await queryRows(
      'SELECT * FROM bag_contents WHERE id = ANY($1)',
      [createdBagContents.map((bc) => bc.id)],
    );
    expect(allMovedDiscs).toHaveLength(createdBagContents.length);
    allMovedDiscs.forEach((disc) => {
      expect(disc.bag_id).toBe(createdTargetBag.id);
    });
  });

  test('should return 401 if no authorization token provided', async () => {
    const moveData = {
      sourceBagId: createdSourceBag.id,
      targetBagId: createdTargetBag.id,
    };

    await request(app)
      .put('/api/bags/discs/move')
      .send(moveData)
      .expect(401);
  });

  test('should return 404 for invalid bag UUID format', async () => {
    const moveData = {
      sourceBagId: 'invalid-uuid-format',
      targetBagId: createdTargetBag.id,
    };

    const response = await request(app)
      .put('/api/bags/discs/move')
      .set('Authorization', `Bearer ${token}`)
      .send(moveData)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Bags not found or access denied');
  });
});
