import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { Chance } from 'chance';

// Import after mocking
import getScoresService from '../../../services/rounds.getScores.service.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.getScores.service.js', () => ({
  default: vi.fn(),
}));

describe('rounds.getScores.controller.js', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: { id: chance.guid() },
      user: { userId: chance.integer({ min: 1, max: 1000 }) },
    };

    res = {
      json: vi.fn(),
    };

    next = vi.fn();
  });

  test('should export a function', async () => {
    const getScoresController = await import('../../../controllers/rounds.getScores.controller.js');
    expect(typeof getScoresController.default).toBe('function');
  });

  test('should call service with roundId and userId', async () => {
    const getScoresController = (await import('../../../controllers/rounds.getScores.controller.js')).default;
    const mockResult = { playerId: { username: 'test' } };
    getScoresService.mockResolvedValue(mockResult);

    await getScoresController(req, res, next);

    expect(getScoresService).toHaveBeenCalledWith(req.params.id, req.user.userId);
  });

  test('should return service result as JSON response', async () => {
    const getScoresController = (await import('../../../controllers/rounds.getScores.controller.js')).default;
    const mockResult = { playerId: { username: 'test', holes: {} } };
    getScoresService.mockResolvedValue(mockResult);

    await getScoresController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('should call next with error when service throws', async () => {
    const getScoresController = (await import('../../../controllers/rounds.getScores.controller.js')).default;
    const error = new Error('Test error');
    getScoresService.mockRejectedValue(error);

    await getScoresController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
