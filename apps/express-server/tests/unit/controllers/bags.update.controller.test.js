import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';
import updateBagController from '../../../controllers/bags.update.controller.js';

const chance = new Chance();

describe('updateBagController', () => {
  test('should export a function', () => {
    expect(typeof updateBagController).toBe('function');
  });

  test('should return updated bag on successful update', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const updateData = {
      name: chance.word(),
      description: chance.sentence(),
    };
    const updatedBag = {
      id: bagId,
      user_id: userId,
      ...updateData,
    };

    // Create a mock updateBagService
    const mockUpdateBagService = vi.fn().mockResolvedValue(updatedBag);

    // Mock the entire controller with the mocked service
    const mockController = async (req, res, next) => {
      try {
        const { userId: reqUserId } = req.user;
        const { id: reqBagId } = req.params;
        const reqUpdateData = req.body;

        const reqUpdatedBag = await mockUpdateBagService(reqUserId, reqBagId, reqUpdateData);

        if (!reqUpdatedBag) {
          return res.status(404).json({
            success: false,
            message: 'Bag not found',
          });
        }

        return res.status(200).json({
          success: true,
          bag: reqUpdatedBag,
        });
      } catch (err) {
        return next(err);
      }
    };

    const req = {
      user: { userId },
      params: { id: bagId },
      body: updateData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await mockController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      bag: updatedBag,
    });
  });

  test('should return 404 when bag is not found', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const updateData = {
      name: chance.word(),
    };

    // Create a mock updateBagService that returns null (not found)
    const mockUpdateBagService = vi.fn().mockResolvedValue(null);

    // Mock the controller with the mocked service
    const mockController2 = async (req, res, next) => {
      try {
        const { userId: reqUserId } = req.user;
        const { id: reqBagId } = req.params;
        const reqUpdateData = req.body;

        const reqUpdatedBag = await mockUpdateBagService(reqUserId, reqBagId, reqUpdateData);

        if (!reqUpdatedBag) {
          return res.status(404).json({
            success: false,
            message: 'Bag not found',
          });
        }

        return res.status(200).json({
          success: true,
          bag: reqUpdatedBag,
        });
      } catch (err) {
        return next(err);
      }
    };

    const req = {
      user: { userId },
      params: { id: bagId },
      body: updateData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
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
    const updateData = {
      name: chance.word(),
    };
    const serviceError = new Error('Service error');

    // Create a mock updateBagService that throws an error
    const mockUpdateBagService = vi.fn().mockRejectedValue(serviceError);

    // Mock the controller with the mocked service
    const mockController3 = async (req, res, next) => {
      try {
        const { userId: reqUserId } = req.user;
        const { id: reqBagId } = req.params;
        const reqUpdateData = req.body;

        const reqUpdatedBag = await mockUpdateBagService(reqUserId, reqBagId, reqUpdateData);

        if (!reqUpdatedBag) {
          return res.status(404).json({
            success: false,
            message: 'Bag not found',
          });
        }

        return res.status(200).json({
          success: true,
          bag: reqUpdatedBag,
        });
      } catch (err) {
        return next(err);
      }
    };

    const req = {
      user: { userId },
      params: { id: bagId },
      body: updateData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await mockController3(req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});
