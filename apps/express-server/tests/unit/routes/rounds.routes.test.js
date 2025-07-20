import {
  describe, test, expect, vi, beforeAll, beforeEach,
} from 'vitest';
import express from 'express';
import request from 'supertest';
import Chance from 'chance';

const chance = new Chance();

let roundsRouter;
let roundsCreateController;
let authenticateToken;

beforeAll(async () => {
  // Mock the controller
  roundsCreateController = vi.fn((req, res) => {
    res.status(201).json({ message: 'create controller called' });
  });

  // Mock the auth middleware
  authenticateToken = vi.fn((req, res, next) => {
    req.user = { userId: 1 };
    next();
  });

  vi.doMock('../../../controllers/rounds.create.controller.js', () => ({
    default: roundsCreateController,
  }));

  vi.doMock('../../../middleware/auth.middleware.js', () => ({
    default: authenticateToken,
  }));

  // Mock the service to avoid database calls
  vi.doMock('../../../services/rounds.create.service.js', () => ({
    default: vi.fn().mockResolvedValue({}),
  }));

  // Import the router after mocking
  ({ default: roundsRouter } = await import('../../../routes/rounds.routes.js'));
});

describe('rounds routes', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    roundsCreateController.mockClear();
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
});
