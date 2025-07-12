import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';
import moveDiscController from '../../../controllers/bag-contents.move.controller.js';

const chance = new Chance();

describe('moveDiscController', () => {
  test('should export a function', () => {
    expect(typeof moveDiscController).toBe('function');
  });

  test('should return 200 with success message when service succeeds', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });
    const movedCount = chance.integer({ min: 1, max: 5 });

    const req = {
      user: { userId },
      body: { sourceBagId, targetBagId, contentIds: [] },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    const mockService = vi.fn().mockResolvedValue({
      message: 'Discs moved successfully',
      movedCount,
    });

    await moveDiscController(req, res, next, mockService);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Discs moved successfully',
      movedCount,
    });
    expect(mockService).toHaveBeenCalledWith(userId, sourceBagId, targetBagId, {
      contentIds: [],
    });
  });

  test('should return 404 when service returns null', async () => {
    const req = {
      user: { userId: chance.integer({ min: 1, max: 10000 }) },
      body: {
        sourceBagId: 'invalid-uuid',
        targetBagId: chance.guid({ version: 4 }),
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();
    const mockService = vi.fn().mockResolvedValue(null);

    await moveDiscController(req, res, next, mockService);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bags not found or access denied',
    });
  });

  test('should call next with error when service throws', async () => {
    const req = {
      user: { userId: chance.integer({ min: 1, max: 10000 }) },
      body: {
        sourceBagId: chance.guid({ version: 4 }),
        targetBagId: chance.guid({ version: 4 }),
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();
    const testError = new Error('Database error');
    const mockService = vi.fn().mockRejectedValue(testError);

    await moveDiscController(req, res, next, mockService);

    expect(next).toHaveBeenCalledWith(testError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
