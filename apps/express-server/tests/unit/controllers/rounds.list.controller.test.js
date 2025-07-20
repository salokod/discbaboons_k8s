import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';
import roundsListController from '../../../controllers/rounds.list.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/rounds.list.service.js', () => ({
  default: vi.fn(),
}));

describe('roundsListController', () => {
  let mockRoundsListService;

  beforeEach(async () => {
    const roundsListServiceModule = await import('../../../services/rounds.list.service.js');
    mockRoundsListService = roundsListServiceModule.default;
    mockRoundsListService.mockClear();
  });

  test('should export a function', () => {
    expect(typeof roundsListController).toBe('function');
  });

  test('should accept req, res, and next parameters', async () => {
    const req = { user: { userId: 1 }, query: {} };
    const res = { json: vi.fn() };
    const next = vi.fn();

    const mockResult = {
      rounds: [],
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    mockRoundsListService.mockResolvedValueOnce(mockResult);

    await expect(roundsListController(req, res, next)).resolves.toBeUndefined();
  });

  test('should call rounds.list.service with userId and return JSON response', async () => {
    const userId = chance.integer({ min: 1 });
    const req = { user: { userId }, query: {} };
    const res = { json: vi.fn() };
    const next = vi.fn();

    const mockResult = {
      rounds: [
        {
          id: chance.guid({ version: 4 }),
          name: chance.sentence({ words: 3 }),
          status: 'in_progress',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    mockRoundsListService.mockResolvedValueOnce(mockResult);

    await roundsListController(req, res, next);

    expect(mockRoundsListService).toHaveBeenCalledWith(userId, {});
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('should pass query parameters as filters to service', async () => {
    const userId = chance.integer({ min: 1 });
    const queryFilters = {
      status: chance.pickone(['in_progress', 'completed', 'cancelled']),
      is_private: chance.bool().toString(),
      limit: chance.integer({ min: 1, max: 100 }).toString(),
      offset: chance.integer({ min: 0, max: 50 }).toString(),
    };
    const req = { user: { userId }, query: queryFilters };
    const res = { json: vi.fn() };
    const next = vi.fn();

    const mockResult = {
      rounds: [],
      total: 0,
      limit: parseInt(queryFilters.limit, 10),
      offset: parseInt(queryFilters.offset, 10),
      hasMore: false,
    };

    mockRoundsListService.mockResolvedValueOnce(mockResult);

    await roundsListController(req, res, next);

    expect(mockRoundsListService).toHaveBeenCalledWith(userId, queryFilters);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  test('should handle service errors using next middleware', async () => {
    const userId = chance.integer({ min: 1 });
    const req = { user: { userId }, query: {} };
    const res = { json: vi.fn() };
    const next = vi.fn();

    const serviceError = new Error('Database connection failed');
    mockRoundsListService.mockRejectedValueOnce(serviceError);

    await roundsListController(req, res, next);

    expect(mockRoundsListService).toHaveBeenCalledWith(userId, {});
    expect(next).toHaveBeenCalledWith(serviceError);
    expect(res.json).not.toHaveBeenCalled();
  });
});
