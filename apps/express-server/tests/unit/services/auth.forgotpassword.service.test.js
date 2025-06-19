import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock Redis using the same pattern as other tests
vi.mock('../../../lib/redis.js', () => ({
  default: {
    setEx: vi.fn().mockResolvedValue('OK'),
  },
}));

// Mock email service
vi.mock('../../../services/email/email.service.js', () => ({
  default: vi.fn().mockResolvedValue({
    success: true,
    message: 'Email sent successfully',
  }),
}));

// Mock email template service
vi.mock('../../../services/email/email.template.service.js', () => ({
  getTemplate: vi.fn().mockResolvedValue({
    subject: 'Password Reset Request - Don\'t be a baboon!',
    html: '<p>Your password reset code is: <strong>ABC123</strong></p>',
  }),
}));

// Dynamic import AFTER mocking (following your pattern)
const { default: forgotPasswordService } = await import('../../../services/auth.forgotpassword.service.js');
const { mockPrisma } = await import('../setup.js');

describe('ForgotPasswordService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  test('should throw ValidationError when no identifier provided', async () => {
    await expect(forgotPasswordService({})).rejects.toThrow('Username or email is required');
  });

  test('should throw ValidationError for invalid email format', async () => {
    const invalidEmail = chance.word(); // Not a valid email format
    await expect(forgotPasswordService({ email: invalidEmail })).rejects.toThrow('Invalid email format');
  });

  test('should lookup user by username when username provided', async () => {
    const username = chance.word();
    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username,
      email: chance.email(),
    };

    mockPrisma.users.findUnique.mockResolvedValue(mockUser);

    await forgotPasswordService({ username });

    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
      where: { username },
    });
  });

  test('should lookup user by email when email provided', async () => {
    const email = chance.email();
    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: chance.word(),
      email,
    };

    mockPrisma.users.findUnique.mockResolvedValue(mockUser);

    await forgotPasswordService({ email });

    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
      where: { email },
    });
  });

  test('should generate and store reset token when user found', async () => {
    const email = chance.email();
    const userId = chance.integer({ min: 1, max: 1000 });
    const mockUser = {
      id: userId,
      username: chance.word(),
      email,
    };

    const { default: redis } = await import('../../../lib/redis.js');
    mockPrisma.users.findUnique.mockResolvedValue(mockUser);

    await forgotPasswordService({ email });

    // Should store token in Redis with 30-minute expiration (1800 seconds)
    expect(redis.setEx).toHaveBeenCalledWith(
      `password_reset:${userId}`,
      1800, // 30 minutes in seconds
      expect.any(String), // The generated token
    );
  });

  test('should send email with reset code when user found', async () => {
    const email = chance.email();
    const mockUser = {
      id: chance.integer({ min: 1, max: 1000 }),
      username: chance.word(),
      email,
    };

    const emailService = await import('../../../services/email/email.service.js');
    const { getTemplate } = await import('../../../services/email/email.template.service.js');

    mockPrisma.users.findUnique.mockResolvedValue(mockUser);

    await forgotPasswordService({ email });

    // Should get email template with reset code
    expect(getTemplate).toHaveBeenCalledWith('forgotpassword', {
      resetCode: expect.any(String),
    });

    // Should send email using template
    expect(emailService.default).toHaveBeenCalledWith({
      to: email,
      subject: 'Password Reset Request - Don\'t be a baboon!',
      html: '<p>Your password reset code is: <strong>ABC123</strong></p>',
    });
  });

  test('should return generic success message regardless of user existence', async () => {
    const email = chance.email();

    // Test when user exists
    mockPrisma.users.findUnique.mockResolvedValue({
      id: chance.integer({ min: 1, max: 1000 }),
      username: chance.word(),
      email,
    });

    const result1 = await forgotPasswordService({ email });

    // Test when user doesn't exist
    mockPrisma.users.findUnique.mockResolvedValue(null);

    const result2 = await forgotPasswordService({ email: chance.email() });

    // Both should return the same generic message for security
    expect(result1).toEqual({
      success: true,
      message: 'If an account with that information exists, a password reset code has been sent to the associated email address.',
    });

    expect(result2).toEqual({
      success: true,
      message: 'If an account with that information exists, a password reset code has been sent to the associated email address.',
    });
  });
});
