/**
 * Haptic Feedback Service
 * Provides cross-platform haptic feedback with graceful degradation
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Configure haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true, // Android fallback
  ignoreAndroidSystemSettings: false, // Respect user settings
};

/**
 * Trigger success haptic feedback (light impact)
 * Used for successful actions like login
 */
export function triggerSuccessHaptic() {
  try {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  } catch (error) {
    // Silently fail on unsupported devices
    // eslint-disable-next-line no-console
    console.debug('Haptic feedback not supported:', error.message);
  }
}

/**
 * Trigger error haptic feedback (notification error)
 * Used for failed actions like login errors
 */
export function triggerErrorHaptic() {
  try {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  } catch (error) {
    // Silently fail on unsupported devices
    // eslint-disable-next-line no-console
    console.debug('Haptic feedback not supported:', error.message);
  }
}

/**
 * Trigger selection haptic feedback (very light)
 * Used for form validation or subtle interactions
 */
export function triggerSelectionHaptic() {
  try {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  } catch (error) {
    // Silently fail on unsupported devices
    // eslint-disable-next-line no-console
    console.debug('Haptic feedback not supported:', error.message);
  }
}

/**
 * Check if haptic feedback is available on the device
 * @returns {boolean} True if haptic feedback is supported
 */
export function isHapticFeedbackSupported() {
  try {
    // Test with a light haptic to see if it's supported
    ReactNativeHapticFeedback.trigger('selection', {
      ...hapticOptions,
      enableVibrateFallback: false,
    });
    return true;
  } catch (error) {
    return false;
  }
}
