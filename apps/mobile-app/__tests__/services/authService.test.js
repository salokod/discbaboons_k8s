/**
 * AuthService Tests
 */

import { login, handleNetworkError } from '../../src/services/authService';

// Mock the environment config
jest.mock('../../src/config/environment', () => ({
  API_BASE_URL: 'http://localhost:8080',
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('AuthService Functions', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 123,
          username: 'testuser',
          email: 'test@example.com',
          created_at: '2024-01-15T10:30:00.000Z',
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await login('testuser', 'password123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });

      expect(result).toEqual({
        user: mockResponse.user,
        tokens: mockResponse.tokens,
      });
    });

    it('should trim username before sending', async () => {
      const mockResponse = {
        success: true,
        user: { id: 123, username: 'testuser' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await login('  testuser  ', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            username: 'testuser', // Should be trimmed
            password: 'password123',
          }),
        }),
      );
    });

    it('should throw error for 401 unauthorized', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'UnauthorizedError',
          message: 'Invalid username or password',
        }),
      });

      await expect(login('wronguser', 'wrongpass'))
        .rejects
        .toThrow('Invalid username or password');
    });

    it('should throw error for 400 validation error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'ValidationError',
          message: 'Username is required',
        }),
      });

      await expect(login('', 'password'))
        .rejects
        .toThrow('Username is required');
    });

    it('should throw error for 500 server error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'InternalServerError',
          message: 'Database connection failed',
        }),
      });

      await expect(login('testuser', 'password'))
        .rejects
        .toThrow('Something went wrong. Please try again.');
    });

    it('should throw error for invalid response format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          // Missing required fields
          message: 'Login successful',
        }),
      });

      await expect(login('testuser', 'password'))
        .rejects
        .toThrow('Invalid response from server');
    });
  });

  describe('handleNetworkError', () => {
    it('should handle fetch network errors', () => {
      const error = new TypeError('fetch failed');
      const message = handleNetworkError(error);
      expect(message).toBe('Unable to connect. Please check your internet.');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      error.name = 'AbortError';
      const message = handleNetworkError(error);
      expect(message).toBe('Request timed out. Please try again.');
    });

    it('should return original error message for other errors', () => {
      const error = new Error('Custom error message');
      const message = handleNetworkError(error);
      expect(message).toBe('Custom error message');
    });

    it('should return default message for errors without message', () => {
      const error = new Error();
      const message = handleNetworkError(error);
      expect(message).toBe('Something went wrong. Please try again.');
    });
  });
});
