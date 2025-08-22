import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import express from 'express';
import request from 'supertest';

import bagContentsBulkMarkLostController from '../../../controllers/bag-contents.bulk-mark-lost.controller.js';
import authenticateToken from '../../../middleware/auth.middleware.js';
import { bagsBulkRateLimit } from '../../../middleware/bagsRateLimit.middleware.js';
import bagsRequestLimit from '../../../middleware/bagsRequestLimit.middleware.js';

// Mock the controller
vi.mock('../../../controllers/bag-contents.bulk-mark-lost.controller.js', () => ({
  default: vi.fn((req, res) => res.status(200).json({ success: true })),
}));

// Mock the middleware
vi.mock('../../../middleware/auth.middleware.js', () => ({
  default: vi.fn((req, res, next) => {
    req.user = { userId: 1 };
    next();
  }),
}));

vi.mock('../../../middleware/bagsRateLimit.middleware.js', () => ({
  bagsBulkRateLimit: vi.fn((req, res, next) => next()),
}));

vi.mock('../../../middleware/bagsRequestLimit.middleware.js', () => ({
  default: vi.fn((req, res, next) => next()),
}));

describe('PATCH /api/bags/discs/bulk-mark-lost route', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add the specific route we're testing
    app.patch('/api/bags/discs/bulk-mark-lost', bagsBulkRateLimit, bagsRequestLimit, authenticateToken, bagContentsBulkMarkLostController);

    vi.clearAllMocks();
  });

  test('should use correct middleware chain for bulk mark lost endpoint', async () => {
    const response = await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .send({ content_ids: ['uuid1', 'uuid2'], lost_notes: 'test' });

    expect(response.status).toBe(200);

    // Verify middleware was called
    expect(bagsBulkRateLimit).toHaveBeenCalled();
    expect(bagsRequestLimit).toHaveBeenCalled();
    expect(authenticateToken).toHaveBeenCalled();
    expect(bagContentsBulkMarkLostController).toHaveBeenCalled();
  });

  test('should pass request to bulk mark lost controller', async () => {
    const testData = { content_ids: ['uuid1', 'uuid2'], lost_notes: 'Lost at tournament' };

    await request(app)
      .patch('/api/bags/discs/bulk-mark-lost')
      .send(testData);

    expect(bagContentsBulkMarkLostController).toHaveBeenCalledWith(
      expect.objectContaining({
        body: testData,
        user: { userId: 1 },
      }),
      expect.any(Object),
      expect.any(Function),
    );
  });
});
