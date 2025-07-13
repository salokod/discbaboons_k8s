import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let bagsFriendsListController;
let listFriendBagsService;

beforeAll(async () => {
  // Dynamically import the controller and mock the service
  listFriendBagsService = vi.fn();
  vi.doMock('../../../services/bags.friends.list.service.js', () => ({
    default: listFriendBagsService,
  }));
  ({ default: bagsFriendsListController } = await import('../../../controllers/bags.friends.list.controller.js'));
});

describe('bagsFriendsListController', () => {
  test('should export a function', () => {
    expect(typeof bagsFriendsListController).toBe('function');
  });

  test('should call next with error if friendUserId is not a valid integer', async () => {
    const req = {
      user: { userId: chance.integer({ min: 1 }) },
      params: { friendUserId: 'invalid' },
    };
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    await bagsFriendsListController(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ValidationError',
        message: expect.stringMatching(/friendUserId must be a valid integer/i),
      }),
    );
  });

  test('should call service and return 200 with friend bags', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const serviceResult = {
      friend: { id: friendUserId },
      bags: [
        {
          id: chance.guid(),
          name: chance.word(),
          disc_count: chance.integer({ min: 0, max: 10 }),
        },
      ],
    };

    const req = {
      user: { userId },
      params: { friendUserId: friendUserId.toString() },
    };
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    listFriendBagsService.mockResolvedValue(serviceResult);

    await bagsFriendsListController(req, res, next);

    expect(listFriendBagsService).toHaveBeenCalledWith(userId, friendUserId);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...serviceResult,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const mockError = new Error('Service error');

    listFriendBagsService.mockRejectedValue(mockError);

    const req = {
      user: { userId },
      params: { friendUserId: friendUserId.toString() },
    };
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    await bagsFriendsListController(req, res, next);

    expect(listFriendBagsService).toHaveBeenCalledWith(userId, friendUserId);
    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.json).not.toHaveBeenCalled();
  });
});
