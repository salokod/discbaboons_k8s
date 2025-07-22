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
});
