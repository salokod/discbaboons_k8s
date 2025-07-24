import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import setParController from '../../../controllers/rounds.setPar.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.setPar.service.js', () => ({
  default: vi.fn(),
}));

// Mock the error handler middleware
vi.mock('../../../middleware/errorHandler.js', () => ({
  default: vi.fn(),
}));

describe('rounds.setPar.controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof setParController).toBe('function');
  });

  test('should call setPar service and return success response', async () => {
    const setParService = (await import('../../../services/rounds.setPar.service.js')).default;

    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const userId = chance.integer({ min: 1, max: 1000 });

    const req = {
      params: { id: roundId, holeNumber: holeNumber.toString() },
      body: { par },
      user: { userId },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    setParService.mockResolvedValue({ success: true });

    await setParController(req, res);

    expect(setParService).toHaveBeenCalledWith(roundId, holeNumber, par, userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
