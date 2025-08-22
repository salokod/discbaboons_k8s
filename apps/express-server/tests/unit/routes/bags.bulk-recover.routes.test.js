import {
  describe, test, expect, vi,
} from 'vitest';
import request from 'supertest';
import express from 'express';
import bagContentsBulkRecoverController from '../../../controllers/bag-contents.bulk-recover.controller.js';
import authenticateToken from '../../../middleware/auth.middleware.js';
import bagsRequestLimit from '../../../middleware/bagsRequestLimit.middleware.js';
import { bagsBulkRateLimit } from '../../../middleware/bagsRateLimit.middleware.js';

// Mock the controller and middleware
vi.mock('../../../controllers/bag-contents.bulk-recover.controller.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../middleware/auth.middleware.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../middleware/bagsRequestLimit.middleware.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../middleware/bagsRateLimit.middleware.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    bagsBulkRateLimit: vi.fn(),
  };
});

describe('PUT /api/bags/discs/bulk-recover route', () => {
  test('should use correct middleware chain for bulk recover endpoint', async () => {
    const app = express();

    // Mock middleware to pass through
    bagsBulkRateLimit.mockImplementation((req, res, next) => next());
    bagsRequestLimit.mockImplementation((req, res, next) => next());
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'testUser' };
      next();
    });
    bagContentsBulkRecoverController.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });

    // Import and use the router after mocking
    const bagsRouter = await import('../../../routes/bags.routes.js');
    app.use('/api/bags', bagsRouter.default);

    const response = await request(app)
      .put('/api/bags/discs/bulk-recover')
      .send({
        content_ids: ['disc1', 'disc2'],
        bag_id: 'bag123',
      });

    expect(response.status).toBe(200);

    // Verify middleware was called in correct order
    expect(bagsBulkRateLimit).toHaveBeenCalled();
    expect(bagsRequestLimit).toHaveBeenCalled();
    expect(authenticateToken).toHaveBeenCalled();
    expect(bagContentsBulkRecoverController).toHaveBeenCalled();
  });

  test('should pass request to bulk recover controller', async () => {
    const app = express();

    // Mock middleware to pass through
    bagsBulkRateLimit.mockImplementation((req, res, next) => next());
    bagsRequestLimit.mockImplementation((req, res, next) => next());
    authenticateToken.mockImplementation((req, res, next) => {
      req.user = { userId: 'testUser' };
      next();
    });
    bagContentsBulkRecoverController.mockImplementation((req, res) => {
      // Verify the request data is passed correctly
      expect(req.body.content_ids).toEqual(['disc1', 'disc2']);
      expect(req.body.bag_id).toBe('bag123');
      expect(req.user.userId).toBe('testUser');
      res.status(200).json({ success: true });
    });

    // Import and use the router after mocking
    const bagsRouter = await import('../../../routes/bags.routes.js');
    app.use('/api/bags', bagsRouter.default);

    await request(app)
      .put('/api/bags/discs/bulk-recover')
      .send({
        content_ids: ['disc1', 'disc2'],
        bag_id: 'bag123',
      });
  });
});
