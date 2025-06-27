import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

const mockApproveDiscService = vi.fn();

vi.mock('../../../services/discs.approve.service.js', () => ({
  default: mockApproveDiscService,
}));

const { default: discsApproveController } = await import('../../../controllers/discs.approve.controller.js');

describe('discsApproveController', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    req = { params: { id: chance.integer({ min: 1, max: 10000 }).toString() } };
    res = { json: vi.fn(), status: vi.fn(() => res) };
    next = vi.fn();
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof discsApproveController).toBe('function');
  });

  test('should call approveDiscService and return the approved disc', async () => {
    const approvedDisc = { id: req.params.id, approved: true };
    mockApproveDiscService.mockResolvedValue(approvedDisc);

    await discsApproveController(req, res, next);

    expect(mockApproveDiscService).toHaveBeenCalledWith(req.params.id);
    expect(res.json).toHaveBeenCalledWith(approvedDisc);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if service throws', async () => {
    const error = new Error('fail');
    mockApproveDiscService.mockRejectedValue(error);

    await discsApproveController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
