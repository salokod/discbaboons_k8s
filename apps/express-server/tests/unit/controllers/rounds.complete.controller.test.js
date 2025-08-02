import {
  describe, it, expect, vi, beforeEach, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let roundsCompleteController;
let roundsCompleteService;

describe('roundsCompleteController', () => {
  beforeAll(async () => {
    // Mock the service
    roundsCompleteService = vi.fn();

    vi.doMock('../../../services/rounds.complete.service.js', () => ({
      default: roundsCompleteService,
    }));

    // Import controller after mocking
    ({ default: roundsCompleteController } = await import('../../../controllers/rounds.complete.controller.js'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export a function', () => {
    expect(typeof roundsCompleteController).toBe('function');
  });

  it('should call service with correct parameters', async () => {
    const req = {
      params: {
        id: chance.guid(),
      },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockResult = {
      success: true,
      round: { id: req.params.id, status: 'completed' },
    };
    roundsCompleteService.mockResolvedValueOnce(mockResult);

    await roundsCompleteController(req, res);

    expect(roundsCompleteService).toHaveBeenCalledWith(
      req.params.id,
      req.user.userId,
    );
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
});
