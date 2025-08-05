/**
 * Token Refresh Service Tests
 */

import {
  refreshAccessToken,
  isTokenExpired,
  setupTokenRefreshTimer,
  clearTokenRefreshTimer,
} from '../../src/services/tokenRefresh';

// Mock environment config
jest.mock('../../src/config/environment', () => ({
  API_BASE_URL: 'http://localhost:8080',
}));

// Mock token storage
jest.mock('../../src/services/tokenStorage', () => ({
  storeTokens: jest.fn(),
  getTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('TokenRefresh Service', () => {
  let mockTokenStorage;

  beforeEach(() => {
    mockTokenStorage = require('../../src/services/tokenStorage');

    // Clear all mocks
    fetch.mockClear();
    mockTokenStorage.storeTokens.mockClear();
    mockTokenStorage.getTokens.mockClear();
    mockTokenStorage.clearTokens.mockClear();

    // Clear any existing timers
    jest.clearAllTimers();
  });

  describe('refreshAccessToken', () => {
    it('should export a refreshAccessToken function', () => {
      expect(typeof refreshAccessToken).toBe('function');
    });

    it('should refresh access token with valid refresh token', async () => {
      const mockRefreshResponse = {
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRefreshResponse,
      });

      mockTokenStorage.storeTokens.mockResolvedValueOnce(true);

      const refreshToken = 'valid-refresh-token';
      const result = await refreshAccessToken(refreshToken);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        signal: expect.any(AbortSignal),
      });

      const expectedTokens = {
        accessToken: mockRefreshResponse.accessToken,
        refreshToken: mockRefreshResponse.refreshToken,
      };
      expect(mockTokenStorage.storeTokens).toHaveBeenCalledWith(expectedTokens);
      expect(result).toEqual(expectedTokens);
    });

    it('should throw error for invalid refresh token', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'ValidationError',
          message: 'Invalid or expired refresh token',
        }),
      });

      mockTokenStorage.clearTokens.mockResolvedValueOnce(true);

      const refreshToken = 'invalid-refresh-token';

      await expect(refreshAccessToken(refreshToken))
        .rejects
        .toThrow('Invalid or expired refresh token');

      expect(mockTokenStorage.clearTokens).toHaveBeenCalled();
    });

    it('should handle network errors during refresh', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const refreshToken = 'valid-refresh-token';

      await expect(refreshAccessToken(refreshToken))
        .rejects
        .toThrow('Failed to refresh token: Network error');
    });

    it('should validate refresh token parameter', async () => {
      await expect(refreshAccessToken()).rejects.toThrow('Refresh token is required');
      await expect(refreshAccessToken('')).rejects.toThrow('Refresh token is required');
      await expect(refreshAccessToken(null)).rejects.toThrow('Refresh token is required');
    });
  });

  describe('isTokenExpired', () => {
    it('should export an isTokenExpired function', () => {
      expect(typeof isTokenExpired).toBe('function');
    });

    it('should return true for expired token', () => {
      // Create an expired token (expired 1 hour ago)
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = `header.${btoa(JSON.stringify({ exp: expiredTime }))}.signature`;

      const result = isTokenExpired(expiredToken);

      expect(result).toBe(true);
    });

    it('should return false for valid token', () => {
      // Create a valid token (expires in 1 hour)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      const result = isTokenExpired(validToken);

      expect(result).toBe(false);
    });

    it('should return true for token expiring within buffer time', () => {
      // Create a token expiring in 30 seconds (within 2-minute buffer)
      const soonExpireTime = Math.floor(Date.now() / 1000) + 30;
      const soonExpiredToken = `header.${btoa(JSON.stringify({ exp: soonExpireTime }))}.signature`;

      const result = isTokenExpired(soonExpiredToken, 120); // 2 minute buffer

      expect(result).toBe(true);
    });

    it('should handle invalid token formats gracefully', () => {
      expect(isTokenExpired('')).toBe(true);
      expect(isTokenExpired(null)).toBe(true);
      expect(isTokenExpired('invalid-token')).toBe(true);
      expect(isTokenExpired('header.invalid-payload.signature')).toBe(true);
    });
  });

  describe('setupTokenRefreshTimer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');
      jest.spyOn(global, 'clearTimeout');
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should export a setupTokenRefreshTimer function', () => {
      expect(typeof setupTokenRefreshTimer).toBe('function');
    });

    it('should set up timer to refresh token before expiration', () => {
      const mockRefreshCallback = jest.fn();

      // Token expires in 15 minutes (900 seconds)
      const futureTime = Math.floor(Date.now() / 1000) + 900;
      const accessToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      setupTokenRefreshTimer(accessToken, mockRefreshCallback);

      // Should schedule refresh 2 minutes (120 seconds) before expiration
      // So timer should be set for 780 seconds (900 - 120)
      expect(setTimeout).toHaveBeenCalledWith(mockRefreshCallback, 780000);
    });

    it('should handle tokens that are already close to expiration', () => {
      const mockRefreshCallback = jest.fn();

      // Token expires in 1 minute (60 seconds)
      const soonExpireTime = Math.floor(Date.now() / 1000) + 60;
      const accessToken = `header.${btoa(JSON.stringify({ exp: soonExpireTime }))}.signature`;

      setupTokenRefreshTimer(accessToken, mockRefreshCallback);

      // Should immediately call refresh for tokens expiring soon
      expect(mockRefreshCallback).toHaveBeenCalled();
    });
  });

  describe('clearTokenRefreshTimer', () => {
    it('should export a clearTokenRefreshTimer function', () => {
      expect(typeof clearTokenRefreshTimer).toBe('function');
    });

    it('should clear existing refresh timer', () => {
      const timerId = 12345;
      global.clearTimeout = jest.fn();

      clearTokenRefreshTimer(timerId);

      expect(clearTimeout).toHaveBeenCalledWith(timerId);
    });
  });
});
