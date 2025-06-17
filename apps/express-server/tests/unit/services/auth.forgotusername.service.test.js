import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the email template service
vi.mock('../../../services/email/email.template.service.js', () => ({
  getTemplate: vi.fn().mockResolvedValue({
    subject: chance.sentence(),
    html: chance.paragraph(),
  }),
}));

// Mock the email service
vi.mock('../../../services/email/email.service.js', () => ({
  default: vi.fn().mockResolvedValue({
    success: true,
    message: 'Email sent successfully',
  }),
}));

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
    const mockUsername = chance.word();
    const mockSubject = chance.sentence();
    const mockHtml = chance.paragraph();

    // Mock database to return a user
    mockPrisma.users.findUnique.mockResolvedValue({
      id: chance.integer({ min: 1, max: 1000 }),
      username: mockUsername,
      email: validEmail,
    });

    // Import mocked modules to get their references
    const { getTemplate } = await import('../../../services/email/email.template.service.js');
    const emailService = await import('../../../services/email/email.service.js');

    // Set up template service mock
    vi.mocked(getTemplate).mockResolvedValue({
      subject: mockSubject,
      html: mockHtml,
    });

    const result = await forgotUsername(validEmail);

    // Verify template service was called correctly
    expect(getTemplate).toHaveBeenCalledWith('forgotusername', {
      username: mockUsername,
    });

    // Verify email service was called with template content
    expect(emailService.default).toHaveBeenCalledWith({
      to: validEmail,
      subject: mockSubject,
      html: mockHtml,
    });

    expect(result).toEqual({
      success: true,
      message: 'If an account associated with this email address exists, an email containing your username has been sent.',
    });
  });

  test('should not send email when user is not found', async () => {
    const validEmail = chance.email();

    // Mock database to return null (user not found)
    mockPrisma.users.findUnique.mockResolvedValue(null);

    // Import mocked modules to get their references
    const { getTemplate } = await import('../../../services/email/email.template.service.js');
    const emailService = await import('../../../services/email/email.service.js');

    const result = await forgotUsername(validEmail);

    // Verify template service was NOT called
    expect(getTemplate).not.toHaveBeenCalled();

    // Verify email service was NOT called
    expect(emailService.default).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: true,
      message: 'If an account associated with this email address exists, an email containing your username has been sent.',
    });
  });
});
