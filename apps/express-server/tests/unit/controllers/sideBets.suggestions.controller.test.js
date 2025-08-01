import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { Chance } from 'chance';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/sideBets.suggestions.service.js', () => ({
  default: vi.fn(),
}));

describe('sideBets.suggestions.controller.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const sideBetsSuggestionsController = await import('../../../controllers/sideBets.suggestions.controller.js');
    expect(typeof sideBetsSuggestionsController.default).toBe('function');
  });

  test('should call service with roundId and userId from request', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const sideBetsSuggestionsController = (await import('../../../controllers/sideBets.suggestions.controller.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const mockResult = {
      roundId,
      suggestions: [],
    };

    sideBetsSuggestionsService.mockResolvedValueOnce(mockResult);

    const req = {
      params: { id: roundId },
      user: { userId },
    };
    const res = {
      json: vi.fn(),
    };
    const next = vi.fn();

    await sideBetsSuggestionsController(req, res, next);

    expect(sideBetsSuggestionsService).toHaveBeenCalledWith(roundId, userId);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error if service throws', async () => {
    const sideBetsSuggestionsService = (await import('../../../services/sideBets.suggestions.service.js')).default;
    const sideBetsSuggestionsController = (await import('../../../controllers/sideBets.suggestions.controller.js')).default;

    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const mockError = new Error('Service error');

    sideBetsSuggestionsService.mockRejectedValueOnce(mockError);

    const req = {
      params: { id: roundId },
      user: { userId },
    };
    const res = {
      json: vi.fn(),
    };
    const next = vi.fn();

    await sideBetsSuggestionsController(req, res, next);

    expect(sideBetsSuggestionsService).toHaveBeenCalledWith(roundId, userId);
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(mockError);
  });
});
