import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let bagsCreateController;
let createBagService;

beforeAll(async () => {
  // Dynamically import the controller and mock the service
  createBagService = vi.fn();
  vi.doMock('../../../services/bags.create.service.js', () => ({
    default: createBagService,
  }));
  ({ default: bagsCreateController } = await import('../../../controllers/bags.create.controller.js'));
});

describe('bagsCreateController', () => {
  test('should export a function', () => {
    expect(typeof bagsCreateController).toBe('function');
  });

  test('should call createBagService and send 201 with created bag', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockBagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };
    const mockCreatedBag = {
      id: chance.guid(),
      ...mockBagData,
      user_id: mockUserId,
    };

    createBagService.mockResolvedValueOnce(mockCreatedBag);

    const req = {
      user: { userId: mockUserId },
      body: mockBagData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await bagsCreateController(req, res);

    expect(createBagService).toHaveBeenCalledWith(mockUserId, mockBagData);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, bag: mockCreatedBag });
  });

  test('should call next(err) if createBagService throws', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockBagData = { name: chance.word() };
    const mockError = new Error(chance.sentence());
    createBagService.mockRejectedValueOnce(mockError);

    const req = { user: { userId: mockUserId }, body: mockBagData };
    const res = {};
    const next = vi.fn();

    await bagsCreateController(req, res, next);

    expect(next).toHaveBeenCalledWith(mockError);
  });
});
