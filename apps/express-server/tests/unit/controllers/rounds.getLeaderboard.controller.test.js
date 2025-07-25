import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { Chance } from 'chance';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.getLeaderboard.service.js', () => ({
  default: vi.fn(),
}));

describe('rounds.getLeaderboard.controller.js', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: { id: chance.guid() },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };
    res = {
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const getLeaderboardController = await import('../../../controllers/rounds.getLeaderboard.controller.js');
    expect(typeof getLeaderboardController.default).toBe('function');
  });

  test('should call service with correct parameters and return result', async () => {
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;
    const getLeaderboardController = (await import('../../../controllers/rounds.getLeaderboard.controller.js')).default;

    const mockResult = {
      players: [
        {
          playerId: chance.guid(),
          username: 'testuser',
          position: 1,
          totalStrokes: 15,
          holesCompleted: 5,
        },
      ],
      roundSettings: {
        skinsEnabled: true,
        skinsValue: '5.00',
      },
    };

    getLeaderboardService.mockResolvedValueOnce(mockResult);

    await getLeaderboardController(req, res, next);

    expect(getLeaderboardService).toHaveBeenCalledWith(req.params.id, req.user.userId);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const getLeaderboardService = (await import('../../../services/rounds.getLeaderboard.service.js')).default;
    const getLeaderboardController = (await import('../../../controllers/rounds.getLeaderboard.controller.js')).default;

    const mockError = new Error('Service error');
    getLeaderboardService.mockRejectedValueOnce(mockError);

    await getLeaderboardController(req, res, next);

    expect(getLeaderboardService).toHaveBeenCalledWith(req.params.id, req.user.userId);
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(mockError);
  });
});
