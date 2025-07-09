import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the service
const mockListLostDiscsService = vi.fn();
vi.mock('../../../services/bag-contents.list-lost.service.js', () => ({
  default: mockListLostDiscsService,
}));

// Import controller after mocking
const { default: listLostDiscsController } = await import('../../../controllers/bag-contents.list-lost.controller.js');

describe('listLostDiscsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof listLostDiscsController).toBe('function');
  });

  test('should call service with userId and return success response', async () => {
    const userId = chance.integer({ min: 1 });
    const mockServiceResult = {
      lost_discs: [
        {
          id: chance.guid(),
          user_id: userId,
          disc_id: chance.guid(),
          is_lost: true,
          lost_notes: chance.sentence(),
          lost_at: new Date(),
          speed: chance.integer({ min: 1, max: 15 }),
          glide: chance.integer({ min: 1, max: 7 }),
          turn: chance.integer({ min: -5, max: 2 }),
          fade: chance.integer({ min: 0, max: 5 }),
          brand: chance.company(),
          model: chance.word(),
          disc_master: {
            brand: chance.company(),
            model: chance.word(),
            speed: chance.integer({ min: 1, max: 15 }),
            glide: chance.integer({ min: 1, max: 7 }),
            turn: chance.integer({ min: -5, max: 2 }),
            fade: chance.integer({ min: 0, max: 5 }),
          },
        },
      ],
      pagination: {
        total: 1,
        limit: 20,
        offset: 0,
        has_more: false,
      },
    };

    mockListLostDiscsService.mockResolvedValue(mockServiceResult);
    const mockReq = {
      user: { userId },
      query: {},
    };
    const mockRes = {
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await listLostDiscsController(mockReq, mockRes, mockNext);

    expect(mockListLostDiscsService).toHaveBeenCalledWith(userId, {});
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      ...mockServiceResult,
    });
  });

  test('should parse query parameters correctly', async () => {
    const userId = chance.integer({ min: 1 });
    const limit = chance.integer({ min: 1, max: 100 });
    const offset = chance.integer({ min: 0, max: 1000 });
    const sort = 'lost_at';
    const order = 'asc';

    mockListLostDiscsService.mockResolvedValue({
      lost_discs: [],
      pagination: {
        total: 0, limit, offset, has_more: false,
      },
    });

    const mockReq = {
      user: { userId },
      query: {
        limit: limit.toString(),
        offset: offset.toString(),
        sort,
        order,
      },
    };
    const mockRes = {
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await listLostDiscsController(mockReq, mockRes, mockNext);

    expect(mockListLostDiscsService).toHaveBeenCalledWith(userId, {
      limit,
      offset,
      sort,
      order,
    });
  });

  test('should extract userId from req.user', async () => {
    const userId = chance.integer({ min: 1 });
    mockListLostDiscsService.mockResolvedValue({
      lost_discs: [],
      pagination: {
        total: 0, limit: 30, offset: 0, has_more: false,
      },
    });

    const mockReq = {
      user: { userId },
      query: {},
    };
    const mockRes = {
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await listLostDiscsController(mockReq, mockRes, mockNext);

    expect(mockListLostDiscsService).toHaveBeenCalledWith(userId, {});
  });

  test('should handle errors by calling next', async () => {
    const userId = chance.integer({ min: 1 });
    const error = new Error(chance.sentence());
    mockListLostDiscsService.mockRejectedValue(error);

    const mockReq = {
      user: { userId },
      query: {},
    };
    const mockRes = {
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await listLostDiscsController(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});
