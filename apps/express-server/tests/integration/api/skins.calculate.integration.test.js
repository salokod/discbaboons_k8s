import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';
import { createUniqueUserData, createUniqueCourseData, createSimpleRoundData } from '../test-helpers.js';

const chance = new Chance();

describe('GET /api/rounds/:id/skins - Integration', () => {
  let user;
  let token;
  let createdUserIds = [];
  let createdCourseIds = [];
  let createdRoundIds = [];
  let testCourse;
  let testRound;
  let testPlayer1;
  let testPlayer2;

  beforeEach(async () => {
    // Reset tracking arrays
    createdUserIds = [];
    createdCourseIds = [];
    createdRoundIds = [];

    // Register test user using helper
    const userData = createUniqueUserData('skin');
    await request(app).post('/api/auth/register').send(userData).expect(201);
    const login = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = login.body.tokens.accessToken;
    user = login.body.user;
    createdUserIds.push(user.id);

    // Create test course using helper
    const courseData = createUniqueCourseData('skincourse');
    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send(courseData)
      .expect(201);
    testCourse = courseResponse.body;
    createdCourseIds.push(testCourse.id);

    // Create test round with skins enabled, starting from hole 1 for predictable testing
    const skinsValue = chance.floating({ min: 1, max: 20, fixed: 2 });
    const roundData = {
      ...createSimpleRoundData(testCourse.id, 'skinround'),
      startingHole: 1, // Fixed to 1 for predictable hole ordering
      skinsEnabled: true,
      skinsValue,
    };
    const roundResponse = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);
    testRound = { ...roundResponse.body, skinsValue };
    createdRoundIds.push(testRound.id);

    // Get creator player record (auto-added when round is created)
    testPlayer1 = await queryOne(
      'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
      [testRound.id, user.id],
    );

    // Add a guest player
    const playersData = {
      players: [{ guestName: 'Skins Test Player' }],
    };
    await request(app)
      .post(`/api/rounds/${testRound.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send(playersData)
      .expect(201);

    // Get guest player record
    testPlayer2 = await queryOne(
      'SELECT id FROM round_players WHERE round_id = $1 AND is_guest = true',
      [testRound.id],
    );
  });

  afterEach(async () => {
    // Clean up in reverse order of creation
    if (createdRoundIds.length > 0) {
      await query('DELETE FROM scores WHERE round_id = ANY($1)', [createdRoundIds]);
      await query('DELETE FROM round_hole_pars WHERE round_id = ANY($1)', [createdRoundIds]);
      await query('DELETE FROM round_players WHERE round_id = ANY($1)', [createdRoundIds]);
      await query('DELETE FROM rounds WHERE id = ANY($1)', [createdRoundIds]);
    }
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/skins`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 404 for non-existent round', async () => {
    const fakeRoundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${fakeRoundId}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: 'Round not found',
    });
  });

  test('should return basic skins calculation for round with no scores', async () => {
    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      roundId: testRound.id,
      skinsEnabled: true,
      skinsValue: parseFloat(testRound.skinsValue).toFixed(2),
      holes: {},
      playerSummary: {
        [testPlayer1.id]: { skinsWon: 0, totalValue: '0.00' },
        [testPlayer2.id]: { skinsWon: 0, totalValue: '0.00' },
      },
      totalCarryOver: 0,
    });
  });

  test('should correctly calculate carry-over skins after multiple ties (bug fix verification)', async () => {
    // This test verifies the fix for the carry-over bug where hole 5 should get 3 skins
    // Scenario: Player1 wins holes 1&2, holes 3&4 tie, Player2 wins hole 5 with carry-over

    const hole1Score = chance.integer({ min: 2, max: 4 });
    const hole2Score = chance.integer({ min: 2, max: 4 });
    const tieScore = chance.integer({ min: 3, max: 5 });
    const finalWinScore = chance.integer({ min: 2, max: 4 });
    const finalLoseScore = finalWinScore + chance.integer({ min: 1, max: 2 });

    // Submit scores using the API
    const scoresData = {
      scores: [
        // Player1 wins hole 1
        { playerId: testPlayer1.id, holeNumber: 1, strokes: hole1Score },
        { playerId: testPlayer2.id, holeNumber: 1, strokes: hole1Score + 1 },

        // Player1 wins hole 2
        { playerId: testPlayer1.id, holeNumber: 2, strokes: hole2Score },
        { playerId: testPlayer2.id, holeNumber: 2, strokes: hole2Score + 1 },

        // Tie on hole 3
        { playerId: testPlayer1.id, holeNumber: 3, strokes: tieScore },
        { playerId: testPlayer2.id, holeNumber: 3, strokes: tieScore },

        // Tie on hole 4
        { playerId: testPlayer1.id, holeNumber: 4, strokes: tieScore },
        { playerId: testPlayer2.id, holeNumber: 4, strokes: tieScore },

        // Player2 wins hole 5 with carry-over
        { playerId: testPlayer1.id, holeNumber: 5, strokes: finalLoseScore },
        { playerId: testPlayer2.id, holeNumber: 5, strokes: finalWinScore },
      ],
    };

    await request(app)
      .post(`/api/rounds/${testRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send(scoresData)
      .expect(200);

    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const baseSkinsValue = parseFloat(testRound.skinsValue);
    const hole5TotalValue = baseSkinsValue * 3; // Base + 2 carry-over

    expect(response.body).toMatchObject({
      roundId: testRound.id,
      skinsEnabled: true,
      skinsValue: parseFloat(testRound.skinsValue).toFixed(2),
      holes: {
        1: {
          winner: testPlayer1.id,
          winnerScore: hole1Score,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 0,
        },
        2: {
          winner: testPlayer1.id,
          winnerScore: hole2Score,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 0,
        },
        3: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 0, // No skins carried INTO hole 3
        },
        4: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 1, // 1 skin carried INTO hole 4 from hole 3
        },
        5: {
          winner: testPlayer2.id,
          winnerScore: finalWinScore,
          skinsValue: hole5TotalValue.toFixed(2), // Should be 3x base value
          carriedOver: 2, // Shows 2 skins were carried INTO this hole
        },
      },
      playerSummary: {
        [testPlayer1.id]: { skinsWon: 2, totalValue: (baseSkinsValue * 2).toFixed(2) },
        [testPlayer2.id]: { skinsWon: 3, totalValue: hole5TotalValue.toFixed(2) }, // 3 skins total
      },
      totalCarryOver: 0, // Should be 0 after hole 5 win
    });

    // Additional assertions to ensure bug fix is working
    expect(response.body.holes[3].carriedOver).toBe(0); // No skins carried INTO hole 3
    expect(response.body.holes[4].carriedOver).toBe(1); // 1 skin carried INTO hole 4 from hole 3
    expect(response.body.holes[5].carriedOver).toBe(2);
    expect(response.body.playerSummary[testPlayer2.id].skinsWon).toBe(3);
  });

  test('should return 403 when user is not participant', async () => {
    // Create another user
    const otherUserData = createUniqueUserData('skinother');
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    const otherToken = otherLogin.body.tokens.accessToken;
    createdUserIds.push(otherLogin.body.user.id);

    const response = await request(app)
      .get(`/api/rounds/${testRound.id}/skins`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('You must be a participant in this round to view skins');
  });

  test('should correctly handle carry-over for round starting on hole 5 with ties and wins', async () => {
    // This test validates the fix for carry-over logic when rounds start on holes other than 1
    // Scenario: Round starts on hole 5, with play order 5→6→7→8→9→1→2→3
    // Holes 7,9,1,2 tie; hole 8 has carry-over from 7; hole 3 has carry-over from 9,1,2

    // Create a round starting on hole 5
    const startingHole = 5;
    const skinsValue = chance.floating({ min: 5, max: 15, fixed: 2 });
    const roundData = {
      ...createSimpleRoundData(testCourse.id, 'skincarry'),
      startingHole,
      skinsEnabled: true,
      skinsValue,
    };

    const roundResponse = await request(app)
      .post('/api/rounds')
      .set('Authorization', `Bearer ${token}`)
      .send(roundData)
      .expect(201);

    const carryOverRound = { ...roundResponse.body, skinsValue };
    createdRoundIds.push(carryOverRound.id);

    // Get player records for this round
    const player1 = await queryOne(
      'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
      [carryOverRound.id, user.id],
    );

    // Add guest player
    await request(app)
      .post(`/api/rounds/${carryOverRound.id}/players`)
      .set('Authorization', `Bearer ${token}`)
      .send({ players: [{ guestName: 'Carry Over Test Player' }] })
      .expect(201);

    const player2 = await queryOne(
      'SELECT id FROM round_players WHERE round_id = $1 AND is_guest = true',
      [carryOverRound.id],
    );

    // Generate random scores following the expected pattern
    const winScore = chance.integer({ min: 2, max: 3 });
    const loseScore = winScore + chance.integer({ min: 1, max: 2 });
    const tieScore = chance.integer({ min: 3, max: 4 });

    // Submit scores: Play order 5→6→7→8→9→1→2→3
    const scoresData = {
      scores: [
        // Hole 5: Player 2 wins (starting hole)
        { playerId: player1.id, holeNumber: 5, strokes: loseScore },
        { playerId: player2.id, holeNumber: 5, strokes: winScore },

        // Hole 6: Player 2 wins
        { playerId: player1.id, holeNumber: 6, strokes: loseScore },
        { playerId: player2.id, holeNumber: 6, strokes: winScore },

        // Hole 7: Tie (carries 1 to hole 8)
        { playerId: player1.id, holeNumber: 7, strokes: tieScore },
        { playerId: player2.id, holeNumber: 7, strokes: tieScore },

        // Hole 8: Player 1 wins with carry-over from hole 7
        { playerId: player1.id, holeNumber: 8, strokes: winScore },
        { playerId: player2.id, holeNumber: 8, strokes: loseScore },

        // Hole 9: Tie (carries 1 to hole 1)
        { playerId: player1.id, holeNumber: 9, strokes: tieScore },
        { playerId: player2.id, holeNumber: 9, strokes: tieScore },

        // Hole 1: Tie (receives 1 from hole 9, carries 2 to hole 2)
        { playerId: player1.id, holeNumber: 1, strokes: tieScore },
        { playerId: player2.id, holeNumber: 1, strokes: tieScore },

        // Hole 2: Tie (receives 2 from hole 1, carries 3 to hole 3)
        { playerId: player1.id, holeNumber: 2, strokes: tieScore },
        { playerId: player2.id, holeNumber: 2, strokes: tieScore },

        // Hole 3: Player 1 wins with carry-over from holes 9,1,2
        { playerId: player1.id, holeNumber: 3, strokes: winScore },
        { playerId: player2.id, holeNumber: 3, strokes: loseScore },
      ],
    };

    await request(app)
      .post(`/api/rounds/${carryOverRound.id}/scores`)
      .set('Authorization', `Bearer ${token}`)
      .send(scoresData)
      .expect(200);

    const response = await request(app)
      .get(`/api/rounds/${carryOverRound.id}/skins`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const baseSkinsValue = parseFloat(skinsValue);
    const hole8Value = baseSkinsValue * 2; // Base + 1 carry-over from hole 7
    const hole3Value = baseSkinsValue * 4; // Base + 3 carry-over from holes 9,1,2

    expect(response.body).toMatchObject({
      roundId: carryOverRound.id,
      skinsEnabled: true,
      skinsValue: parseFloat(skinsValue).toFixed(2),
      holes: {
        // Play order validation: 5→6→7→8→9→1→2→3
        5: {
          winner: player2.id,
          winnerScore: winScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 0, // Starting hole, no carry-over
        },
        6: {
          winner: player2.id,
          winnerScore: winScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 0, // No carry-over
        },
        7: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 0, // No skins carried INTO hole 7
        },
        8: {
          winner: player1.id,
          winnerScore: winScore,
          skinsValue: hole8Value.toFixed(2), // Base + 1 carry-over
          carriedOver: 1, // 1 skin carried IN from hole 7
        },
        9: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 0, // No skins carried INTO hole 9
        },
        1: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 1, // 1 skin carried IN from hole 9
        },
        2: {
          winner: null,
          tied: true,
          tiedScore: tieScore,
          skinsValue: baseSkinsValue.toFixed(2),
          carriedOver: 2, // 2 skins carried IN from hole 1 (1 from hole 9 + hole 1's own)
        },
        3: {
          winner: player1.id,
          winnerScore: winScore,
          skinsValue: hole3Value.toFixed(2), // Base + 3 carry-over
          carriedOver: 3, // 3 skins carried IN from holes 9→1→2
        },
      },
      playerSummary: {
        [player1.id]: {
          skinsWon: 6, // 2 from hole 8 + 4 from hole 3
          totalValue: (hole8Value + hole3Value).toFixed(2),
        },
        [player2.id]: {
          skinsWon: 2, // 1 from hole 5 + 1 from hole 6
          totalValue: (baseSkinsValue * 2).toFixed(2),
        },
      },
      totalCarryOver: 0, // Should be 0 after all skins awarded
    });

    // Validate the specific carry-over fix: each hole shows correct carried-in count
    expect(response.body.holes[7].carriedOver).toBe(0); // Hole 7: no carry-in
    expect(response.body.holes[8].carriedOver).toBe(1); // Hole 8: 1 from hole 7
    expect(response.body.holes[9].carriedOver).toBe(0); // Hole 9: no carry-in
    expect(response.body.holes[1].carriedOver).toBe(1); // Hole 1: 1 from hole 9
    expect(response.body.holes[2].carriedOver).toBe(2); // Hole 2: 2 from hole 1
    expect(response.body.holes[3].carriedOver).toBe(3); // Hole 3: 3 from holes 9→1→2

    // Validate final skins distribution
    expect(response.body.playerSummary[player1.id].skinsWon).toBe(6);
    expect(response.body.playerSummary[player2.id].skinsWon).toBe(2);
    expect(response.body.totalCarryOver).toBe(0);
  });
});
