import {
  describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the MSAL and Graph dependencies
vi.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: vi.fn().mockImplementation(() => ({
    acquireTokenByClientCredential: vi.fn().mockResolvedValue({
      accessToken: chance.string({ length: 64 }),
    }),
  })),
}));

vi.mock('@microsoft/microsoft-graph-client', () => ({
  Client: {
    initWithMiddleware: vi.fn().mockReturnValue({
      api: vi.fn().mockReturnValue({
        post: vi.fn().mockResolvedValue({ success: chance.bool() }),
      }),
    }),
  },
}));

// Import the service after mocking
const { default: emailService } = await import('../../../services/email/email.service.js');

describe('EmailService', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should export sendEmail function', () => {
    expect(typeof emailService).toBe('function');
  });

  test('should throw error when emailData is missing', async () => {
    await expect(emailService()).rejects.toThrow('Email data is required');
  });

  test('should throw error when to field is missing', async () => {
    await expect(emailService({})).rejects.toThrow('To field is required');
  });

  test('should throw error when subject is missing', async () => {
    const emailData = { to: chance.email() };
    await expect(emailService(emailData)).rejects.toThrow('Subject field is required');
  });

  test('should throw error when html is missing', async () => {
    const emailData = {
      to: chance.email(),
      subject: chance.sentence(),
    };
    await expect(emailService(emailData)).rejects.toThrow('HTML content is required');
  });

  test('should return development mode message when Graph config is missing', async () => {
    // Clear all Graph environment variables
    delete process.env.GRAPH_TENANT_ID;
    delete process.env.GRAPH_CLIENT_ID;
    delete process.env.GRAPH_CLIENT_SECRET;
    delete process.env.GRAPH_USER_ID;

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

  test('should return success when Graph API is configured and mocked properly', async () => {
    // Set up complete environment with realistic looking fake values
    process.env.GRAPH_TENANT_ID = chance.guid();
    process.env.GRAPH_CLIENT_ID = chance.guid();
    process.env.GRAPH_CLIENT_SECRET = chance.string({ length: 32 });
    process.env.GRAPH_USER_ID = chance.email();

    const emailData = {
      to: chance.email(),
      subject: chance.sentence(),
      html: chance.paragraph(),
    };

    const result = await emailService(emailData);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Email sent successfully');
  });

  test('should validate GRAPH_TENANT_ID is required', async () => {
    process.env.GRAPH_CLIENT_ID = chance.guid();
    process.env.GRAPH_CLIENT_SECRET = chance.string({ length: 32 });
    process.env.GRAPH_USER_ID = chance.email();
    delete process.env.GRAPH_TENANT_ID;

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

  test('should validate GRAPH_CLIENT_ID is required', async () => {
    process.env.GRAPH_TENANT_ID = chance.guid();
    process.env.GRAPH_CLIENT_SECRET = chance.string({ length: 32 });
    process.env.GRAPH_USER_ID = chance.email();
    delete process.env.GRAPH_CLIENT_ID;

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

  test('should validate GRAPH_CLIENT_SECRET is required', async () => {
    process.env.GRAPH_TENANT_ID = chance.guid();
    process.env.GRAPH_CLIENT_ID = chance.guid();
    process.env.GRAPH_USER_ID = chance.email();
    delete process.env.GRAPH_CLIENT_SECRET;

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

  test('should validate GRAPH_USER_ID is required', async () => {
    process.env.GRAPH_TENANT_ID = chance.guid();
    process.env.GRAPH_CLIENT_ID = chance.guid();
    process.env.GRAPH_CLIENT_SECRET = chance.string({ length: 32 });
    delete process.env.GRAPH_USER_ID;

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
});
