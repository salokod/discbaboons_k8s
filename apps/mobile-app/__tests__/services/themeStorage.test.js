/**
 * Theme Storage Service Tests
 */

import {
  storeTheme,
  getStoredTheme,
  clearTheme,
} from '../../src/services/themeStorage';

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('ThemeStorage Service', () => {
  let mockAsyncStorage;

  beforeEach(() => {
    mockAsyncStorage = require('@react-native-async-storage/async-storage');

    // Clear all mocks before each test
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
  });

  describe('storeTheme', () => {
    it('should export a storeTheme function', () => {
      expect(typeof storeTheme).toBe('function');
    });

    it('should store valid theme successfully', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await storeTheme('light');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'discbaboons_theme_preference',
        'light',
      );
      expect(result).toBe(true);
    });

    it('should validate theme parameter is required', async () => {
      await expect(storeTheme()).rejects.toThrow('Theme is required');
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should validate theme is a string', async () => {
      await expect(storeTheme(123)).rejects.toThrow('Theme must be a string');
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should validate theme is not empty', async () => {
      await expect(storeTheme('')).rejects.toThrow('Theme cannot be empty');
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(storeTheme('light')).rejects.toThrow('Failed to store theme preference');
    });
  });

  describe('getStoredTheme', () => {
    it('should export a getStoredTheme function', () => {
      expect(typeof getStoredTheme).toBe('function');
    });

    it('should retrieve stored theme successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('dark');

      const result = await getStoredTheme();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('discbaboons_theme_preference');
      expect(result).toBe('dark');
    });

    it('should return null when no theme is stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await getStoredTheme();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('discbaboons_theme_preference');
      expect(result).toBeNull();
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getStoredTheme();

      expect(result).toBeNull();
    });
  });

  describe('clearTheme', () => {
    it('should export a clearTheme function', () => {
      expect(typeof clearTheme).toBe('function');
    });

    it('should clear stored theme successfully', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await clearTheme();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('discbaboons_theme_preference');
      expect(result).toBe(true);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      const result = await clearTheme();

      expect(result).toBe(false);
    });
  });
});
