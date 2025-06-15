import {
  describe, test, expect, jest, beforeEach,
} from '@jest/globals';
import Chance from 'chance';

const chance = new Chance();

// Dynamic import
const { default: forgotUsernameController } = await import('../../../controllers/auth.forgotusername.controller.js');

describe('AuthForgotUsernameController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

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
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await forgotUsernameController(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
