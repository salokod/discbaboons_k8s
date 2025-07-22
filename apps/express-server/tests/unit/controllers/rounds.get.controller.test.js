import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import getRoundController from '../../../controllers/rounds.get.controller.js';
import getRoundService from '../../../services/rounds.get.service.js';

// Mock the service
vi.mock('../../../services/rounds.get.service.js', () => ({
  default: vi.fn(),
}));

const chance = new Chance();

describe('rounds.get.controller', () => {
  let req; let res; let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: {
        id: chance.guid(),
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
    expect(typeof getRoundController).toBe('function');
  });

  test('should accept req, res, next parameters', async () => {
    getRoundService.mockResolvedValue({});

    await getRoundController(req, res, next);
    expect(true).toBe(true); // Just checking it doesn't throw
  });

  test('should call service with roundId and userId', async () => {
    getRoundService.mockResolvedValue({});

    await getRoundController(req, res, next);

    expect(getRoundService).toHaveBeenCalledWith(req.params.id, req.user.userId);
  });

  test('should return result via res.json', async () => {
    const mockResult = {
      id: chance.guid(),
      name: chance.sentence({ words: 3 }),
      players: [],
    };
    getRoundService.mockResolvedValue(mockResult);

    await getRoundController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('should handle errors by calling next', async () => {
    const error = new Error(chance.sentence());
    getRoundService.mockRejectedValue(error);

    await getRoundController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
