import {
  describe, test, expect, jest, beforeEach,
} from '@jest/globals';
import Chance from 'chance';

// ✅ Import the mock setup
import { mockPrisma } from '../setup.js';

// ✅ Import without mocking first to test the path
import registerController from '../../../controllers/auth.controller.js';

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
    jest.clearAllMocks();
    next = jest.fn();

    // ✅ Mock Prisma for controller tests - using Chance!
    mockPrisma.users.findUnique.mockResolvedValue(null); // No existing users
    mockPrisma.users.create.mockResolvedValue({
      id: chance.integer({ min: 1, max: 1000 }),
      email: chance.email(),
      username: chance.word(),
      password_hash: chance.hash(),
      created_at: new Date().toISOString(),
    });
  });

  test('should exist', () => {
    expect(true).toBe(true);
  });

  test('should export registerController function', () => {
    expect(typeof registerController).toBe('function');
  });

  test('should handle register request', async () => {
    const userData = createTestRegisterData();
    const mockId = chance.integer({ min: 1, max: 1000 });

    // Override the mock for this specific test
    mockPrisma.users.create.mockResolvedValue({
      id: mockId,
      email: userData.email,
      username: userData.username,
      password_hash: chance.hash(),
      created_at: new Date().toISOString(),
    });

    const req = {
      body: userData,
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await registerController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: mockId,
        email: userData.email,
        username: userData.username,
        created_at: expect.any(String),
      },
    });
  });
});
