import Chance from 'chance';
import friendsListController from '../../../controllers/friends.list.controller.js';
import * as serviceModule from '../../../services/friends.list.service.js';

const chance = new Chance();

describe('friendsListController', () => {
  test('should export a function', () => {
    expect(typeof friendsListController).toBe('function');
  });

  test('should call the service with correct arguments and return paginated result', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const mockServiceResult = {
      friends: [{ id: chance.integer({ min: 1, max: 1000 }) }],
      pagination: {
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    };
    const mockService = vi.spyOn(serviceModule, 'default').mockResolvedValue(mockServiceResult);
    const req = {
      user: { userId },
      query: {},
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(userId, {});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockServiceResult,
    });
    expect(next).not.toHaveBeenCalled();

    mockService.mockRestore();
  });

  test('should pass pagination parameters to service', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const limit = '10';
    const offset = '5';
    const mockServiceResult = {
      friends: [],
      pagination: {
        total: 0,
        limit: 10,
        offset: 5,
        hasMore: false,
      },
    };
    const mockService = vi.spyOn(serviceModule, 'default').mockResolvedValue(mockServiceResult);
    const req = {
      user: { userId },
      query: { limit, offset },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(userId, { limit: '10', offset: '5' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockServiceResult,
    });

    mockService.mockRestore();
  });

  test('should call next with error if service throws', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const error = new Error('Service failed');
    const mockService = vi.spyOn(serviceModule, 'default').mockRejectedValue(error);
    const req = {
      user: { userId },
      query: {},
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(userId, {});
    expect(next).toHaveBeenCalledWith(error);

    mockService.mockRestore();
  });
});
