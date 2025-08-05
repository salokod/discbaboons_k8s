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

// Mock timers globally
global.setTimeout = jest.fn((fn, delay) => {
  const id = Math.random();
  // Simulate timeout behavior for testing
  if (delay === 30000) {
    setTimeout(() => fn(), 100); // Quick timeout for tests
  }
  return id;
});

global.clearTimeout = jest.fn();

describe('AuthService Functions', () => {
  beforeEach(() => {
    fetch.mockClear();
    global.setTimeout.mockClear();
    global.clearTimeout.mockClear();
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
        signal: expect.any(AbortSignal),
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

    it('should convert username to lowercase before sending', async () => {
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

      await login('TestUser', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            username: 'testuser', // Should be lowercased
            password: 'password123',
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should trim and lowercase username with mixed case and spaces', async () => {
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

      await login('  TestUser  ', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            username: 'testuser', // Should be trimmed and lowercased
            password: 'password123',
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should handle uppercase username', async () => {
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

      await login('TESTUSER', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            username: 'testuser', // Should be lowercased
            password: 'password123',
          }),
          signal: expect.any(AbortSignal),
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
          message: 'Account is locked',
        }),
      });

      await expect(login('testuser1234', 'password123'))
        .rejects
        .toThrow('Account is locked');
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

      await expect(login('testuser1234', 'password123'))
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

      await expect(login('testuser1234', 'password123'))
        .rejects
        .toThrow('Invalid response from server');
    });
  });

  describe('handleNetworkError', () => {
    it('should handle fetch network errors', () => {
      const error = new TypeError('fetch failed');
      const message = handleNetworkError(error);
      expect(message).toBe('Unable to connect to server. Please check your internet connection and try again.');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      error.name = 'AbortError';
      const message = handleNetworkError(error);
      expect(message).toBe('Request timed out after 30 seconds. Please check your connection and try again.');
    });

    it('should return original error message for other errors', () => {
      const error = new Error('Custom error message');
      const message = handleNetworkError(error);
      expect(message).toBe('Custom error message');
    });

    it('should return default message for errors without message', () => {
      const error = new Error();
      const message = handleNetworkError(error);
      expect(message).toBe('Something went wrong. Please try again later.');
    });
  });

  describe('request configuration', () => {
    it('should include AbortSignal in fetch requests', async () => {
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

      await login('testuser1234', 'password123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  describe('input validation', () => {
    it('should validate username requirements', async () => {
      // Test empty username
      await expect(login('', 'password123')).rejects.toThrow('Username is required');

      // Test whitespace-only username
      await expect(login('   ', 'password123')).rejects.toThrow('Username cannot be empty');

      // Test too short username
      await expect(login('abc', 'password123')).rejects.toThrow('Username must be at least 4 characters');

      // Test too long username
      await expect(login('a'.repeat(21), 'password123')).rejects.toThrow('Username must be no more than 20 characters');

      // Test invalid characters
      await expect(login('user@name', 'password123')).rejects.toThrow('Username can only contain letters and numbers');
      await expect(login('user name', 'password123')).rejects.toThrow('Username can only contain letters and numbers');
      await expect(login('user-name', 'password123')).rejects.toThrow('Username can only contain letters and numbers');
    });

    it('should validate password requirements', async () => {
      // Test empty password
      await expect(login('testuser', '')).rejects.toThrow('Password is required');

      // Test too short password
      await expect(login('testuser', 'short')).rejects.toThrow('Password must be at least 8 characters');

      // Test too long password
      await expect(login('testuser', 'a'.repeat(33))).rejects.toThrow('Password must be no more than 32 characters');
    });

    it('should accept valid username and password formats', async () => {
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

      // Valid alphanumeric username and password
      const result = await login('testuser', 'validPassword123');

      expect(result).toEqual({
        user: mockResponse.user,
        tokens: mockResponse.tokens,
      });
    });

    it('should handle non-string inputs gracefully', async () => {
      await expect(login(null, 'password123')).rejects.toThrow('Username is required');
      await expect(login(undefined, 'password123')).rejects.toThrow('Username is required');
      await expect(login(123, 'password123')).rejects.toThrow('Username is required');

      await expect(login('testuser', null)).rejects.toThrow('Password is required');
      await expect(login('testuser', undefined)).rejects.toThrow('Password is required');
      await expect(login('testuser', 123)).rejects.toThrow('Password is required');
    });
  });

  describe('enhanced error messages', () => {
    it('should handle network request failed error', () => {
      const error = new Error('Network request failed');
      const message = handleNetworkError(error);
      expect(message).toBe('Network error occurred. Please check your internet connection.');
    });
  });
});
