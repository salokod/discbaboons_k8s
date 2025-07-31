import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import discmasterListController from '../../../controllers/discs.list.controller.js';

vi.mock('../../../services/discs.list.service.js', () => ({
  default: vi.fn(),
}));

const { default: listDiscsService } = await import('../../../services/discs.list.service.js');

describe('discmasterListController', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = { query: {} };
    res = { json: vi.fn() };
    next = vi.fn();
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof discmasterListController).toBe('function');
  });

  test('should call listDiscsService with req.query and return standardized response', async () => {
    req.query = { brand: 'Innova', speed: '7' };
    const serviceResult = {
      discs: [{ id: 1, brand: 'Innova', model: 'Leopard' }],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };
    listDiscsService.mockResolvedValue(serviceResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      discs: serviceResult.discs,
      pagination: {
        total: serviceResult.total,
        limit: serviceResult.limit,
        offset: serviceResult.offset,
        hasMore: serviceResult.hasMore,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if service throws', async () => {
    req.query = { brand: 'Innova' };
    const error = new Error('fail');
    listDiscsService.mockRejectedValue(error);

    await discmasterListController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should pass query params through unchanged', async () => {
    req.query = { brand: 'Discraft', speed: '5-7', approved: 'false' };
    const serviceResult = {
      discs: [{ id: 2, brand: 'Discraft', model: 'Buzzz' }],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };
    listDiscsService.mockResolvedValue(serviceResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      discs: serviceResult.discs,
      pagination: {
        total: serviceResult.total,
        limit: serviceResult.limit,
        offset: serviceResult.offset,
        hasMore: serviceResult.hasMore,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle empty query params', async () => {
    req.query = {};
    const serviceResult = {
      discs: [],
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    };
    listDiscsService.mockResolvedValue(serviceResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      discs: serviceResult.discs,
      pagination: {
        total: serviceResult.total,
        limit: serviceResult.limit,
        offset: serviceResult.offset,
        hasMore: serviceResult.hasMore,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call service with approved=false and return pending discs', async () => {
    const serviceResult = {
      discs: [
        {
          id: 1, brand: 'Test', model: 'Pending', approved: false,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };
    req.query = { approved: 'false' };
    listDiscsService.mockResolvedValue(serviceResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith({ approved: 'false' });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      discs: serviceResult.discs,
      pagination: {
        total: serviceResult.total,
        limit: serviceResult.limit,
        offset: serviceResult.offset,
        hasMore: serviceResult.hasMore,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
