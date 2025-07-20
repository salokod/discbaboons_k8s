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
let authenticateToken;

beforeAll(async () => {
  // Mock the controllers
  roundsCreateController = vi.fn((req, res) => {
    res.status(201).json({ message: 'create controller called' });
  });

  roundsListController = vi.fn((req, res) => {
    res.json({ message: 'list controller called' });
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

  vi.doMock('../../../middleware/auth.middleware.js', () => ({
    default: authenticateToken,
  }));

  // Mock the services to avoid database calls
  vi.doMock('../../../services/rounds.create.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  vi.doMock('../../../services/rounds.list.service.js', () => ({
    default: vi.fn().mockResolvedValue({ rounds: [], total: 0, limit: 50, offset: 0, hasMore: false }),
  }));

  // Import the router after mocking
  ({ default: roundsRouter } = await import('../../../routes/rounds.routes.js'));
});

describe('rounds routes', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    roundsCreateController.mockClear();
    roundsListController.mockClear();
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
});
