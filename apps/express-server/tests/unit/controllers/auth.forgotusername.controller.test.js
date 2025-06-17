import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Dynamic import
const { default: forgotUsernameController } = await import('../../../controllers/auth.forgotusername.controller.js');

describe('AuthForgotUsernameController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof forgotUsernameController).toBe('function');
  });

  test('should return 200 status for valid email', async () => {
    const req = {
      body: {
        email: chance.email(),
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await forgotUsernameController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'If an account associated with this email address exists, an email containing your username has been sent.',
    });
  });

  test('should call next for validation errors', async () => {
    const req = {
      body: {
        email: chance.word(), // Random word, not an email
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await forgotUsernameController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
