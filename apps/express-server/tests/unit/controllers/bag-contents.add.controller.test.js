import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let bagContentsAddController;
let addToBagService;

beforeAll(async () => {
  // Dynamically import the controller and mock the service
  addToBagService = vi.fn();
  vi.doMock('../../../services/bag-contents.add.service.js', () => ({
    default: addToBagService,
  }));
  ({ default: bagContentsAddController } = await import('../../../controllers/bag-contents.add.controller.js'));
});

describe('bagContentsAddController', () => {
  test('should export a function', () => {
    expect(typeof bagContentsAddController).toBe('function');
  });

  test('should call addToBagService and send 201 with created bag content', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockBagId = chance.guid({ version: 4 });
    const mockDiscData = {
      disc_id: chance.guid({ version: 4 }),
      notes: chance.sentence(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
    };
    const mockBagContent = {
      id: chance.guid({ version: 4 }),
      bag_id: mockBagId,
      disc_id: mockDiscData.disc_id,
      notes: mockDiscData.notes,
      weight: mockDiscData.weight,
      condition: 'good',
    };

    addToBagService.mockResolvedValueOnce(mockBagContent);

    const req = {
      user: { userId: mockUserId },
      params: { id: mockBagId },
      body: mockDiscData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await bagContentsAddController(req, res);

    expect(addToBagService).toHaveBeenCalledWith(mockUserId, mockBagId, mockDiscData);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, bag_content: mockBagContent });
  });

  test('should call next(err) if addToBagService throws', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockBagId = chance.guid({ version: 4 });
    const mockDiscData = { disc_id: chance.guid({ version: 4 }) };
    const mockError = new Error(chance.sentence());
    addToBagService.mockRejectedValueOnce(mockError);

    const req = {
      user: { userId: mockUserId },
      params: { id: mockBagId },
      body: mockDiscData,
    };
    const res = {};
    const next = vi.fn();

    await bagContentsAddController(req, res, next);

    expect(next).toHaveBeenCalledWith(mockError);
  });
});
