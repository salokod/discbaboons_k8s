import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import refreshController from '../../../controllers/auth.refresh.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/auth.refresh.service.js', () => ({
  default: vi.fn(),
}));

describe('AuthRefreshController', () => {
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(async () => {
    const service = await import('../../../services/auth.refresh.service.js');
    mockService = service.default;

    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof refreshController).toBe('function');
  });

  test('should pass request body to service and return tokens', async () => {
    const requestData = {
      refreshToken: chance.string(),
    };

    req.body = requestData;

    const mockResponse = {
      success: true,
      accessToken: chance.string(),
      refreshToken: chance.string(),
      expiresIn: 900,
    };

    mockService.mockResolvedValue(mockResponse);

    await refreshController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(requestData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  test('should call next with error when service throws', async () => {
    const mockError = new Error(chance.sentence());
    mockError.name = 'ValidationError';

    mockService.mockRejectedValue(mockError);

    await refreshController(req, res, next);

    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
