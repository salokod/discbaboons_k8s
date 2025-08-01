import {
  describe, it, expect, vi, beforeEach, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let sideBetsCancelController;
let sideBetsCancelService;

describe('sideBetsCancelController', () => {
  beforeAll(async () => {
    // Mock the service
    sideBetsCancelService = vi.fn();

    vi.doMock('../../../services/sideBets.cancel.service.js', () => ({
      default: sideBetsCancelService,
    }));

    // Import controller after mocking
    ({ default: sideBetsCancelController } = await import('../../../controllers/sideBets.cancel.controller.js'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a function', () => {
    expect(typeof sideBetsCancelController).toBe('function');
  });

  it('should call service with correct parameters', async () => {
    const req = {
      params: {
        id: chance.guid(),
        betId: chance.guid(),
      },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockResult = { success: true };
    sideBetsCancelService.mockResolvedValueOnce(mockResult);

    await sideBetsCancelController(req, res);

    expect(sideBetsCancelService).toHaveBeenCalledWith(
      req.params.betId,
      req.params.id,
      req.user.userId,
    );
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
});
