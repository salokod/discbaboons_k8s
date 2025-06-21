import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import express from 'express';
import request from 'supertest';
import Chance from 'chance';

const chance = new Chance();

// Mock the controllers
vi.mock('../../../controllers/profile.get.controller.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../controllers/profile.update.controller.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../controllers/profile.search.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock the auth middleware
vi.mock('../../../middleware/auth.middleware.js', () => ({
  default: vi.fn((req, res, next) => next()),
}));

// Dynamic import AFTER mocking
const { default: profileRoutes } = await import('../../../routes/profile.routes.js');

describe('ProfileRoutes', () => {
  let app;
  let mockGetController;
  let mockUpdateController;
  let mockSearchController;

  beforeEach(async () => {
    const getController = await import('../../../controllers/profile.get.controller.js');
    const updateController = await import('../../../controllers/profile.update.controller.js');
    const searchController = await import('../../../controllers/profile.search.controller.js');
    mockGetController = getController.default;
    mockUpdateController = updateController.default;
    mockSearchController = searchController.default;

    app = express();
    app.use(express.json());
    app.use('/api/profile', profileRoutes);

    vi.clearAllMocks();
  });

  test('should export an Express router', () => {
    expect(profileRoutes).toBeDefined();
    expect(typeof profileRoutes).toBe('function'); // Express router is a function
  });

  test('should have GET /profile route that calls controller', async () => {
    mockGetController.mockImplementation((req, res) => {
      res.status(200).json({ success: true, profile: null });
    });

    const response = await request(app)
      .get('/api/profile')
      .expect(200);

    expect(mockGetController).toHaveBeenCalled();
    expect(response.body).toEqual({
      success: true,
      profile: null,
    });
  });

  test('should have PUT /profile route that calls update controller', async () => {
    mockUpdateController.mockImplementation((req, res) => {
      res.status(200).json({ success: true, profile: { name: 'Updated' } });
    });

    const response = await request(app)
      .put('/api/profile')
      .send({ name: 'Updated' })
      .expect(200);

    expect(mockUpdateController).toHaveBeenCalled();
    expect(response.body).toEqual({
      success: true,
      profile: { name: 'Updated' },
    });
  });

  test('GET /profile/search should call searchProfilesController', async () => {
    const query = { username: chance.word() };

    const response = await request(app)
      .get('/api/profile/search')
      .query(query)
      .expect(200);

    expect(mockSearchController).toHaveBeenCalled();
    expect(response.body).toEqual({ success: true });
  });
});
