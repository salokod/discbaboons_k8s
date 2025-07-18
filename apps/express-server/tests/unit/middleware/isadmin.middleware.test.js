import {
  describe, test, expect, vi, beforeAll, beforeEach,
} from 'vitest';
import mockDatabase from '../setup.js';

let isAdmin;

beforeAll(async () => {
  ({ default: isAdmin } = await import('../../../middleware/isadmin.middleware.js'));
});

describe('isAdmin middleware', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = { user: { userId: 123 } };
    res = { status: vi.fn(() => res), json: vi.fn() };
    next = vi.fn();
    mockDatabase.queryOne.mockClear();
  });

  test('should export a function', () => {
    expect(typeof isAdmin).toBe('function');
  });

  test('should return 403 if req.user is missing', async () => {
    req.user = undefined;
    await isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 403 if user is not found', async () => {
    mockDatabase.queryOne.mockResolvedValue(null);
    await isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 403 if user is not admin', async () => {
    mockDatabase.queryOne.mockResolvedValue({ id: 123, is_admin: false });
    await isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next if user is admin', async () => {
    mockDatabase.queryOne.mockResolvedValue({ id: 123, is_admin: true });
    await isAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
