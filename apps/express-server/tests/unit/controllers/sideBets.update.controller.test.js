import {
  describe, it, expect, vi, beforeEach, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let sideBetsUpdateController;
let sideBetsUpdateService;

describe('sideBetsUpdateController', () => {
  beforeAll(async () => {
    // Mock the service
    sideBetsUpdateService = vi.fn();

    vi.doMock('../../../services/sideBets.update.service.js', () => ({
      default: sideBetsUpdateService,
    }));

    // Import controller after mocking
    ({ default: sideBetsUpdateController } = await import('../../../controllers/sideBets.update.controller.js'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a function', () => {
    expect(typeof sideBetsUpdateController).toBe('function');
  });

  it('should call service with correct parameters', async () => {
    const req = {
      params: {
        id: chance.guid(),
        betId: chance.guid(),
      },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
      body: { name: chance.word() },
    };
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockResult = { id: req.params.betId, name: req.body.name };
    sideBetsUpdateService.mockResolvedValueOnce(mockResult);

    await sideBetsUpdateController(req, res);

    expect(sideBetsUpdateService).toHaveBeenCalledWith(
      req.params.betId,
      req.params.id,
      req.user.userId,
      req.body,
    );
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
});
