// apps/express-server/tests/unit/controllers/discs.deny.controller.test.js
import {
  describe, test, expect, vi,
} from 'vitest';
import discsDenyController from '../../../controllers/discs.deny.controller.js';

// Mock the service
vi.mock('../../../services/discs.deny.service.js', () => ({
  default: vi.fn(),
}));

describe('discsDenyController', () => {
  test('should export a function', () => {
    expect(typeof discsDenyController).toBe('function');
  });

  test('should call denyDiscService with correct parameters', async () => {
    const denyDiscService = (await import('../../../services/discs.deny.service.js')).default;
    const mockDisc = { id: '123', denied: true, denied_reason: 'Test reason' };
    denyDiscService.mockResolvedValueOnce(mockDisc);

    const req = {
      params: { id: '123' },
      body: { reason: 'Test reason' },
      user: { userId: 1, isAdmin: true },
    };
    const res = {
      json: vi.fn(),
    };
    const next = vi.fn();

    await discsDenyController(req, res, next);

    expect(denyDiscService).toHaveBeenCalledWith('123', 'Test reason', 1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      disc: mockDisc,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if service throws', async () => {
    const denyDiscService = (await import('../../../services/discs.deny.service.js')).default;
    const error = new Error('Service error');
    denyDiscService.mockRejectedValueOnce(error);

    const req = {
      params: { id: '123' },
      body: { reason: 'Test reason' },
      user: { userId: 1, isAdmin: true },
    };
    const res = {
      json: vi.fn(),
    };
    const next = vi.fn();

    await discsDenyController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
