/**
 * Test Setup for React Native Unit Tests
 *
 * This setup file is loaded before all unit tests run.
 * It configures mocks and globals needed for React Native testing.
 */

// Mock React Native globals
// eslint-disable-next-line no-underscore-dangle
global.__DEV__ = false;

// Mock console to reduce noise in tests
// eslint-disable-next-line no-console
const originalError = console.error;
// eslint-disable-next-line no-console
console.error = (...args) => {
  // Suppress act() warnings which are common in React Native testing
  // These warnings don't affect test results and create noise
  if (
    typeof args[0] === 'string'
    && (args[0].includes('inside a test was not wrapped in act')
     || (args[0].includes('An update to') && args[0].includes('inside a test was not wrapped in act')))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Pure React Native color picker implementation - no external dependencies needed

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const actualReanimated = jest.requireActual('react-native-reanimated/mock');
  return {
    ...actualReanimated,
    default: {
      ...actualReanimated.default,
      // Add any additional mocks if needed
    },
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  function MockSwipeable({ children, renderRightActions }) {
    const rightActions = renderRightActions ? renderRightActions() : null;
    return React.createElement(View, null, children, rightActions);
  }

  return {
    Swipeable: MockSwipeable,
    // Include other gesture handler components if needed
    PanGestureHandler: View,
    TapGestureHandler: View,
    GestureHandlerRootView: View,
    State: {},
    Directions: {},
  };
});

// Mock AsyncStorage for theme persistence
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {
    selection: 'selection',
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
  canImplyAuthentication: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('TouchID')),
  SECURITY_LEVEL: {},
  ACCESS_CONTROL: {},
  AUTHENTICATION_TYPE: {},
  BIOMETRY_TYPE: {},
}));
