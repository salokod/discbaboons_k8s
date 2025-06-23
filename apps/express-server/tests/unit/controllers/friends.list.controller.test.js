import Chance from 'chance';
import friendsListController from '../../../controllers/friends.list.controller.js';
import * as serviceModule from '../../../services/friends.list.service.js';

const chance = new Chance();

describe('friendsListController', () => {
  test('should export a function', () => {
    expect(typeof friendsListController).toBe('function');
  });

  test('should call the service with correct arguments and return result', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeFriends = [{ id: chance.integer({ min: 1, max: 1000 }) }];
    const mockService = vi.spyOn(serviceModule, 'default').mockResolvedValue(fakeFriends);
    const req = {
      user: { userId },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      friends: fakeFriends,
    });
    expect(next).not.toHaveBeenCalled();

    mockService.mockRestore();
  });

  test('should call next with error if service throws', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const error = new Error('Service failed');
    const mockService = vi.spyOn(serviceModule, 'default').mockRejectedValue(error);
    const req = {
      user: { userId },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(userId);
    expect(next).toHaveBeenCalledWith(error);

    mockService.mockRestore();
  });
});
