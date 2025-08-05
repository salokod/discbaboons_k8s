/**
 * Haptic Service Tests
 */

import {
  triggerSuccessHaptic,
  triggerErrorHaptic,
  triggerSelectionHaptic,
  isHapticFeedbackSupported,
} from '../../src/services/hapticService';

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

describe('HapticService', () => {
  let mockHapticFeedback;

  beforeEach(() => {
    mockHapticFeedback = require('react-native-haptic-feedback');
    mockHapticFeedback.trigger.mockClear();
  });

  describe('triggerSuccessHaptic', () => {
    it('should trigger light impact haptic feedback', () => {
      triggerSuccessHaptic();

      expect(mockHapticFeedback.trigger).toHaveBeenCalledWith('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    });

    it('should handle haptic feedback errors gracefully', () => {
      mockHapticFeedback.trigger.mockImplementationOnce(() => {
        throw new Error('Haptic not supported');
      });

      // Should not throw error
      expect(() => triggerSuccessHaptic()).not.toThrow();
    });
  });

  describe('triggerErrorHaptic', () => {
    it('should trigger notification error haptic feedback', () => {
      triggerErrorHaptic();

      expect(mockHapticFeedback.trigger).toHaveBeenCalledWith('notificationError', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    });

    it('should handle haptic feedback errors gracefully', () => {
      mockHapticFeedback.trigger.mockImplementationOnce(() => {
        throw new Error('Haptic not supported');
      });

      expect(() => triggerErrorHaptic()).not.toThrow();
    });
  });

  describe('triggerSelectionHaptic', () => {
    it('should trigger selection haptic feedback', () => {
      triggerSelectionHaptic();

      expect(mockHapticFeedback.trigger).toHaveBeenCalledWith('selection', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    });

    it('should handle haptic feedback errors gracefully', () => {
      mockHapticFeedback.trigger.mockImplementationOnce(() => {
        throw new Error('Haptic not supported');
      });

      expect(() => triggerSelectionHaptic()).not.toThrow();
    });
  });

  describe('isHapticFeedbackSupported', () => {
    it('should return true when haptic feedback is available', () => {
      mockHapticFeedback.trigger.mockImplementationOnce(() => {
        // Success - no error thrown
      });

      const isSupported = isHapticFeedbackSupported();

      expect(isSupported).toBe(true);
      expect(mockHapticFeedback.trigger).toHaveBeenCalledWith('selection', {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      });
    });

    it('should return false when haptic feedback is not available', () => {
      mockHapticFeedback.trigger.mockImplementationOnce(() => {
        throw new Error('Haptic not supported');
      });

      const isSupported = isHapticFeedbackSupported();

      expect(isSupported).toBe(false);
    });
  });

  describe('haptic options configuration', () => {
    it('should use consistent options across all haptic functions', () => {
      const expectedOptions = {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      };

      triggerSuccessHaptic();
      triggerErrorHaptic();
      triggerSelectionHaptic();

      expect(mockHapticFeedback.trigger).toHaveBeenNthCalledWith(1, 'impactLight', expectedOptions);
      expect(mockHapticFeedback.trigger).toHaveBeenNthCalledWith(2, 'notificationError', expectedOptions);
      expect(mockHapticFeedback.trigger).toHaveBeenNthCalledWith(3, 'selection', expectedOptions);
    });
  });
});
