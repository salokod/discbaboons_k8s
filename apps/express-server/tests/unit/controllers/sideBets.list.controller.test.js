import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { Chance } from 'chance';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/sideBets.list.service.js', () => ({
  default: vi.fn(),
}));

describe('sideBets.list.controller.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const sideBetsListController = await import('../../../controllers/sideBets.list.controller.js');
    expect(typeof sideBetsListController.default).toBe('function');
  });

  test('should call service with roundId and userId from request', async () => {
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;
    const sideBetsListController = (await import('../../../controllers/sideBets.list.controller.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const mockResult = {
      roundId,
      sideBets: [],
      playerSummary: {},
    };

    sideBetsListService.mockResolvedValueOnce(mockResult);

    const req = {
      params: { id: roundId },
      user: { userId },
    };
    const res = {
      json: vi.fn(),
    };
    const next = vi.fn();

    await sideBetsListController(req, res, next);

    expect(sideBetsListService).toHaveBeenCalledWith(roundId, userId);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const sideBetsListService = (await import('../../../services/sideBets.list.service.js')).default;
    const sideBetsListController = (await import('../../../controllers/sideBets.list.controller.js')).default;

    const error = new Error('Service error');
    sideBetsListService.mockRejectedValueOnce(error);

    const req = {
      params: { id: chance.guid() },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };
    const res = {
      json: vi.fn(),
    };
    const next = vi.fn();

    await sideBetsListController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
