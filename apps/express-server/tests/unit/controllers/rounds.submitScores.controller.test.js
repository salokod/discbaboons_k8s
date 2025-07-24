import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import submitScoresController from '../../../controllers/rounds.submitScores.controller.js';
import submitScoresService from '../../../services/rounds.submitScores.service.js';

// Mock the service
vi.mock('../../../services/rounds.submitScores.service.js', () => ({
  default: vi.fn(),
}));

const chance = new Chance();

describe('rounds.submitScores.controller', () => {
  let req; let res; let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: {
        id: chance.guid(),
      },
      body: {
        scores: [{ playerId: chance.guid(), holeNumber: 1, strokes: 4 }],
      },
      user: {
        userId: chance.integer({ min: 1, max: 1000 }),
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  test('should export a function', () => {
    expect(typeof submitScoresController).toBe('function');
  });

  test('should accept req, res, next parameters', async () => {
    submitScoresService.mockResolvedValue({ success: true, scoresSubmitted: 1 });

    await submitScoresController(req, res, next);

    expect(submitScoresService).toHaveBeenCalled();
  });

  test('should call service with roundId, scores, and userId', async () => {
    const mockResult = { success: true, scoresSubmitted: 1 };
    submitScoresService.mockResolvedValue(mockResult);

    await submitScoresController(req, res, next);

    expect(submitScoresService).toHaveBeenCalledWith(
      req.params.id,
      req.body.scores,
      req.user.userId,
    );
  });

  test('should return 200 status and service result as JSON response', async () => {
    const mockResult = { success: true, scoresSubmitted: 2 };
    submitScoresService.mockResolvedValue(mockResult);

    await submitScoresController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const error = new Error('Service error');
    submitScoresService.mockRejectedValue(error);

    await submitScoresController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
