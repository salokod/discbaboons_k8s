import {
  describe, test, expect, vi, beforeAll, beforeEach,
} from 'vitest';
import express from 'express';
import request from 'supertest';
import Chance from 'chance';

const chance = new Chance();

let roundsRouter;
let roundsCreateController;
let roundsListController;
let getRoundController;
let addPlayerController;
let listPlayersController;
let removePlayerController;
let updateRoundController;
let deleteRoundController;
let setParController;
let getParsController;
let submitScoresController;
let getScoresController;
let getLeaderboardController;
let sideBetsCreateController;
let sideBetsListController;
let sideBetsUpdateController;
let authenticateToken;

beforeAll(async () => {
  // Mock the controllers
  roundsCreateController = vi.fn((req, res) => {
    res.status(201).json({ message: 'create controller called' });
  });

  roundsListController = vi.fn((req, res) => {
    res.json({ message: 'list controller called' });
  });

  getRoundController = vi.fn((req, res) => {
    res.json({ message: 'get round controller called' });
  });

  addPlayerController = vi.fn((req, res) => {
    res.status(201).json({ message: 'add player controller called' });
  });

  listPlayersController = vi.fn((req, res) => {
    res.json({ message: 'list players controller called' });
  });

  removePlayerController = vi.fn((req, res) => {
    res.json({ message: 'remove player controller called' });
  });

  updateRoundController = vi.fn((req, res) => {
    res.json({ message: 'update round controller called' });
  });

  deleteRoundController = vi.fn((req, res) => {
    res.json({ message: 'delete round controller called' });
  });

  setParController = vi.fn((req, res) => {
    res.json({ message: 'set par controller called' });
  });

  getParsController = vi.fn((req, res) => {
    res.json({ message: 'get pars controller called' });
  });

  submitScoresController = vi.fn((req, res) => {
    res.json({ message: 'submit scores controller called' });
  });

  getScoresController = vi.fn((req, res) => {
    res.json({ message: 'get scores controller called' });
  });

  getLeaderboardController = vi.fn((req, res) => {
    res.json({ message: 'get leaderboard controller called' });
  });

  sideBetsCreateController = vi.fn((req, res) => {
    res.status(201).json({ message: 'side bet create controller called' });
  });

  sideBetsListController = vi.fn((req, res) => {
    res.json({ message: 'side bet list controller called' });
  });

  sideBetsUpdateController = vi.fn((req, res) => {
    res.json({ message: 'side bet update controller called' });
  });

  // Mock the auth middleware
  authenticateToken = vi.fn((req, res, next) => {
    req.user = { userId: 1 };
    next();
  });

  vi.doMock('../../../controllers/rounds.create.controller.js', () => ({
    default: roundsCreateController,
  }));

  vi.doMock('../../../controllers/rounds.list.controller.js', () => ({
    default: roundsListController,
  }));

  vi.doMock('../../../controllers/rounds.get.controller.js', () => ({
    default: getRoundController,
  }));

  vi.doMock('../../../controllers/rounds.addPlayer.controller.js', () => ({
    default: addPlayerController,
  }));

  vi.doMock('../../../controllers/rounds.listPlayers.controller.js', () => ({
    default: listPlayersController,
  }));

  vi.doMock('../../../controllers/rounds.removePlayer.controller.js', () => ({
    default: removePlayerController,
  }));

  vi.doMock('../../../controllers/rounds.update.controller.js', () => ({
    default: updateRoundController,
  }));

  vi.doMock('../../../controllers/rounds.delete.controller.js', () => ({
    default: deleteRoundController,
  }));

  vi.doMock('../../../controllers/rounds.setPar.controller.js', () => ({
    default: setParController,
  }));

  vi.doMock('../../../controllers/rounds.getPars.controller.js', () => ({
    default: getParsController,
  }));

  vi.doMock('../../../controllers/rounds.submitScores.controller.js', () => ({
    default: submitScoresController,
  }));

  vi.doMock('../../../controllers/rounds.getScores.controller.js', () => ({
    default: getScoresController,
  }));

  vi.doMock('../../../controllers/rounds.getLeaderboard.controller.js', () => ({
    default: getLeaderboardController,
  }));

  vi.doMock('../../../controllers/sideBets.create.controller.js', () => ({
    default: sideBetsCreateController,
  }));

  vi.doMock('../../../controllers/sideBets.list.controller.js', () => ({
    default: sideBetsListController,
  }));

  vi.doMock('../../../controllers/sideBets.update.controller.js', () => ({
    default: sideBetsUpdateController,
  }));

  vi.doMock('../../../middleware/auth.middleware.js', () => ({
    default: authenticateToken,
  }));

  // Mock the services to avoid database calls
  vi.doMock('../../../services/rounds.create.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/rounds.list.service.js', () => ({
    default: vi.fn().mockResolvedValue({
      rounds: [], total: 0, limit: 50, offset: 0, hasMore: false,
    }),
  }));

  vi.doMock('../../../services/rounds.addPlayer.service.js', () => ({
    addPlayerToRound: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/rounds.listPlayers.service.js', () => ({
    default: vi.fn().mockResolvedValue([]),
  }));

  vi.doMock('../../../services/rounds.get.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/rounds.removePlayer.service.js', () => ({
    default: vi.fn().mockResolvedValue({ success: true }),
  }));

  vi.doMock('../../../services/rounds.update.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/rounds.delete.service.js', () => ({
    default: vi.fn().mockResolvedValue({ success: true }),
  }));

  vi.doMock('../../../services/rounds.setPar.service.js', () => ({
    default: vi.fn().mockResolvedValue({ success: true }),
  }));

  vi.doMock('../../../services/rounds.getPars.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/rounds.submitScores.service.js', () => ({
    default: vi.fn().mockResolvedValue({ success: true, scoresSubmitted: 1 }),
  }));

  vi.doMock('../../../services/rounds.getScores.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/sideBets.create.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/sideBets.list.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/sideBets.update.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  // Import the router after mocking
  ({ default: roundsRouter } = await import('../../../routes/rounds.routes.js'));
});

describe('rounds routes', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    roundsCreateController.mockClear();
    roundsListController.mockClear();
    getRoundController.mockClear();
    addPlayerController.mockClear();
    listPlayersController.mockClear();
    removePlayerController.mockClear();
    updateRoundController.mockClear();
    deleteRoundController.mockClear();
    setParController.mockClear();
    getParsController.mockClear();
    submitScoresController.mockClear();
    getScoresController.mockClear();
    getLeaderboardController.mockClear();
    sideBetsCreateController.mockClear();
    sideBetsListController.mockClear();
    sideBetsUpdateController.mockClear();
    authenticateToken.mockClear();
  });

  test('should export router', () => {
    expect(roundsRouter).toBeDefined();
  });

  test('POST /api/rounds should require authentication and call create controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundData = {
      courseId: chance.word(),
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: 18 }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
      skinsValue: chance.floating({ min: 1, max: 50, fixed: 2 }),
    };

    const response = await request(app)
      .post('/api/rounds')
      .send(roundData)
      .expect(201);

    expect(response.body).toEqual({ message: 'create controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(roundsCreateController).toHaveBeenCalled();
  });

  test('POST /api/rounds should pass round data in request body', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundData = {
      courseId: chance.word(),
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: 18 }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
      skinsValue: chance.floating({ min: 1, max: 50, fixed: 2 }),
    };

    await request(app)
      .post('/api/rounds')
      .send(roundData)
      .expect(201);

    expect(roundsCreateController).toHaveBeenCalled();
    const lastCall = roundsCreateController.mock.calls[
      roundsCreateController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.body).toEqual(roundData);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('GET /api/rounds should require authentication and call list controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const response = await request(app)
      .get('/api/rounds')
      .expect(200);

    expect(response.body).toEqual({ message: 'list controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(roundsListController).toHaveBeenCalled();
  });

  test('GET /api/rounds should pass query parameters to controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const queryParams = {
      status: chance.pickone(['in_progress', 'completed', 'cancelled']),
      is_private: chance.bool().toString(),
      limit: chance.integer({ min: 1, max: 100 }).toString(),
      offset: chance.integer({ min: 0, max: 50 }).toString(),
    };

    await request(app)
      .get('/api/rounds')
      .query(queryParams)
      .expect(200);

    expect(roundsListController).toHaveBeenCalled();
    const lastCall = roundsListController.mock.calls[
      roundsListController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.query).toEqual(queryParams);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('POST /api/rounds/:id/players should require authentication and call add player controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const playerData = {
      userId: chance.integer({ min: 1, max: 1000 }),
    };

    const response = await request(app)
      .post(`/api/rounds/${roundId}/players`)
      .send(playerData)
      .expect(201);

    expect(response.body).toEqual({ message: 'add player controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(addPlayerController).toHaveBeenCalled();
  });

  test('POST /api/rounds/:id/players should pass roundId in params and player data in body', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const playerData = {
      guestName: chance.name(),
    };

    await request(app)
      .post(`/api/rounds/${roundId}/players`)
      .send(playerData)
      .expect(201);

    expect(addPlayerController).toHaveBeenCalled();
    const lastCall = addPlayerController.mock.calls[
      addPlayerController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.body).toEqual(playerData);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('POST /api/rounds/:id/players should work with both userId and guestName', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    // Test with userId
    const userPlayerData = {
      userId: chance.integer({ min: 1, max: 1000 }),
    };

    await request(app)
      .post(`/api/rounds/${roundId}/players`)
      .send(userPlayerData)
      .expect(201);

    expect(addPlayerController).toHaveBeenCalled();
    let lastCall = addPlayerController.mock.calls[
      addPlayerController.mock.calls.length - 1
    ];
    expect(lastCall[0].body).toEqual(userPlayerData);

    // Test with guestName
    const guestPlayerData = {
      guestName: chance.name(),
    };

    await request(app)
      .post(`/api/rounds/${roundId}/players`)
      .send(guestPlayerData)
      .expect(201);

    expect(addPlayerController).toHaveBeenCalledTimes(2);
    lastCall = addPlayerController.mock.calls[
      addPlayerController.mock.calls.length - 1
    ];
    expect(lastCall[0].body).toEqual(guestPlayerData);
  });

  test('GET /api/rounds/:id/players should require authentication and call list players controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${roundId}/players`)
      .expect(200);

    expect(response.body).toEqual({ message: 'list players controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(listPlayersController).toHaveBeenCalled();
  });

  test('DELETE /api/rounds/:id/players/:playerId should require authentication and call remove player controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const playerId = chance.guid();

    const response = await request(app)
      .delete(`/api/rounds/${roundId}/players/${playerId}`)
      .expect(200);

    expect(response.body).toEqual({ message: 'remove player controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(removePlayerController).toHaveBeenCalled();
  });

  test('DELETE /api/rounds/:id/players/:playerId should pass roundId and playerId in params', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const playerId = chance.guid();

    await request(app)
      .delete(`/api/rounds/${roundId}/players/${playerId}`)
      .expect(200);

    expect(removePlayerController).toHaveBeenCalled();
    const lastCall = removePlayerController.mock.calls[
      removePlayerController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.params.playerId).toBe(playerId);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('GET /api/rounds/:id should require authentication and call get round controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${roundId}`)
      .expect(200);

    expect(response.body).toEqual({ message: 'get round controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(getRoundController).toHaveBeenCalled();
  });

  test('GET /api/rounds/:id should pass roundId in params', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    await request(app)
      .get(`/api/rounds/${roundId}`)
      .expect(200);

    expect(getRoundController).toHaveBeenCalled();
    const lastCall = getRoundController.mock.calls[
      getRoundController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('PUT /api/rounds/:id should require authentication and call update controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
      status: 'completed',
      starting_hole: chance.integer({ min: 1, max: 18 }),
      is_private: chance.bool(),
      skins_enabled: chance.bool(),
      skins_value: chance.floating({ min: 1, max: 100, fixed: 2 }).toString(),
    };

    const response = await request(app)
      .put(`/api/rounds/${roundId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toEqual({ message: 'update round controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(updateRoundController).toHaveBeenCalled();
  });

  test('PUT /api/rounds/:id should pass roundId in params and update data in body', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const updateData = {
      name: chance.sentence({ words: 3 }),
      status: 'in_progress',
      starting_hole: chance.integer({ min: 1, max: 18 }),
    };

    await request(app)
      .put(`/api/rounds/${roundId}`)
      .send(updateData)
      .expect(200);

    expect(updateRoundController).toHaveBeenCalled();
    const lastCall = updateRoundController.mock.calls[
      updateRoundController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.body).toEqual(updateData);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('DELETE /api/rounds/:id should require authentication and call delete controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    const response = await request(app)
      .delete(`/api/rounds/${roundId}`)
      .expect(200);

    expect(response.body).toEqual({ message: 'delete round controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(deleteRoundController).toHaveBeenCalled();
  });

  test('DELETE /api/rounds/:id should pass roundId in params', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    await request(app)
      .delete(`/api/rounds/${roundId}`)
      .expect(200);

    expect(deleteRoundController).toHaveBeenCalled();
    const lastCall = deleteRoundController.mock.calls[
      deleteRoundController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('PUT /api/rounds/:id/holes/:holeNumber/par should require authentication and call setPar controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });

    const response = await request(app)
      .put(`/api/rounds/${roundId}/holes/${holeNumber}/par`)
      .send({ par })
      .expect(200);

    expect(response.body).toEqual({ message: 'set par controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(setParController).toHaveBeenCalled();
  });

  test('PUT /api/rounds/:id/holes/:holeNumber/par should pass roundId, holeNumber in params and par in body', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });

    await request(app)
      .put(`/api/rounds/${roundId}/holes/${holeNumber}/par`)
      .send({ par })
      .expect(200);

    expect(setParController).toHaveBeenCalled();
    const lastCall = setParController.mock.calls[
      setParController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.params.holeNumber).toBe(holeNumber.toString());
    expect(req.body).toEqual({ par });
    expect(req.user).toEqual({ userId: 1 });
  });

  test('GET /api/rounds/:id/pars should require authentication and call getPars controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${roundId}/pars`)
      .expect(200);

    expect(response.body).toEqual({ message: 'get pars controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(getParsController).toHaveBeenCalled();
  });

  test('GET /api/rounds/:id/pars should pass roundId in params', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    await request(app)
      .get(`/api/rounds/${roundId}/pars`)
      .expect(200);

    expect(getParsController).toHaveBeenCalled();
    const lastCall = getParsController.mock.calls[
      getParsController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('POST /api/rounds/:id/scores should require authentication and call submitScores controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const scoresData = {
      scores: [
        { playerId: chance.guid(), holeNumber: 1, strokes: 4 },
      ],
    };

    const response = await request(app)
      .post(`/api/rounds/${roundId}/scores`)
      .send(scoresData)
      .expect(200);

    expect(response.body).toEqual({ message: 'submit scores controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(submitScoresController).toHaveBeenCalled();
  });

  test('GET /api/rounds/:id/scores should require authentication and call getScores controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${roundId}/scores`)
      .expect(200);

    expect(response.body).toEqual({ message: 'get scores controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(getScoresController).toHaveBeenCalled();
  });

  test('GET /api/rounds/:id/scores should pass roundId in params', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    await request(app)
      .get(`/api/rounds/${roundId}/scores`)
      .expect(200);

    expect(getScoresController).toHaveBeenCalled();
    const lastCall = getScoresController.mock.calls[
      getScoresController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('GET /api/rounds/:id/leaderboard should require authentication and call getLeaderboard controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    const response = await request(app)
      .get(`/api/rounds/${roundId}/leaderboard`)
      .expect(200);

    expect(response.body).toEqual({ message: 'get leaderboard controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(getLeaderboardController).toHaveBeenCalled();
  });

  test('GET /api/rounds/:id/leaderboard should pass roundId in params', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    await request(app)
      .get(`/api/rounds/${roundId}/leaderboard`)
      .expect(200);

    expect(getLeaderboardController).toHaveBeenCalled();
    const lastCall = getLeaderboardController.mock.calls[
      getLeaderboardController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('POST /api/rounds/:id/side-bets should require authentication and call sideBetsCreate controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const betType = chance.pickone(['hole', 'round']);
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType,
      ...(betType === 'hole' && { holeNumber: chance.integer({ min: 1, max: 18 }) }),
    };

    const response = await request(app)
      .post(`/api/rounds/${roundId}/side-bets`)
      .send(betData)
      .expect(201);

    expect(response.body).toEqual({ message: 'side bet create controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(sideBetsCreateController).toHaveBeenCalled();
  });

  test('POST /api/rounds/:id/side-bets should pass roundId in params and bet data in body', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const betType = chance.pickone(['hole', 'round']);
    const betData = {
      name: chance.sentence({ words: 3 }),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType,
      description: chance.sentence(),
      ...(betType === 'hole' && { holeNumber: chance.integer({ min: 1, max: 18 }) }),
    };

    await request(app)
      .post(`/api/rounds/${roundId}/side-bets`)
      .send(betData)
      .expect(201);

    expect(sideBetsCreateController).toHaveBeenCalled();
    const lastCall = sideBetsCreateController.mock.calls[
      sideBetsCreateController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.body).toEqual(betData);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('GET /api/rounds/:id/side-bets should require authentication and call sideBetsList controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();

    await request(app)
      .get(`/api/rounds/${roundId}/side-bets`)
      .expect(200);

    expect(sideBetsListController).toHaveBeenCalled();
    const lastCall = sideBetsListController.mock.calls[
      sideBetsListController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.user).toEqual({ userId: 1 });
  });

  test('PUT /api/rounds/:id/side-bets/:betId should require authentication and call sideBetsUpdate controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const betId = chance.guid();
    const updateData = { name: chance.word() };

    const response = await request(app)
      .put(`/api/rounds/${roundId}/side-bets/${betId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toEqual({ message: 'side bet update controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(sideBetsUpdateController).toHaveBeenCalled();
  });

  test('PUT /api/rounds/:id/side-bets/:betId should pass roundId, betId in params and update data in body', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/rounds', roundsRouter);

    const roundId = chance.guid();
    const betId = chance.guid();
    const updateData = {
      name: chance.word(),
      description: chance.sentence(),
      winnerId: chance.guid(),
    };

    await request(app)
      .put(`/api/rounds/${roundId}/side-bets/${betId}`)
      .send(updateData)
      .expect(200);

    expect(sideBetsUpdateController).toHaveBeenCalled();
    const lastCall = sideBetsUpdateController.mock.calls[
      sideBetsUpdateController.mock.calls.length - 1
    ];
    const req = lastCall[0];
    expect(req.params.id).toBe(roundId);
    expect(req.params.betId).toBe(betId);
    expect(req.body).toEqual(updateData);
    expect(req.user).toEqual({ userId: 1 });
  });
});
