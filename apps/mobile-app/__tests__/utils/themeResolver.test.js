/**
 * Theme Resolver Tests
 * Tests for the utility function that resolves "system" theme to actual theme
 */

import { resolveTheme } from '../../src/utils/themeResolver';

describe('themeResolver', () => {
  describe('resolveTheme', () => {
    it('should export resolveTheme function', () => {
      expect(typeof resolveTheme).toBe('function');
    });

    it('should return light when preference is light', () => {
      const result = resolveTheme('light', 'dark');
      expect(result).toBe('light');
    });

    it('should return dark when preference is dark', () => {
      const result = resolveTheme('dark', 'light');
      expect(result).toBe('dark');
    });

    it('should return blackout when preference is blackout', () => {
      const result = resolveTheme('blackout', 'light');
      expect(result).toBe('blackout');
    });

    it('should return systemTheme when preference is system', () => {
      const result = resolveTheme('system', 'dark');
      expect(result).toBe('dark');
    });

    it('should default to light if systemTheme not provided for system', () => {
      const result = resolveTheme('system');
      expect(result).toBe('light');
    });
  });
});
