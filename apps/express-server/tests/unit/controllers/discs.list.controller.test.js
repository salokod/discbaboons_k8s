// This file has been renamed. Please use tests/unit/controllers/discs.list.controller.test.js

import {
  describe, test, expect, vi,
} from 'vitest';
import discmasterListController from '../../../controllers/discs.list.controller.js';

vi.mock('../../../services/discs.list.service.js', () => ({
  default: vi.fn(),
}));

const { default: listDiscsService } = await import('../../../services/discs.list.service.js');

describe('discmasterListController', () => {
  test('should export a function', () => {
    expect(typeof discmasterListController).toBe('function');
  });

  test('should call listDiscsService with req.query and return result as JSON', async () => {
    const req = { query: { brand: 'Innova', speed: '7' } };
    const res = { json: vi.fn() };
    const next = vi.fn();
    const fakeResult = [{ id: 1, brand: 'Innova', model: 'Leopard' }];
    listDiscsService.mockResolvedValue(fakeResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if service throws', async () => {
    const req = { query: { brand: 'Innova' } };
    const res = { json: vi.fn() };
    const next = vi.fn();
    const error = new Error('fail');
    listDiscsService.mockRejectedValue(error);

    await discmasterListController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should pass query params through unchanged', async () => {
    const req = { query: { brand: 'Discraft', speed: '5-7', approved: 'false' } };
    const res = { json: vi.fn() };
    const next = vi.fn();
    const fakeResult = [{ id: 2, brand: 'Discraft', model: 'Buzzz' }];
    listDiscsService.mockResolvedValue(fakeResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle empty query params', async () => {
    const req = { query: {} };
    const res = { json: vi.fn() };
    const next = vi.fn();
    const fakeResult = [];
    listDiscsService.mockResolvedValue(fakeResult);

    await discmasterListController(req, res, next);

    expect(listDiscsService).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });
});
