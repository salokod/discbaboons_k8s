import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

const mockUpdateProfileService = vi.fn();
vi.mock('../../../services/profile.update.service.js', () => ({
  default: mockUpdateProfileService,
}));

const { default: updateProfileController } = await import('../../../controllers/profile.update.controller.js');

describe('updateProfileController', () => {
  test('should be a function', () => {
    expect(typeof updateProfileController).toBe('function');
  });

  test('should return 200 and updated profile on success', async () => {
    const userId = chance.integer({ min: 1 });
    const name = chance.name();
    const req = {
      user: { userId },
      body: { name },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const updatedProfile = { success: true, profile: { user_id: userId, name } };
    mockUpdateProfileService.mockResolvedValueOnce(updatedProfile);

    await updateProfileController(req, res);

    expect(mockUpdateProfileService).toHaveBeenCalledWith(userId, { name });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedProfile);
  });

  test('should return 401 if user is not authenticated', async () => {
    const name = chance.name();
    const req = {
      user: null,
      body: { name },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not authenticated',
    });
  });

  test('should return 400 if service throws ValidationError', async () => {
    const userId = chance.integer({ min: 1 });
    const req = {
      user: { userId },
      body: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();
    const error = new Error('No valid fields to update');
    error.name = 'ValidationError';
    mockUpdateProfileService.mockRejectedValueOnce(error);

    await updateProfileController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test('should call next with error if service throws unexpected error', async () => {
    const userId = chance.integer({ min: 1 });
    const name = chance.name();
    const req = {
      user: { userId },
      body: { name },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();
    const error = new Error('Database connection failed');
    mockUpdateProfileService.mockRejectedValueOnce(error);

    await updateProfileController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
