import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('GET /api/bags/lost-discs - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdBag;
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
      username: `tbll${testId}`, // tbll for "test bag list lost"
      email: `tbll${testId}@ex.co`,
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
      name: `Test Bag List Lost ${testId}`,
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
  });

  afterEach(async () => {
    // Clean up test data
    if (createdBagContents.length > 0) {
      await query(
        'DELETE FROM bag_contents WHERE id = ANY($1)',
        [createdBagContents.map((c) => c.id)],
      );
    }

    if (createdDiscs.length > 0) {
      await query(
        'DELETE FROM disc_master WHERE id = ANY($1)',
        [createdDiscs.map((d) => d.id)],
      );
    }

    if (createdBag) {
      await query(
        'DELETE FROM bags WHERE id = $1',
        [createdBag.id],
      );
    }

    if (createdUserIds.length > 0) {
      await query(
        'DELETE FROM users WHERE id = ANY($1)',
        [createdUserIds],
      );
    }
  });

  test('should return empty list when user has no lost discs', async () => {
    const response = await request(app)
      .get('/api/bags/lost-discs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.lost_discs).toEqual([]);
    expect(response.body.pagination).toEqual({
      total: 0,
      limit: 30,
      offset: 0,
      has_more: false,
    });
  });

  test('should return lost discs with merged flight numbers and disc info', async () => {
    // Create test discs
    const disc1 = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [chance.company(), chance.word(), 12, 5, -1, 3, true, user.id],
    );
    createdDiscs.push(disc1);

    const disc2 = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [chance.company(), chance.word(), 9, 4, -2, 2, true, user.id],
    );
    createdDiscs.push(disc2);

    // Add discs to bag first
    const content1Res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        disc_id: disc1.id,
        notes: chance.sentence(),
        weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
        condition: 'good',
        plastic_type: 'Champion',
        color: 'Red',
        // Custom flight numbers that override disc_master
        speed: 13, // Override from 12 to 13
        turn: 0, // Override from -1 to 0
        // glide and fade will use disc_master values
        brand: 'Custom Brand', // Override brand
        // model will use disc_master value
      })
      .expect(201);
    createdBagContents.push(content1Res.body.bag_content);

    const content2Res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        disc_id: disc2.id,
        notes: chance.sentence(),
        // No custom overrides - should use all disc_master values
      })
      .expect(201);
    createdBagContents.push(content2Res.body.bag_content);

    // Mark both discs as lost
    const lostNotes1 = 'Lost at hole 12';
    const lostNotes2 = 'Lost in water hazard';

    await request(app)
      .patch(`/api/bags/discs/${content1Res.body.bag_content.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: true,
        lost_notes: lostNotes1,
      })
      .expect(200);

    await request(app)
      .patch(`/api/bags/discs/${content2Res.body.bag_content.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: true,
        lost_notes: lostNotes2,
      })
      .expect(200);

    // Get lost discs
    const response = await request(app)
      .get('/api/bags/lost-discs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.lost_discs).toHaveLength(2);
    expect(response.body.pagination.total).toBe(2);

    // Find discs in response (order might vary due to timestamps)
    const lostDisc1 = response.body.lost_discs.find((d) => d.lost_notes === lostNotes1);
    const lostDisc2 = response.body.lost_discs.find((d) => d.lost_notes === lostNotes2);

    expect(lostDisc1).toBeDefined();
    expect(lostDisc2).toBeDefined();

    // Verify merged data for disc1 (with custom overrides)
    expect(lostDisc1.speed).toBe(13); // Custom override
    expect(lostDisc1.glide).toBe(5); // From disc_master
    expect(lostDisc1.turn).toBe(0); // Custom override
    expect(lostDisc1.fade).toBe(3); // From disc_master
    expect(lostDisc1.brand).toBe('Custom Brand'); // Custom override
    expect(lostDisc1.model).toBe(disc1.model); // From disc_master
    expect(lostDisc1.is_lost).toBe(true);
    expect(lostDisc1.lost_notes).toBe(lostNotes1);
    expect(lostDisc1.lost_at).toBeDefined();
    expect(lostDisc1.disc_master).toBeDefined();

    // Verify merged data for disc2 (no custom overrides)
    expect(lostDisc2.speed).toBe(disc2.speed); // From disc_master
    expect(lostDisc2.glide).toBe(disc2.glide); // From disc_master
    expect(lostDisc2.turn).toBe(disc2.turn); // From disc_master
    expect(lostDisc2.fade).toBe(disc2.fade); // From disc_master
    expect(lostDisc2.brand).toBe(disc2.brand); // From disc_master
    expect(lostDisc2.model).toBe(disc2.model); // From disc_master
    expect(lostDisc2.is_lost).toBe(true);
    expect(lostDisc2.lost_notes).toBe(lostNotes2);
    expect(lostDisc2.lost_at).toBeDefined();
  });

  test('should handle pagination parameters', async () => {
    // Create and mark 5 discs as lost
    const discCreationPromises = Array.from({ length: 5 }, async (_, i) => {
      const speed = chance.integer({ min: 1, max: 15 });
      const glide = chance.integer({ min: 1, max: 7 });
      const turn = chance.integer({ min: -5, max: 2 });
      const fade = chance.integer({ min: 0, max: 5 });

      const disc = await queryOne(
        'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [chance.company(), chance.word(), speed, glide, turn, fade, true, user.id],
      );
      createdDiscs.push(disc);

      const contentRes = await request(app)
        .post(`/api/bags/${createdBag.id}/discs`)
        .set('Authorization', `Bearer ${token}`)
        .send({ disc_id: disc.id })
        .expect(201);
      createdBagContents.push(contentRes.body.bag_content);

      await request(app)
        .patch(`/api/bags/discs/${contentRes.body.bag_content.id}/lost`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          is_lost: true,
          lost_notes: `Lost disc ${i + 1}`,
        })
        .expect(200);
    });

    await Promise.all(discCreationPromises);

    // Test pagination
    const response = await request(app)
      .get('/api/bags/lost-discs?limit=3&offset=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.lost_discs).toHaveLength(3);
    expect(response.body.pagination).toEqual({
      total: 5,
      limit: 3,
      offset: 1,
      has_more: true,
    });
  });

  test('should handle sorting parameters', async () => {
    // Create and mark 2 discs as lost with different timestamps
    const disc1 = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      ['Brand A', 'Model A', 10, 4, -1, 2, true, user.id],
    );
    createdDiscs.push(disc1);

    const content1Res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disc_id: disc1.id })
      .expect(201);
    createdBagContents.push(content1Res.body.bag_content);

    // Mark first disc as lost
    await request(app)
      .patch(`/api/bags/discs/${content1Res.body.bag_content.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: true,
        lost_notes: 'First lost',
      })
      .expect(200);

    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    const disc2 = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      ['Brand B', 'Model B', 11, 5, 0, 3, true, user.id],
    );
    createdDiscs.push(disc2);

    const content2Res = await request(app)
      .post(`/api/bags/${createdBag.id}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disc_id: disc2.id })
      .expect(201);
    createdBagContents.push(content2Res.body.bag_content);

    // Mark second disc as lost
    await request(app)
      .patch(`/api/bags/discs/${content2Res.body.bag_content.id}/lost`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_lost: true,
        lost_notes: 'Second lost',
      })
      .expect(200);

    // Test ascending sort by lost_at (oldest first)
    const response = await request(app)
      .get('/api/bags/lost-discs?sort=lost_at&order=asc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.lost_discs).toHaveLength(2);
    expect(response.body.lost_discs[0].lost_notes).toBe('First lost');
    expect(response.body.lost_discs[1].lost_notes).toBe('Second lost');
  });

  test('should return 401 without authentication', async () => {
    await request(app)
      .get('/api/bags/lost-discs')
      .expect(401);
  });

  test('should only return current users lost discs', async () => {
    // Create another user
    const otherUserData = {
      username: `other${testId}`,
      email: `other${testId}@ex.co`,
      password: `Test1!${chance.word()}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);

    const otherLoginRes = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLoginRes.body.tokens.accessToken;
    const otherUser = otherLoginRes.body.user;
    createdUserIds.push(otherUser.id);

    // Create bag and lost disc for other user
    const otherBagRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        name: `Other Bag ${testId}`,
        description: chance.sentence(),
      })
      .expect(201);
    const otherBag = otherBagRes.body.bag;

    const otherDiscSpeed = chance.integer({ min: 1, max: 15 });
    const otherDiscGlide = chance.integer({ min: 1, max: 7 });
    const otherDiscTurn = chance.integer({ min: -5, max: 2 });
    const otherDiscFade = chance.integer({ min: 0, max: 5 });

    const discParams = [
      chance.company(), chance.word(), otherDiscSpeed, otherDiscGlide,
      otherDiscTurn, otherDiscFade, true, otherUser.id,
    ];
    const otherDisc = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      discParams,
    );
    createdDiscs.push(otherDisc);

    const otherContentRes = await request(app)
      .post(`/api/bags/${otherBag.id}/discs`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ disc_id: otherDisc.id })
      .expect(201);
    createdBagContents.push(otherContentRes.body.bag_content);

    await request(app)
      .patch(`/api/bags/discs/${otherContentRes.body.bag_content.id}/lost`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        is_lost: true,
        lost_notes: 'Other users lost disc',
      })
      .expect(200);

    // Current user should see empty list
    const response = await request(app)
      .get('/api/bags/lost-discs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.lost_discs).toEqual([]);
    expect(response.body.pagination.total).toBe(0);

    // Clean up other bag
    await query(
      'DELETE FROM bags WHERE id = $1',
      [otherBag.id],
    );
  });
});
