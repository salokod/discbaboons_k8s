import {
  describe, test, expect,
} from '@jest/globals';
import Chance from 'chance';

const chance = new Chance();

// Import our email service
const { default: emailService } = await import('../../services/email.service.js');

describe('Email Integration', () => {
  test('should handle missing email configuration gracefully', async () => {
    // Temporarily clear email env vars
    const originalHost = process.env.EMAIL_HOST;
    delete process.env.EMAIL_HOST;

    const emailData = {
      to: chance.email(),
      subject: 'Test Subject',
      html: '<p>Test message</p>',
    };

    const result = await emailService(emailData);

    expect(result.success).toBe(true);
    expect(result.message).toContain('development mode');

    // Restore env var
    if (originalHost) {
      process.env.EMAIL_HOST = originalHost;
    }
  });
});
