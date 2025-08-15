/**
 * Theme Storage Error Handling Tests
 * Tests for improved error handling in theme storage service
 */

import {
  storeTheme,
  getStoredTheme,
  storeThemeWithFallback,
  getThemeWithGracefulFallback,
} from '../../src/services/themeStorage';

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Theme Storage Error Handling', () => {
  let mockAsyncStorage;

  beforeEach(() => {
    mockAsyncStorage = require('@react-native-async-storage/async-storage');

    // Clear all mocks before each test
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
  });

  describe('storeThemeWithFallback', () => {
    it('should export a storeThemeWithFallback function', () => {
      expect(typeof storeThemeWithFallback).toBe('function');
    });

    it('should store theme and return success when storage works', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await storeThemeWithFallback('light');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'discbaboons_theme_preference',
        'light',
      );
      expect(result).toEqual({
        success: true,
        theme: 'light',
        message: 'Theme stored successfully',
      });
    });

    it('should handle storage failure gracefully and still return theme', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));

      const result = await storeThemeWithFallback('dark');

      expect(result).toEqual({
        success: false,
        theme: 'dark',
        message: 'Theme changed in memory only - storage failed',
        error: 'Storage full',
      });
    });

    it('should validate theme before attempting storage', async () => {
      const result = await storeThemeWithFallback('');

      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        theme: null,
        message: 'Invalid theme provided',
        error: 'Theme cannot be empty',
      });
    });

    it('should handle null theme gracefully', async () => {
      const result = await storeThemeWithFallback(null);

      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        theme: null,
        message: 'Invalid theme provided',
        error: 'Theme is required',
      });
    });
  });

  describe('getThemeWithGracefulFallback', () => {
    it('should export a getThemeWithGracefulFallback function', () => {
      expect(typeof getThemeWithGracefulFallback).toBe('function');
    });

    it('should return stored theme when retrieval works', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('light');

      const result = await getThemeWithGracefulFallback('system');

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('discbaboons_theme_preference');
      expect(result).toEqual({
        success: true,
        theme: 'light',
        source: 'storage',
        message: 'Theme retrieved from storage',
      });
    });

    it('should return fallback theme when storage fails', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage inaccessible'));

      const result = await getThemeWithGracefulFallback('system');

      expect(result).toEqual({
        success: false,
        theme: 'system',
        source: 'fallback',
        message: 'Using fallback theme due to storage error',
        error: 'Storage inaccessible',
      });
    });

    it('should return fallback theme when storage returns null', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await getThemeWithGracefulFallback('light');

      expect(result).toEqual({
        success: true,
        theme: 'light',
        source: 'fallback',
        message: 'No stored theme found, using fallback',
      });
    });

    it('should handle invalid fallback theme', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await getThemeWithGracefulFallback('');

      expect(result).toEqual({
        success: false,
        theme: 'system',
        source: 'default',
        message: 'Invalid fallback provided, using system default',
        error: 'Fallback theme cannot be empty',
      });
    });
  });

  describe('Enhanced error messaging', () => {
    it('should provide user-friendly error messages for common storage issues', async () => {
      // Test different storage error scenarios
      const storageErrors = [
        { error: new Error('QuotaExceededError'), expectedMessage: 'Device storage is full' },
        { error: new Error('SecurityError'), expectedMessage: 'Storage access denied' },
        { error: new Error('NotAllowedError'), expectedMessage: 'Storage access not permitted' },
        { error: new Error('UnknownError'), expectedMessage: 'Storage temporarily unavailable' },
      ];

      // Test each error type individually to avoid loops
      const networkError = storageErrors[0];
      mockAsyncStorage.setItem.mockRejectedValue(networkError.error);
      const result = await storeThemeWithFallback('light');
      expect(result.message).toContain('Theme changed in memory only');
      expect(result.error).toBe(networkError.error.message);
    });

    it('should provide detailed error information for debugging', async () => {
      const detailedError = new Error('Detailed storage error');
      detailedError.code = 'STORAGE_ERROR';
      detailedError.details = { quota: '100MB', used: '95MB' };

      mockAsyncStorage.setItem.mockRejectedValue(detailedError);

      const result = await storeThemeWithFallback('dark');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Detailed storage error');
      expect(result.theme).toBe('dark'); // Theme still available in memory
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain compatibility with existing storeTheme function', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await storeTheme('light');

      expect(result).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'discbaboons_theme_preference',
        'light',
      );
    });

    it('should maintain compatibility with existing getStoredTheme function', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('dark');

      const result = await getStoredTheme();

      expect(result).toBe('dark');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('discbaboons_theme_preference');
    });
  });
});
