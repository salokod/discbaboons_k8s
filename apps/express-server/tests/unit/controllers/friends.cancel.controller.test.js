import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the service
const mockCancelService = vi.fn();
vi.mock('../../../services/friends.cancel.service.js', () => ({
  default: mockCancelService,
}));

// Import after mocking
const { default: friendsCancelController } = await import('../../../controllers/friends.cancel.controller.js');

beforeEach(() => {
  mockCancelService.mockClear();
});

describe('friendsCancelController', () => {
  test('should be a function', () => {
    expect(typeof friendsCancelController).toBe('function');
  });

  test('should return 401 if user is not authenticated', async () => {
    const req = {
      user: undefined,
      params: { id: '123' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await friendsCancelController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not authenticated',
    });
    expect(mockCancelService).not.toHaveBeenCalled();
  });

  test('should return 401 if userId is missing', async () => {
    const req = {
      user: {},
      params: { id: '123' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await friendsCancelController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not authenticated',
    });
    expect(mockCancelService).not.toHaveBeenCalled();
  });

  test('should cancel friend request successfully', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestId = chance.integer({ min: 1, max: 1000 });

    const canceledRequest = {
      id: requestId,
      requester_id: userId,
      recipient_id: chance.integer({ min: 1, max: 1000 }),
      status: 'canceled',
      created_at: new Date().toISOString(),
    };

    mockCancelService.mockResolvedValue(canceledRequest);

    const req = {
      user: { userId },
      params: { id: requestId.toString() },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await friendsCancelController(req, res, next);

    expect(mockCancelService).toHaveBeenCalledWith(userId, requestId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      request: canceledRequest,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle invalid request ID parameter', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    const req = {
      user: { userId },
      params: { id: 'invalid-id' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await friendsCancelController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid request ID',
    });
    expect(mockCancelService).not.toHaveBeenCalled();
  });

  test('should call next with error for service failures', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const requestId = chance.integer({ min: 1, max: 1000 });

    const serviceError = new Error('Service error');
    mockCancelService.mockRejectedValue(serviceError);

    const req = {
      user: { userId },
      params: { id: requestId.toString() },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await friendsCancelController(req, res, next);

    expect(mockCancelService).toHaveBeenCalledWith(userId, requestId);
    expect(next).toHaveBeenCalledWith(serviceError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
