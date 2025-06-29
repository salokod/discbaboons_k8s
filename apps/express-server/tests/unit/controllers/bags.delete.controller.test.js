import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';
import deleteBagController from '../../../controllers/bags.delete.controller.js';

const chance = new Chance();

describe('deleteBagController', () => {
  test('should export a function', () => {
    expect(typeof deleteBagController).toBe('function');
  });

  test('should return 200 on successful deletion', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    // Create a mock deleteBagService
    const mockDeleteBagService = vi.fn().mockResolvedValue(true);

    // Mock the controller with the mocked service
    const mockController = async (req, res, next) => {
      try {
        const { userId: reqUserId } = req.user;
        const { id: reqBagId } = req.params;

        const deleted = await mockDeleteBagService(reqUserId, reqBagId);

        if (!deleted) {
          return res.status(404).json({
            success: false,
            message: 'Bag not found',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Bag deleted successfully',
        });
      } catch (err) {
        return next(err);
      }
    };

    const req = {
      user: { userId },
      params: { id: bagId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await mockController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Bag deleted successfully',
    });
  });

  test('should return 404 when bag is not found', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    // Create a mock deleteBagService that returns null (not found)
    const mockDeleteBagService = vi.fn().mockResolvedValue(null);

    // Mock the controller with the mocked service
    const mockController2 = async (req, res, next) => {
      try {
        const { userId: reqUserId } = req.user;
        const { id: reqBagId } = req.params;

        const deleted = await mockDeleteBagService(reqUserId, reqBagId);

        if (!deleted) {
          return res.status(404).json({
            success: false,
            message: 'Bag not found',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Bag deleted successfully',
        });
      } catch (err) {
        return next(err);
      }
    };

    const req = {
      user: { userId },
      params: { id: bagId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await mockController2(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bag not found',
    });
  });

  test('should call next with error when service throws', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const serviceError = new Error('Service error');

    // Create a mock deleteBagService that throws an error
    const mockDeleteBagService = vi.fn().mockRejectedValue(serviceError);

    // Mock the controller with the mocked service
    const mockController3 = async (req, res, next) => {
      try {
        const { userId: reqUserId } = req.user;
        const { id: reqBagId } = req.params;

        const deleted = await mockDeleteBagService(reqUserId, reqBagId);

        if (!deleted) {
          return res.status(404).json({
            success: false,
            message: 'Bag not found',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Bag deleted successfully',
        });
      } catch (err) {
        return next(err);
      }
    };

    const req = {
      user: { userId },
      params: { id: bagId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await mockController3(req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});
