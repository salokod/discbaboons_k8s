import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the service before importing the controller
const mockGetBagService = vi.fn();
vi.mock('../../../services/bags.get.service.js', () => ({
  default: mockGetBagService,
}));

describe('getBagController', () => {
  let getBagController;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import controller after mocking
    ({ default: getBagController } = await import('../../../controllers/bags.get.controller.js'));
  });

  test('should export a function', () => {
    expect(typeof getBagController).toBe('function');
  });

  test('should return bag with 200 status when bag is found', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      description: chance.sentence(),
    };

    mockGetBagService.mockResolvedValue(mockBag);

    const req = {
      user: { userId },
      params: { id: bagId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await getBagController(req, res, next);

    expect(mockGetBagService).toHaveBeenCalledWith(userId, bagId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      bag: mockBag,
    });
  });

  test('should return 404 when bag is not found or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    mockGetBagService.mockResolvedValue(null); // Service returns null

    const req = {
      user: { userId },
      params: { id: bagId },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await getBagController(req, res, next);

    expect(mockGetBagService).toHaveBeenCalledWith(userId, bagId);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bag not found',
    });
  });
});
