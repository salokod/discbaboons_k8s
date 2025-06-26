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

  test('should call listDiscsService with req.query and return result as JSON', async () => {
    req.query = { brand: 'Innova', speed: '7' };
    const fakeResult = [{ id: 1, brand: 'Innova', model: 'Leopard' }];
    listDiscsService.mockResolvedValue(fakeResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith(fakeResult);
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
    const fakeResult = [{ id: 2, brand: 'Discraft', model: 'Buzzz' }];
    listDiscsService.mockResolvedValue(fakeResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle empty query params', async () => {
    req.query = {};
    const fakeResult = [];
    listDiscsService.mockResolvedValue(fakeResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call service with approved=false and return pending discs', async () => {
    const pendingDiscs = [
      {
        id: 1, brand: 'Test', model: 'Pending', approved: false,
      },
    ];
    req.query = { approved: 'false' };
    listDiscsService.mockResolvedValue(pendingDiscs);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith({ approved: 'false' });
    expect(res.json).toHaveBeenCalledWith(pendingDiscs);
    expect(next).not.toHaveBeenCalled();
  });
});
