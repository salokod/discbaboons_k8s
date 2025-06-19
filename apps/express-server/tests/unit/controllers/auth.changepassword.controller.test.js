import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import changePasswordController from '../../../controllers/auth.changepassword.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/auth.changepassword.service.js', () => ({
  default: vi.fn(),
}));

describe('AuthChangePasswordController', () => {
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(async () => {
    const service = await import('../../../services/auth.changepassword.service.js');
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
    expect(typeof changePasswordController).toBe('function');
  });

  test('should pass request body to service', async () => {
    const requestData = {
      resetCode: chance.string(),
      newPassword: chance.string(),
      username: chance.word(),
    };

    req.body = requestData;

    const mockResponse = {
      success: true,
      message: chance.sentence(),
    };

    mockService.mockResolvedValue(mockResponse);

    await changePasswordController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(requestData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  test('should call next with error when service throws', async () => {
    const mockError = new Error(chance.sentence());
    mockError.name = 'ValidationError';

    mockService.mockRejectedValue(mockError);

    await changePasswordController(req, res, next);

    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
