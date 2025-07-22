import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import updateRoundController from '../../../controllers/rounds.update.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.update.service.js', () => ({
  default: vi.fn(),
}));

// Mock the error handler
vi.mock('../../../middleware/errorHandler.js', () => ({
  default: vi.fn(),
}));

describe('rounds.update.controller', () => {
  let updateRoundService;
  let req;
  let res;

  beforeEach(async () => {
    // Get the mocked functions
    ({ default: updateRoundService } = await import('../../../services/rounds.update.service.js'));

    // Reset mocks
    vi.clearAllMocks();

    // Mock request and response objects
    req = {
      params: {
        id: chance.guid(),
      },
      body: {
        name: chance.sentence({ words: 3 }),
        status: 'completed',
        starting_hole: chance.integer({ min: 1, max: 18 }),
        is_private: chance.bool(),
        skins_enabled: chance.bool(),
        skins_value: chance.floating({ min: 1, max: 100, fixed: 2 }).toString(),
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
    expect(typeof updateRoundController).toBe('function');
  });

  test('should call updateRoundService with correct parameters', async () => {
    const mockUpdatedRound = {
      id: req.params.id,
      name: req.body.name,
      status: req.body.status,
    };

    updateRoundService.mockResolvedValue(mockUpdatedRound);

    await updateRoundController(req, res);

    expect(updateRoundService).toHaveBeenCalledWith(
      req.params.id,
      req.body,
      req.user.userId,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockUpdatedRound,
    });
  });
});
