import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';
import removeDiscController from '../../../controllers/bag-contents.remove.controller.js';

const chance = new Chance();

describe('removeDiscController', () => {
  test('should export a function', () => {
    expect(typeof removeDiscController).toBe('function');
  });

  test('should call removeDiscService with correct parameters and return 200', async () => {
    const contentId = chance.guid();
    const userId = chance.integer({ min: 1 });

    const req = {
      params: { contentId },
      user: { userId },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Mock the service
    const mockRemoveDiscService = vi.fn().mockResolvedValue({
      message: 'Disc removed successfully',
    });

    // We'll need to import and mock the service
    await removeDiscController(req, res, vi.fn(), mockRemoveDiscService);

    expect(mockRemoveDiscService).toHaveBeenCalledWith(userId, contentId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Disc removed from your account successfully',
    });
  });

  test('should return 404 when service returns null (invalid UUID)', async () => {
    const contentId = chance.word(); // Invalid UUID
    const userId = chance.integer({ min: 1 });

    const req = {
      params: { contentId },
      user: { userId },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const mockRemoveDiscService = vi.fn().mockResolvedValue(null);

    await removeDiscController(req, res, vi.fn(), mockRemoveDiscService);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Disc not found or access denied',
    });
  });

  test('should let errorHandler middleware handle service errors', async () => {
    const contentId = chance.guid();
    const userId = chance.integer({ min: 1 });

    const req = {
      params: { contentId },
      user: { userId },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();
    const serviceError = new Error('Database error');
    const mockRemoveDiscService = vi.fn().mockRejectedValue(serviceError);

    await removeDiscController(req, res, next, mockRemoveDiscService);

    expect(next).toHaveBeenCalledWith(serviceError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
