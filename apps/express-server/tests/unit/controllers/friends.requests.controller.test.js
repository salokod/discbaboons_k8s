import Chance from 'chance';
import friendsRequestsController from '../../../controllers/friends.requests.controller.js';
import * as serviceModule from '../../../services/friends.requests.service.js';

const chance = new Chance();

describe('friendsRequestsController', () => {
  test('should export a function', () => {
    expect(typeof friendsRequestsController).toBe('function');
  });

  test('should call the service with correct arguments and return result', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const type = chance.pickone(['incoming', 'outgoing', 'all']);
    const fakeRequests = [{ id: chance.integer({ min: 1, max: 1000 }) }];
    const mockService = vi.spyOn(serviceModule, 'default').mockResolvedValue(fakeRequests);
    const req = {
      user: { userId },
      query: { type },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsRequestsController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(userId, type);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      requests: fakeRequests,
    });
    expect(next).not.toHaveBeenCalled();

    mockService.mockRestore();
  });

  test('should call next with error if service throws', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const type = chance.pickone(['incoming', 'outgoing', 'all']);
    const error = new Error('Service failed');
    const mockService = vi.spyOn(serviceModule, 'default').mockRejectedValue(error);
    const req = {
      user: { userId },
      query: { type },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    await friendsRequestsController(req, res, next);

    expect(mockService).toHaveBeenCalledWith(userId, type);
    expect(next).toHaveBeenCalledWith(error);

    mockService.mockRestore();
  });
});
