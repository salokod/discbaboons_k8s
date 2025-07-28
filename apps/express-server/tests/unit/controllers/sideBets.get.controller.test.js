import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

vi.mock('../../../services/sideBets.get.service.js', () => ({
  default: vi.fn(),
}));

describe('sideBetsGetController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {
        id: chance.guid(),
        betId: chance.guid(),
      },
      user: {
        userId: chance.integer({ min: 1, max: 1000 }),
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it('should export a function', async () => {
    const sideBetsGetController = await import('../../../controllers/sideBets.get.controller.js');
    expect(typeof sideBetsGetController.default).toBe('function');
  });

  it('should call service with correct params and return result', async () => {
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;
    const sideBetsGetController = (await import('../../../controllers/sideBets.get.controller.js')).default;

    const mockBet = {
      id: mockReq.params.betId,
      roundId: mockReq.params.id,
      name: chance.sentence({ words: 3 }),
      amount: '10.00',
      participants: [],
    };

    sideBetsGetService.mockResolvedValueOnce(mockBet);

    await sideBetsGetController(mockReq, mockRes, mockNext);

    expect(sideBetsGetService).toHaveBeenCalledWith(
      mockReq.params.betId,
      mockReq.params.id,
      mockReq.user.userId,
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockBet);
  });

  it('should handle errors properly', async () => {
    const sideBetsGetService = (await import('../../../services/sideBets.get.service.js')).default;
    const sideBetsGetController = (await import('../../../controllers/sideBets.get.controller.js')).default;

    const error = new Error('Side bet not found');
    sideBetsGetService.mockRejectedValueOnce(error);

    await sideBetsGetController(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
