import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import getParsController from '../../../controllers/rounds.getPars.controller.js';
import getParsService from '../../../services/rounds.getPars.service.js';

// Mock the service
vi.mock('../../../services/rounds.getPars.service.js', () => ({
  default: vi.fn(),
}));

const chance = new Chance();

describe('rounds.getPars.controller', () => {
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
    expect(typeof getParsController).toBe('function');
  });

  test('should accept req, res, next parameters', async () => {
    getParsService.mockResolvedValue({});

    await getParsController(req, res, next);

    expect(getParsService).toHaveBeenCalled();
  });

  test('should call service with roundId and userId', async () => {
    const mockPars = { 1: 3, 2: 4, 5: 5 };
    getParsService.mockResolvedValue(mockPars);

    await getParsController(req, res, next);

    expect(getParsService).toHaveBeenCalledWith(req.params.id, req.user.userId);
  });

  test('should return pars data as JSON response', async () => {
    const mockPars = { 1: 3, 2: 4, 5: 5 };
    getParsService.mockResolvedValue(mockPars);

    await getParsController(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockPars);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const error = new Error('Service error');
    getParsService.mockRejectedValue(error);

    await getParsController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
