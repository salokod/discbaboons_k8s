import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

// Import the mock setup
import mockDatabase from '../setup.js';

// Import without mocking first to test the path
import registerController from '../../../controllers/auth.register.controller.js';

const chance = new Chance();

describe('AuthController', () => {
  let next;

  const createTestRegisterData = (overrides = {}) => ({
    email: chance.email(),
    username: chance.string({ length: chance.integer({ min: 4, max: 20 }), alpha: true }),
    password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}!`,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();

    // Mock database for controller tests
    mockDatabase.queryOne.mockClear();
  });

  test('should call next with error when service throws', async () => {
    const userData = createTestRegisterData();
    const mockError = new Error('Database error');

    // Mock database to throw error
    mockDatabase.queryOne.mockRejectedValue(mockError);

    const req = {
      body: userData,
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await registerController(req, res, next);

    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should export registerController function', () => {
    expect(typeof registerController).toBe('function');
  });

  test('should handle register request', async () => {
    const userData = createTestRegisterData();
    const mockId = chance.integer({ min: 1, max: 1000 });
    const mockCreatedAt = new Date().toISOString();

    const mockCreatedUser = {
      id: mockId,
      email: userData.email,
      username: userData.username,
      created_at: mockCreatedAt,
      updated_at: mockCreatedAt,
    };

    // Mock database calls - first two check for existing, third creates user
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No existing email
      .mockResolvedValueOnce(null) // No existing username
      .mockResolvedValueOnce(mockCreatedUser); // Return created user

    const req = {
      body: userData,
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await registerController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: mockCreatedUser,
    });
  });
});
