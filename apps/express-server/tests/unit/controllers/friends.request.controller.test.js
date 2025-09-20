import friendsRequestController from '../../../controllers/friends.request.controller.js';
import * as serviceModule from '../../../services/friends.request.service.js';

describe('friendsRequestController', () => {
  test('should export a function', () => {
    expect(typeof friendsRequestController).toBe('function');
  });

  test('should call the service with correct arguments and return wrapped result', async () => {
    const mockServiceResult = {
      id: 1, requester_id: 42, recipient_id: 99, status: 'pending',
    };
    const mockService = vi.spyOn(serviceModule, 'default').mockResolvedValue(mockServiceResult);
    const req = {
      user: { userId: 42 },
      body: { recipientId: 99 },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsRequestController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(42, 99);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      request: mockServiceResult,
    });
    expect(next).not.toHaveBeenCalled();

    mockService.mockRestore();
  });

  test('should call next with error if service throws', async () => {
    const error = new Error('Service failed');
    const mockService = vi.spyOn(serviceModule, 'default').mockRejectedValue(error);
    const req = {
      user: { userId: 42 },
      body: { recipientId: 99 },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsRequestController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(42, 99);
    expect(next).toHaveBeenCalledWith(error);

    mockService.mockRestore();
  });
});
