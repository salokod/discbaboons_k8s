/**
 * Username Recovery Flow Integration Tests
 * Tests the complete forgot username user journey
 */

import { forgotUsername } from '../../src/services/authService';

// Mock fetch for integration tests
global.fetch = jest.fn();

describe('Username Recovery Flow Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch.mockReset();
    jest.clearAllMocks();
  });

  describe('Complete Username Recovery User Journey', () => {
    const testEmail = 'user@example.com';

    it('should complete full username recovery flow successfully', async () => {
      // Step 1: User requests username recovery
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'If an account associated with this email address exists, an email containing your username has been sent.',
        }),
      });

      const response = await forgotUsername(testEmail);
      expect(response.message).toBe('If an account associated with this email address exists, an email containing your username has been sent.');

      // Verify correct API endpoint is called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-username'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail }),
        }),
      );
    });

    it('should handle server validation errors for valid format but bad email', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'ValidationError',
          message: 'Invalid email format',
        }),
      });

      await expect(forgotUsername('valid@format.but-bad')).rejects.toThrow('Invalid email format');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-username'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'valid@format.but-bad' }),
        }),
      );
    });

    it('should handle rate limiting', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'TooManyRequests',
          message: 'Too many attempts. Please wait before trying again.',
        }),
      });

      await expect(forgotUsername(testEmail)).rejects.toThrow('Too many attempts. Please wait before trying again.');
    });

    it('should handle server errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'InternalServerError',
          message: 'Internal server error',
        }),
      });

      await expect(forgotUsername(testEmail)).rejects.toThrow('Something went wrong. Please try again.');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(forgotUsername(testEmail)).rejects.toThrow('Network request failed');
    });

    it('should validate email format client-side', async () => {
      await expect(forgotUsername('')).rejects.toThrow('Email is required');
      await expect(forgotUsername('   ')).rejects.toThrow('Email cannot be empty');
      await expect(forgotUsername('invalid')).rejects.toThrow('Invalid email format');
      await expect(forgotUsername(null)).rejects.toThrow('Email is required');
    });

    it('should trim email before sending request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'If an account associated with this email address exists, an email containing your username has been sent.',
        }),
      });

      await forgotUsername('  user@example.com  ');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-username'),
        expect.objectContaining({
          body: JSON.stringify({ email: 'user@example.com' }), // Should be trimmed
        }),
      );
    });

    it('should include timeout and abort signal in request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Username recovery email sent.',
        }),
      });

      await forgotUsername(testEmail);

      const fetchCall = fetch.mock.calls[0];
      const requestOptions = fetchCall[1];

      expect(requestOptions.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('API Contract Validation', () => {
    it('should send correct request structure to backend', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Success' }),
      });

      await forgotUsername('test@example.com');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-username'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
          }),
          signal: expect.any(AbortSignal),
        },
      );
    });

    it('should handle successful response correctly', async () => {
      const expectedResponse = {
        success: true,
        message: 'Success',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => expectedResponse,
      });

      const result = await forgotUsername('user@example.com');
      expect(result).toEqual(expectedResponse);
    });
  });
});
