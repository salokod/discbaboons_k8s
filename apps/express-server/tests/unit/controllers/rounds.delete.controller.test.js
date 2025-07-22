import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import deleteRoundController from '../../../controllers/rounds.delete.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.delete.service.js', () => ({
  default: vi.fn(),
}));

// Mock the error handler
vi.mock('../../../middleware/errorHandler.js', () => ({
  default: vi.fn(),
}));

describe('rounds.delete.controller', () => {
  let deleteRoundService;
  let req;
  let res;

  beforeEach(async () => {
    // Get the mocked functions
    ({ default: deleteRoundService } = await import('../../../services/rounds.delete.service.js'));

    // Reset mocks
    vi.clearAllMocks();

    // Mock request and response objects
    req = {
      params: {
        id: chance.guid(),
      },
      user: {
        userId: chance.integer({ min: 1, max: 1000 }),
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  test('should export a function', () => {
    expect(typeof deleteRoundController).toBe('function');
  });

  test('should call deleteRoundService with correct parameters', async () => {
    deleteRoundService.mockResolvedValue({ success: true });

    await deleteRoundController(req, res);

    expect(deleteRoundService).toHaveBeenCalledWith(
      req.params.id,
      req.user.userId,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
    });
  });
});
