import {
  describe, test, expect, vi,
} from 'vitest';
import request from 'supertest';
import express from 'express';
import roundsRouter from '../../../routes/rounds.routes.js';

// Mock all the controllers
vi.mock('../../../controllers/rounds.submitScores.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock other controllers to avoid errors
vi.mock('../../../controllers/rounds.create.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.list.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.get.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.addPlayer.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.listPlayers.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.removePlayer.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.update.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.delete.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.setPar.controller.js', () => ({ default: vi.fn() }));
vi.mock('../../../controllers/rounds.getPars.controller.js', () => ({ default: vi.fn() }));

// Mock authentication middleware
vi.mock('../../../middleware/auth.middleware.js', () => ({
  default: vi.fn((req, res, next) => {
    req.user = { userId: 1 };
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use('/api/rounds', roundsRouter);

describe('POST /api/rounds/:id/scores route', () => {
  test('should be defined and accessible', async () => {
    const response = await request(app)
      .post('/api/rounds/test-id/scores')
      .send({ scores: [] });

    expect(response.status).toBe(200);
  });
});
