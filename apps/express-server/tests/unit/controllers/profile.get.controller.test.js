import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/profile.get.service.js', () => ({
  default: vi.fn(),
}));

// Dynamic import AFTER mocking
const { default: getProfileController } = await import('../../../controllers/profile.get.controller.js');

describe('ProfileGetController', () => {
  let mockService;
  let req;
  let res;

  beforeEach(async () => {
    const service = await import('../../../services/profile.get.service.js');
    mockService = service.default;

    req = {
      user: {}, // Will be populated by JWT middleware
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof getProfileController).toBe('function');
  });

  test('should return 401 when user is not authenticated', async () => {
    // No user in request (JWT middleware failed)
    req.user = undefined;

    await getProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not authenticated',
    });
    expect(mockService).not.toHaveBeenCalled();
  });

  test('should call service and return profile when user is authenticated', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const username = chance.word();
    const user = { userId, username };
    req.user = user;

    const mockServiceResponse = {
      success: true,
      profile: {
        id: chance.integer({ min: 1, max: 1000 }),
        user_id: userId,
        name: chance.name(),
        country: chance.country({ full: true }),
        city: chance.city(),
        bio: chance.sentence(),
      },
    };

    mockService.mockResolvedValue(mockServiceResponse);

    await getProfileController(req, res);

    expect(mockService).toHaveBeenCalledWith(user); // Changed: now passes full user object
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
  });

  test('should return 500 when service throws an error', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const username = chance.word();
    const user = { userId, username };
    req.user = user;

    // Mock service to throw an error
    mockService.mockRejectedValue(new Error('Database connection failed'));

    await getProfileController(req, res);

    expect(mockService).toHaveBeenCalledWith(user); // Changed: now passes full user object
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
    });
  });
});
