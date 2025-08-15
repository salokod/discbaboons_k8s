/**
 * SystemTheme Service Tests
 */

import { Appearance } from 'react-native';
import {
  getSystemColorScheme,
  addSystemThemeChangeListener,
  isSystemThemeSupported,
} from '../../src/services/systemTheme';
import { THEME_NAMES } from '../../src/design-system/themes';

// Mock React Native Appearance API
jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: jest.fn(),
    addChangeListener: jest.fn(),
  },
}));

describe('SystemTheme Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemColorScheme', () => {
    it('should return dark theme when system is dark', () => {
      Appearance.getColorScheme.mockReturnValue('dark');

      const result = getSystemColorScheme();

      expect(result).toBe(THEME_NAMES.DARK);
    });

    it('should return light theme when system is light', () => {
      Appearance.getColorScheme.mockReturnValue('light');

      const result = getSystemColorScheme();

      expect(result).toBe(THEME_NAMES.LIGHT);
    });

    it('should return light theme when system returns null', () => {
      Appearance.getColorScheme.mockReturnValue(null);

      const result = getSystemColorScheme();

      expect(result).toBe(THEME_NAMES.LIGHT);
    });

    it('should handle errors gracefully and return light theme', () => {
      Appearance.getColorScheme.mockImplementation(() => {
        throw new Error('Detection failed');
      });

      const result = getSystemColorScheme();

      expect(result).toBe(THEME_NAMES.LIGHT);
    });
  });

  describe('addSystemThemeChangeListener', () => {
    it('should add listener and return cleanup function', () => {
      const mockSubscription = { remove: jest.fn() };
      Appearance.addChangeListener.mockReturnValue(mockSubscription);

      const mockListener = jest.fn();
      const cleanup = addSystemThemeChangeListener(mockListener);

      expect(Appearance.addChangeListener).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');

      // Test cleanup
      cleanup();
      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('should call listener with correct theme when system changes to dark', () => {
      const mockListener = jest.fn();
      let changeCallback;

      Appearance.addChangeListener.mockImplementation((callback) => {
        changeCallback = callback;
        return { remove: jest.fn() };
      });

      addSystemThemeChangeListener(mockListener);

      // Simulate system change to dark
      changeCallback({ colorScheme: 'dark' });

      expect(mockListener).toHaveBeenCalledWith(THEME_NAMES.DARK);
    });

    it('should call listener with light theme when system changes to light', () => {
      const mockListener = jest.fn();
      let changeCallback;

      Appearance.addChangeListener.mockImplementation((callback) => {
        changeCallback = callback;
        return { remove: jest.fn() };
      });

      addSystemThemeChangeListener(mockListener);

      // Simulate system change to light
      changeCallback({ colorScheme: 'light' });

      expect(mockListener).toHaveBeenCalledWith(THEME_NAMES.LIGHT);
    });

    it('should handle errors gracefully and return no-op cleanup', () => {
      Appearance.addChangeListener.mockImplementation(() => {
        throw new Error('Listener setup failed');
      });

      const mockListener = jest.fn();
      const cleanup = addSystemThemeChangeListener(mockListener);

      expect(typeof cleanup).toBe('function');
      // Should not throw when called
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('isSystemThemeSupported', () => {
    it('should return true when Appearance.getColorScheme is available', () => {
      Appearance.getColorScheme = jest.fn();

      const result = isSystemThemeSupported();

      expect(result).toBe(true);
    });

    it('should return false when Appearance.getColorScheme is not available', () => {
      delete Appearance.getColorScheme;

      const result = isSystemThemeSupported();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully and return false', () => {
      Object.defineProperty(Appearance, 'getColorScheme', {
        get: () => {
          throw new Error('Not supported');
        },
      });

      const result = isSystemThemeSupported();

      expect(result).toBe(false);
    });
  });
});
