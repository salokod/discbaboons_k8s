import {
  describe, test, expect, vi,
} from 'vitest';

const mockSearchProfilesService = vi.fn();
vi.mock('../../../services/profile.search.service.js', () => ({
  default: mockSearchProfilesService,
}));

const { default: searchProfilesController } = await import('../../../controllers/profile.search.controller.js');

describe('searchProfilesController', () => {
  test('should be a function', () => {
    expect(typeof searchProfilesController).toBe('function');
  });

  test('should return 200 and search results on success', async () => {
    const req = { query: { username: 'alice' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const serviceResult = {
      profiles: [{ user_id: 1, name: 'Alice' }],
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    };
    mockSearchProfilesService.mockResolvedValueOnce(serviceResult);

    await searchProfilesController(req, res);

    expect(mockSearchProfilesService).toHaveBeenCalledWith({ username: 'alice' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      profiles: [{ user_id: 1, name: 'Alice' }],
      total: 1,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });

  test('should call next with error if service throws ValidationError', async () => {
    const req = { query: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();
    const error = new Error('Search query is required');
    error.name = 'ValidationError';
    mockSearchProfilesService.mockRejectedValueOnce(error);

    await searchProfilesController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
