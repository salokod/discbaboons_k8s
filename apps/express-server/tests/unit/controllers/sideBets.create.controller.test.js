import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import sideBetsCreateController from '../../../controllers/sideBets.create.controller.js';
import sideBetsCreateService from '../../../services/sideBets.create.service.js';

const chance = new Chance();

vi.mock('../../../services/sideBets.create.service.js');

describe('sideBetsCreateController', () => {
  let req; let res; let
    next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: {},
      body: {},
      user: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  it('should export a function', () => {
    expect(typeof sideBetsCreateController).toBe('function');
  });

  it('should call service with correct parameters', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betType = chance.pickone(['hole', 'round']);
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType,
      ...(betType === 'hole' && { holeNumber: chance.integer({ min: 1, max: 18 }) }),
    };

    req.params.id = roundId;
    req.body = betData;
    req.user.userId = userId;

    const mockResult = { id: chance.guid() };
    sideBetsCreateService.mockResolvedValue(mockResult);

    await sideBetsCreateController(req, res, next);

    expect(sideBetsCreateService).toHaveBeenCalledWith(betData, roundId, userId);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should handle service errors', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const betData = {
      name: chance.word(),
      amount: chance.floating({ min: 0.01, max: 100, fixed: 2 }),
      betType: 'hole',
      holeNumber: chance.integer({ min: 1, max: 18 }),
    };

    req.params.id = roundId;
    req.body = betData;
    req.user.userId = userId;

    const mockError = new Error('Service error');
    sideBetsCreateService.mockRejectedValue(mockError);

    await sideBetsCreateController(req, res, next);

    expect(next).toHaveBeenCalledWith(mockError);
  });
});
