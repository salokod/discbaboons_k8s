import {
  describe, test, expect, vi,
} from 'vitest';
import request from 'supertest';
import express from 'express';
import roundsRouter from '../../../routes/rounds.routes.js';

// Mock all the controllers
vi.mock('../../../controllers/rounds.getScores.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.create.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.list.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.get.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.addPlayer.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.listPlayers.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.removePlayer.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.update.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.delete.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.setPar.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.getPars.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

vi.mock('../../../controllers/rounds.submitScores.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock the auth middleware
vi.mock('../../../middleware/auth.middleware.js', () => ({
  default: vi.fn((req, res, next) => {
    req.user = { userId: 1 };
    next();
  }),
}));

describe('GET /api/rounds/:id/scores', () => {
  test('should route to getScores controller', async () => {
    const app = express();
    app.use('/api/rounds', roundsRouter);

    const response = await request(app)
      .get('/api/rounds/test-uuid/scores')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
