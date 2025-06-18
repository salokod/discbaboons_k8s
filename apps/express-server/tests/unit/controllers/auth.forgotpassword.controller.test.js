import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import forgotPasswordController from '../../../controllers/auth.forgotpassword.controller.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/auth.forgotpassword.service.js', () => ({
  default: vi.fn(),
}));

describe('AuthForgotPasswordController', () => {
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(async () => {
    const service = await import('../../../services/auth.forgotpassword.service.js');
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
    expect(typeof forgotPasswordController).toBe('function');
  });

  test('should return 200 status for valid request', async () => {
    const mockResponse = {
      success: chance.bool(),
      message: chance.sentence(),
    };

    mockService.mockResolvedValue(mockResponse);

    await forgotPasswordController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });
});
