import {
  describe, test, expect, jest, beforeEach,
} from '@jest/globals';
import Chance from 'chance';

const chance = new Chance();

// Mock nodemailer before importing
const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn();

// Mock nodemailer with the correct structure
jest.mock('nodemailer', () => ({
  createTransport: mockCreateTransport,
}));

// Dynamic import after mocking
const { default: emailService } = await import('../../../services/email.service.js');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock email configuration for unit tests
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test@test.com';
    process.env.EMAIL_PASS = 'testpass';
    process.env.EMAIL_FROM = 'noreply@test.com';

    // Reset and setup mocks
    mockSendMail.mockClear();
    mockCreateTransport.mockClear();
    mockSendMail.mockResolvedValue({ messageId: 'test123' });
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  test('should export emailService function', () => {
    expect(typeof emailService).toBe('function');
  });

  test('should throw error when email data is missing', async () => {
    await expect(emailService()).rejects.toThrow('Email data is required');
  });

  test('should throw error when "to" field is missing', async () => {
    const emailData = {
      subject: chance.sentence(),
      html: chance.paragraph(),
    };

    await expect(emailService(emailData)).rejects.toThrow('To field is required');
  });

  test('should throw error when "subject" field is missing', async () => {
    const emailData = {
      to: chance.email(),
      html: chance.paragraph(),
    };

    await expect(emailService(emailData)).rejects.toThrow('Subject field is required');
  });

  test('should throw error when "html" field is missing', async () => {
    const emailData = {
      to: chance.email(),
      subject: chance.sentence(),
    };

    await expect(emailService(emailData)).rejects.toThrow('HTML content is required');
  });

  test('should return success when all fields are provided', async () => {
    const emailData = {
      to: chance.email(),
      subject: chance.sentence(),
      html: chance.paragraph(),
    };

    const result = await emailService(emailData);

    expect(result).toEqual({
      success: true,
      message: 'Email sent successfully',
    });
  });

  test('should return development mode message when email config is missing', async () => {
    // Clear email config
    delete process.env.EMAIL_HOST;

    const emailData = {
      to: chance.email(),
      subject: chance.sentence(),
      html: chance.paragraph(),
    };

    const result = await emailService(emailData);

    expect(result).toEqual({
      success: true,
      message: 'Email not sent - running in development mode without email configuration',
    });
  });

  test('should return development mode message when EMAIL_FROM is missing', async () => {
    // Clear EMAIL_FROM specifically
    delete process.env.EMAIL_FROM;

    const emailData = {
      to: chance.email(),
      subject: chance.sentence(),
      html: chance.paragraph(),
    };

    const result = await emailService(emailData);

    expect(result).toEqual({
      success: true,
      message: 'Email not sent - running in development mode without email configuration',
    });
  });

  test('should call nodemailer sendMail when sending email', async () => {
    const emailData = {
      to: chance.email(),
      subject: chance.sentence(),
      html: chance.paragraph(),
    };

    await emailService(emailData);

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      auth: {
        user: 'test@test.com',
        pass: 'testpass',
      },
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'noreply@test.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    });
  });
});
