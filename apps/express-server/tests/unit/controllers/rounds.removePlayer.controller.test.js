import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import removePlayerController from '../../../controllers/rounds.removePlayer.controller.js';
import removePlayerService from '../../../services/rounds.removePlayer.service.js';

// Mock the service
vi.mock('../../../services/rounds.removePlayer.service.js', () => ({
  default: vi.fn(),
}));

const chance = new Chance();

describe('rounds.removePlayer.controller', () => {
  let req; let res; let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: {
        id: chance.guid(),
        playerId: chance.guid(),
      },
      user: {
        userId: chance.integer({ min: 1, max: 1000 }),
      },
    };
    res = {
      json: vi.fn(),
    };
    next = vi.fn();
  });

  test('should export a function', () => {
    expect(typeof removePlayerController).toBe('function');
  });

  test('should accept req, res, next parameters', async () => {
    removePlayerService.mockResolvedValue({ success: true });

    await removePlayerController(req, res, next);
    expect(true).toBe(true); // Just checking it doesn't throw
  });

  test('should call service with roundId, playerId, and userId', async () => {
    removePlayerService.mockResolvedValue({ success: true });

    await removePlayerController(req, res, next);

    expect(removePlayerService).toHaveBeenCalledWith(
      req.params.id,
      req.params.playerId,
      req.user.userId,
    );
  });

  test('should return result via res.json', async () => {
    const mockResult = { success: true };
    removePlayerService.mockResolvedValue(mockResult);

    await removePlayerController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('should handle errors by calling next', async () => {
    const error = new Error(chance.sentence());
    removePlayerService.mockRejectedValue(error);

    await removePlayerController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
