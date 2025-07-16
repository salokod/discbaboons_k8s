import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let getFriendBagController;
let getFriendBagService;

beforeAll(async () => {
  // Dynamically import the controller and mock the service
  getFriendBagService = vi.fn();
  vi.doMock('../../../services/bags.friends.get.service.js', () => ({
    default: getFriendBagService,
  }));
  ({ default: getFriendBagController } = await import('../../../controllers/bags.friends.get.controller.js'));
});

describe('getFriendBagController', () => {
  test('should export a function', () => {
    expect(typeof getFriendBagController).toBe('function');
  });

  test('should call next with error if friendUserId is not a valid integer', async () => {
    const req = {
      user: { userId: chance.integer({ min: 1 }) },
      params: { friendUserId: 'invalid', bagId: chance.guid() },
    };
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    await getFriendBagController(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ValidationError',
        message: expect.stringMatching(/friendUserId must be a valid integer/i),
      }),
    );
  });

  test('should call service with correct parameters and return success response', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    const mockServiceResult = {
      friend: { id: friendUserId },
      bag: {
        id: bagId,
        name: chance.word(),
        contents: [],
      },
    };

    const req = {
      user: { userId },
      params: {
        friendUserId: friendUserId.toString(),
        bagId,
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    getFriendBagService.mockResolvedValue(mockServiceResult);

    await getFriendBagController(req, res, next);

    expect(getFriendBagService).toHaveBeenCalledWith(userId, friendUserId, bagId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockServiceResult,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const error = new Error('Service error');

    const req = {
      user: { userId },
      params: {
        friendUserId: friendUserId.toString(),
        bagId,
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    getFriendBagService.mockRejectedValue(error);

    await getFriendBagController(req, res, next);

    expect(getFriendBagService).toHaveBeenCalledWith(userId, friendUserId, bagId);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});
