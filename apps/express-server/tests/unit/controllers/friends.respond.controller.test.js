import friendsRespondController from '../../../controllers/friends.respond.controller.js';
import * as serviceModule from '../../../services/friends.respond.service.js';

describe('friendsRespondController', () => {
  test('should export a function', () => {
    expect(typeof friendsRespondController).toBe('function');
  });

  test('should call the service with correct arguments and return result', async () => {
    const mockService = vi.spyOn(serviceModule, 'default').mockResolvedValue({ id: 1, status: 'accepted' });
    const req = {
      user: { userId: 42 },
      body: { requestId: 1, action: 'accept' },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsRespondController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(1, 42, 'accept');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      request: { id: 1, status: 'accepted' },
    });
    expect(next).not.toHaveBeenCalled();

    mockService.mockRestore();
  });

  test('should call next with error if service throws', async () => {
    const error = new Error('Service failed');
    const mockService = vi.spyOn(serviceModule, 'default').mockRejectedValue(error);
    const req = {
      user: { userId: 42 },
      body: { requestId: 1, action: 'accept' },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsRespondController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(1, 42, 'accept');
    expect(next).toHaveBeenCalledWith(error);

    mockService.mockRestore();
  });
});
