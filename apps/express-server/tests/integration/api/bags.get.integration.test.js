import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('GET /api/bags/:id - Integration', () => {
  let user;
  let token;
  let testId;
  let createdUserIds = [];
  let createdBag;
  let createdDiscs = [];

  beforeEach(async () => {
    // Generate GLOBALLY unique test identifier for this test run (short for username limits)
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`; // 10 chars total
    createdUserIds = [];

    // Register user with unique identifier (under 20 char limit)
    const password = `Test1!${chance.word({ length: 2 })}`; // Meets complexity requirements
    const userData = {
      username: `bg${testId}`, // bg + 10 chars = 12 chars total (under 20 limit)
      email: `bg${testId}@ex.co`,
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

    // Create approved test discs for the tests
    const disc1 = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      ['Test Brand', `Test Model 1 ${testId}`, 12, 5, -1, 3, true, user.id],
    );
    const disc2 = await queryOne(
      'INSERT INTO disc_master (brand, model, speed, glide, turn, fade, approved, added_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      ['Test Brand', `Test Model 2 ${testId}`, 9, 4, -2, 2, true, user.id],
    );
    createdDiscs = [disc1, disc2];
  });

  afterEach(async () => {
    // Clean up only data created in this specific test
    if (createdDiscs.length > 0) {
      const discIds = createdDiscs.map((disc) => disc.id);
      await query('DELETE FROM bag_contents WHERE disc_id = ANY($1)', [discIds]);
      await query('DELETE FROM disc_master WHERE id = ANY($1)', [discIds]);
    }
    if (createdUserIds.length > 0) {
      await query('DELETE FROM bags WHERE user_id = ANY($1)', [createdUserIds]);
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
    createdDiscs = [];
  });

  test('should require authentication', async () => {
    const bagId = chance.guid();
    const res = await request(app)
      .get(`/api/bags/${bagId}`);
    expect(res.status).toBe(401);
  });

  test('should return 404 for non-existent bag', async () => {
    const nonExistentBagId = chance.guid();

    const res = await request(app)
      .get(`/api/bags/${nonExistentBagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should return bag when user owns it', async () => {
    // Create a bag first
    const bagData = {
      name: `TestBag-${testId}-get`,
      description: 'Test bag for get endpoint',
      is_public: false,
      is_friends_visible: true,
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    createdBag = createRes.body.bag;

    // Now get the bag by ID
    const res = await request(app)
      .get(`/api/bags/${createdBag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      bag: {
        id: createdBag.id,
        name: bagData.name,
        description: bagData.description,
        is_public: bagData.is_public,
        is_friends_visible: bagData.is_friends_visible,
        user_id: user.id,
      },
    });

    // Verify all expected properties are present
    expect(res.body.bag).toHaveProperty('created_at');
    expect(res.body.bag).toHaveProperty('updated_at');
  });

  test('should return 404 when user tries to access another users bag', async () => {
    // Create bag with first user
    const bagData = {
      name: `TestBag-${testId}-security`,
      description: 'Security test bag',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    const bagId = createRes.body.bag.id;

    // Create second user
    const password2 = `Test1!${chance.word({ length: 2 })}`;
    const userData2 = {
      username: `bg${testId}2`, // bg + 10 chars + 1 = 13 chars total (under 20 limit)
      email: `bg${testId}2@ex.co`,
      password: password2,
    };
    await request(app).post('/api/auth/register').send(userData2).expect(201);

    const loginRes2 = await request(app).post('/api/auth/login').send({
      username: userData2.username,
      password: userData2.password,
    }).expect(200);
    const token2 = loginRes2.body.tokens.accessToken;
    createdUserIds.push(loginRes2.body.user.id);

    // Second user should NOT be able to access first user's bag
    const res = await request(app)
      .get(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should return bag with contents when discs are added', async () => {
    // Create a bag
    const bagData = {
      name: `TestBag-${testId}-contents`,
      description: 'Test bag with contents',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    const bagId = createRes.body.bag.id;

    // Use our created test disc
    const disc = createdDiscs[0];

    // Add disc to bag
    const addDiscData = {
      disc_id: disc.id,
      notes: 'Great disc for testing',
      weight: 175.0,
      condition: 'good',
      plastic_type: 'Champion',
      color: 'Red',
    };

    await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(addDiscData)
      .expect(201);

    // Get bag with contents
    const res = await request(app)
      .get(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      bag: {
        id: bagId,
        name: bagData.name,
        description: bagData.description,
        user_id: user.id,
      },
    });

    // Verify bag contents are included
    expect(res.body.bag).toHaveProperty('bag_contents');
    expect(res.body.bag.bag_contents).toHaveLength(1);

    const bagContent = res.body.bag.bag_contents[0];
    expect(bagContent).toMatchObject({
      notes: addDiscData.notes,
      weight: addDiscData.weight.toString(), // Decimal comes back as string in JSON
      condition: addDiscData.condition,
      plastic_type: addDiscData.plastic_type,
      color: addDiscData.color,
      is_lost: false,
    });

    // Verify disc_master is included
    expect(bagContent).toHaveProperty('disc_master');
    expect(bagContent.disc_master).toMatchObject({
      id: disc.id,
      brand: disc.brand,
      model: disc.model,
    });
  });

  test('should filter out lost discs by default', async () => {
    // Create a bag
    const bagData = {
      name: `TestBag-${testId}-lost`,
      description: 'Test bag with lost discs',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    const bagId = createRes.body.bag.id;

    // Use our created test discs
    const [disc1, disc2] = createdDiscs;

    // Add two discs to bag
    await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        disc_id: disc1.id,
        notes: 'Regular disc',
      })
      .expect(201);

    const addDiscRes = await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        disc_id: disc2.id,
        notes: 'Will be lost',
      })
      .expect(201);

    // Mark second disc as lost in database
    await queryOne('UPDATE bag_contents SET is_lost = $1 WHERE id = $2 RETURNING *', [true, addDiscRes.body.bag_content.id]);

    // Get bag without include_lost - should only show non-lost disc
    const res = await request(app)
      .get(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.bag.bag_contents).toHaveLength(1);
    expect(res.body.bag.bag_contents[0].notes).toBe('Regular disc');
  });

  test('should include lost discs when include_lost=true', async () => {
    // Create a bag
    const bagData = {
      name: `TestBag-${testId}-includelost`,
      description: 'Test bag with include lost',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    const bagId = createRes.body.bag.id;

    // Use our created test discs
    const [disc1, disc2] = createdDiscs;

    // Add two discs to bag
    await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        disc_id: disc1.id,
        notes: 'Regular disc',
      })
      .expect(201);

    const addDiscRes = await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        disc_id: disc2.id,
        notes: 'Lost disc',
      })
      .expect(201);

    // Mark second disc as lost in database
    await queryOne('UPDATE bag_contents SET is_lost = $1 WHERE id = $2 RETURNING *', [true, addDiscRes.body.bag_content.id]);

    // Get bag with include_lost=true - should show both discs
    const res = await request(app)
      .get(`/api/bags/${bagId}?include_lost=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.bag.bag_contents).toHaveLength(2);

    const regularDisc = res.body.bag.bag_contents.find((content) => content.notes === 'Regular disc');
    const lostDisc = res.body.bag.bag_contents.find((content) => content.notes === 'Lost disc');

    expect(regularDisc.is_lost).toBe(false);
    expect(lostDisc.is_lost).toBe(true);
  });

  test('should return merged flight numbers (custom overrides + disc_master fallbacks)', async () => {
    // Create a bag
    const bagData = {
      name: `TestBag-${testId}-flightnumbers`,
      description: 'Test bag for flight number merging',
    };

    const createRes = await request(app)
      .post('/api/bags')
      .set('Authorization', `Bearer ${token}`)
      .send(bagData)
      .expect(201);

    const bagId = createRes.body.bag.id;

    // Add disc with some custom flight numbers
    const addDiscData = {
      disc_id: createdDiscs[0].id, // Use our test disc
      notes: 'Testing flight number merging',
      speed: 10, // Custom override
      glide: 4, // Custom override
      // turn and fade not provided - should fallback to disc_master
    };

    await request(app)
      .post(`/api/bags/${bagId}/discs`)
      .set('Authorization', `Bearer ${token}`)
      .send(addDiscData)
      .expect(201);

    // Get the bag and verify merged flight numbers
    const res = await request(app)
      .get(`/api/bags/${bagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const bagContent = res.body.bag.bag_contents[0];

    // Verify custom values are used
    expect(bagContent.speed).toBe(10); // Custom value
    expect(bagContent.glide).toBe(4); // Custom value

    // Verify fallback to disc_master values (our test discs have known values)
    expect(bagContent.turn).toBe(createdDiscs[0].turn); // From disc_master
    expect(bagContent.fade).toBe(createdDiscs[0].fade); // From disc_master

    // Verify disc_master is still included
    expect(bagContent.disc_master).toBeDefined();
  });
});
