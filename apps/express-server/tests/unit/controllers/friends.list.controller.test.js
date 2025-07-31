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

    expect(mockService).toHaveBeenCalledWith(userId, { limit: 10, offset: 5 });
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

  test('should return 401 if user is not authenticated', async () => {
    const req = {
      user: null,
      query: {},
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User authentication required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if user object exists but userId is missing', async () => {
    const req = {
      user: {},
      query: {},
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User authentication required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 400 for invalid query parameters', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const req = {
      user: { userId },
      query: { limit: 'invalid', offset: '10' },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Limit must be a positive integer',
      field: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 400 for unknown query parameters', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const req = {
      user: { userId },
      query: { limit: '20', unknownParam: 'value' },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsListController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Unknown query parameters: unknownParam',
      field: null,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
