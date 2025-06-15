import {
  describe, test, expect, jest, beforeEach,
} from '@jest/globals';
import Chance from 'chance';

const chance = new Chance();

// Dynamic import
const { default: emailService } = await import('../../../services/email.service.js');

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
