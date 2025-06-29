import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the service before importing the controller
const mockListBagsService = vi.fn();
vi.mock('../../../services/bags.list.service.js', () => ({
  default: mockListBagsService,
}));

describe('bagsListController', () => {
  let bagsListController;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import controller after mocking
    ({ default: bagsListController } = await import('../../../controllers/bags.list.controller.js'));
  });

  test('should export a function', () => {
    expect(typeof bagsListController).toBe('function');
  });

  test('should call listBagsService and return success response', async () => {
    const userId = chance.integer({ min: 1 });
    const mockBags = [
      { id: chance.guid(), name: chance.word(), disc_count: chance.integer({ min: 0, max: 10 }) },
    ];
    const mockResult = { bags: mockBags, total: 1 };

    mockListBagsService.mockResolvedValue(mockResult);

    const req = { user: { userId } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await bagsListController(req, res, next);

    expect(mockListBagsService).toHaveBeenCalledWith(userId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockResult,
    });
  });
});
