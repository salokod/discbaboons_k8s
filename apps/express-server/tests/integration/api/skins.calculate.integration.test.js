import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import { Chance } from 'chance';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';
import { queryRows } from '../../../lib/database.js';

const chance = new Chance();
const request = supertest(app);

describe('GET /api/rounds/:id/skins', () => {
  let authHeader;
  let testUser;
  let testRound;
  let testCourse;

  beforeEach(async () => {
    // Clear test data
    await queryRows('DELETE FROM round_players WHERE round_id IN (SELECT id FROM rounds WHERE name LIKE \'%Test%\')');
    await queryRows('DELETE FROM rounds WHERE name LIKE \'%Test%\'');
    await queryRows('DELETE FROM courses WHERE name LIKE \'%Test%\'');
    await queryRows('DELETE FROM users WHERE username LIKE \'%skinuser%\'');

    // Create test user
    testUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: `skinuser${chance.integer({ min: 1000, max: 9999 })}`,
      password_hash: 'hashedpassword',
    };

    await queryRows(
      'INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)',
      [testUser.id, testUser.username, testUser.password_hash],
    );

    // Create test course
    testCourse = {
      id: `course-skins-${chance.integer({ min: 1000, max: 9999 })}`,
      name: 'Test Course',
      city: 'Test City',
      state_province: 'Test State',
      country: 'US',
      hole_count: 18,
    };

    await queryRows(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count) VALUES ($1, $2, $3, $4, $5, $6)',
      [testCourse.id, testCourse.name, testCourse.city, testCourse.state_province,
        testCourse.country, testCourse.hole_count],
    );

    // Create test round with skins enabled, starting on hole 1
    const roundResult = await queryRows(
      'INSERT INTO rounds (created_by_id, course_id, name, skins_enabled, skins_value, starting_hole) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [testUser.id, testCourse.id, 'Skins Test Round', true, '5.00', 1],
    );
    testRound = { id: roundResult[0].id };

    // Generate auth token
    const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
    authHeader = `Bearer ${token}`;
  });

  afterEach(async () => {
    // Clean up test data
    await queryRows('DELETE FROM round_players WHERE round_id IN (SELECT id FROM rounds WHERE name LIKE \'%Test%\')');
    await queryRows('DELETE FROM rounds WHERE name LIKE \'%Test%\'');
    await queryRows('DELETE FROM courses WHERE name LIKE \'%Test%\'');
    await queryRows('DELETE FROM users WHERE username LIKE \'%skinuser%\'');
  });

  test('should return skins calculation for valid round', async () => {
    const response = await request
      .get(`/api/rounds/${testRound.id}/skins`)
      .set('Authorization', authHeader)
      .expect(200);

    expect(response.body).toMatchObject({
      roundId: testRound.id,
      skinsEnabled: true,
      skinsValue: '5.00',
      holes: {},
      playerSummary: {},
      totalCarryOver: 0,
    });
  });

  test('should return 404 for non-existent round', async () => {
    const fakeRoundId = chance.guid();

    const response = await request
      .get(`/api/rounds/${fakeRoundId}/skins`)
      .set('Authorization', authHeader)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Round not found',
    });
  });

  test('should return 401 without auth token', async () => {
    const response = await request
      .get(`/api/rounds/${testRound.id}/skins`)
      .expect(401);

    expect(response.body).toEqual({
      error: 'Access token required',
    });
  });

  test('should calculate skins in correct order when round starts on different hole', async () => {
    // Create a round with random starting hole and hole count
    const holeCount = chance.integer({ min: 6, max: 12 });
    const startingHole = chance.integer({ min: 2, max: holeCount - 1 });
    const skinsValue = chance.floating({ min: 1, max: 10, fixed: 2 });
    const courseName = `Test ${chance.word()} Course`;
    const roundName = `Test Round Starting Hole ${startingHole}`;
    const courseResult = await queryRows(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [`course-${chance.integer({ min: 1000, max: 9999 })}`, courseName, chance.city(), chance.state(), 'US', holeCount],
    );
    const courseId = courseResult[0].id;

    const roundResult = await queryRows(
      'INSERT INTO rounds (created_by_id, course_id, name, skins_enabled, skins_value, starting_hole) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [testUser.id, courseId, roundName, true, skinsValue.toString(), startingHole],
    );
    const roundId = roundResult[0].id;

    // Add round player
    const playerResult = await queryRows(
      'INSERT INTO round_players (round_id, user_id, is_guest) VALUES ($1, $2, $3) RETURNING id',
      [roundId, testUser.id, false],
    );
    const playerId1 = playerResult[0].id;

    // Add a guest player
    const guestName = `${chance.first()} ${chance.last()}`;
    const guestResult = await queryRows(
      'INSERT INTO round_players (round_id, guest_name, is_guest) VALUES ($1, $2, $3) RETURNING id',
      [roundId, guestName, true],
    );
    const playerId2 = guestResult[0].id;

    // Add pars for all holes
    const parPromises = [];
    for (let hole = 1; hole <= holeCount; hole += 1) {
      const par = chance.integer({ min: 3, max: 5 });
      parPromises.push(queryRows(
        'INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id) VALUES ($1, $2, $3, $4)',
        [roundId, hole, par, playerId1],
      ));
    }
    await Promise.all(parPromises);

    // Add scores - Player 1 wins starting hole, ties next few, Player 2 wins later hole
    const scorePromises = [];
    const winningScore = chance.integer({ min: 1, max: 3 });
    const losingScore = winningScore + chance.integer({ min: 1, max: 2 });
    const tieScore = chance.integer({ min: 2, max: 4 });

    // Player 1 wins starting hole
    scorePromises.push(
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId1, startingHole, winningScore]),
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId2, startingHole, losingScore]),
    );

    // Add ties and one more win for variety - just add scores for 3 more holes
    const nextHole = (startingHole % holeCount) + 1;
    const thirdHole = (nextHole % holeCount) + 1;
    const finalHole = (thirdHole % holeCount) + 1;

    // Ties on next two holes
    scorePromises.push(
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId1, nextHole, tieScore]),
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId2, nextHole, tieScore]),
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId1, thirdHole, tieScore]),
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId2, thirdHole, tieScore]),
    );

    // Player 2 wins final hole with carry-over
    scorePromises.push(
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId1, finalHole, losingScore]),
      queryRows('INSERT INTO scores (round_id, player_id, hole_number, strokes) VALUES ($1, $2, $3, $4)', [roundId, playerId2, finalHole, winningScore]),
    );

    await Promise.all(scorePromises);

    const response = await request
      .get(`/api/rounds/${roundId}/skins`)
      .set('Authorization', authHeader)
      .expect(200);

    // Calculate expected values
    const baseSkinsValue = skinsValue.toFixed(2);
    const totalCarryOverValue = (skinsValue + (skinsValue * 2)).toFixed(2);

    expect(response.body).toMatchObject({
      roundId,
      skinsEnabled: true,
      skinsValue: baseSkinsValue,
      holes: {
        [startingHole]: {
          winner: playerId1,
          winnerScore: winningScore,
          skinsValue: baseSkinsValue,
          carriedOver: 0,
        },
        [nextHole]: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue,
          carriedOver: 1,
        },
        [thirdHole]: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue,
          carriedOver: 2,
        },
        [finalHole]: {
          winner: playerId2,
          winnerScore: winningScore,
          skinsValue: totalCarryOverValue,
          carriedOver: 2,
        },
      },
      playerSummary: {
        [playerId1]: { skinsWon: 1, totalValue: baseSkinsValue },
        [playerId2]: { skinsWon: 3, totalValue: totalCarryOverValue },
      },
      totalCarryOver: 0,
    });

    // Verify skins calculated starting from specified starting hole
    expect(response.body.holes[startingHole]).toBeDefined();
    expect(response.body.playerSummary[playerId1].skinsWon).toBe(1);
    expect(response.body.playerSummary[playerId2].skinsWon).toBe(3);
  });
});
