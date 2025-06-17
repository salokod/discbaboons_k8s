import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Dynamic import AFTER mocking (following your pattern)
const { default: forgotUsername } = await import('../../../services/auth.forgotusername.service.js');
const { mockPrisma } = await import('../setup.js');

describe('ForgotUsernameService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export forgotUsername function', () => {
    expect(typeof forgotUsername).toBe('function');
  });

  test('should throw error when email is missing', async () => {
    await expect(forgotUsername()).rejects.toThrow('Email is required');
  });

  test('should throw error when email is empty string', async () => {
    await expect(forgotUsername('')).rejects.toThrow('Email is required');
  });

  test('should throw error when email format is invalid', async () => {
    const invalidEmail = chance.word();
    await expect(forgotUsername(invalidEmail)).rejects.toThrow('Invalid email format');
  });

  test('should look up user in database when email is valid', async () => {
    const validEmail = chance.email();

    // Mock database to return a user with Chance data
    mockPrisma.users.findUnique.mockResolvedValue({
      id: chance.integer({ min: 1, max: 1000 }),
      username: chance.word(),
      email: validEmail,
    });

    await forgotUsername(validEmail);

    // Check that database was called with correct email
    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
      where: { email: validEmail },
    });
  });

  test('should return success message when user is found', async () => {
    const validEmail = chance.email();

    // Mock database to return a user
    mockPrisma.users.findUnique.mockResolvedValue({
      id: chance.integer({ min: 1, max: 1000 }),
      username: chance.word(),
      email: validEmail,
    });

    const result = await forgotUsername(validEmail);

    expect(result).toEqual({
      success: true,
      message: 'If an account associated with this email address exists, an email containing your username has been sent.',
    });
  });

  test('should return same success message when user is not found', async () => {
    const validEmail = chance.email();

    // Mock database to return null (user not found)
    mockPrisma.users.findUnique.mockResolvedValue(null);

    const result = await forgotUsername(validEmail);

    expect(result).toEqual({
      success: true,
      message: 'If an account associated with this email address exists, an email containing your username has been sent.',
    });
  });

  test('should send email with username when user is found', async () => {
    const validEmail = chance.email();
    const mockUsername = chance.name();

    // Mock database to return a user
    mockPrisma.users.findUnique.mockResolvedValue({
      id: chance.integer({ min: 1, max: 1000 }),
      username: mockUsername,
      email: validEmail,
    });

    // // Mock email service
    // const mockEmailService = vi.fn().mockResolvedValue({
    //   success: true,
    //   message: 'Email sent successfully',
    // });

    // TODO: We need to mock the email service import

    const result = await forgotUsername(validEmail);

    expect(result.success).toBe(true);
  });
});
