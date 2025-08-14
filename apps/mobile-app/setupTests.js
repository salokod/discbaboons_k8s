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
// eslint-disable-next-line no-undef
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line no-undef
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
// eslint-disable-next-line no-undef
jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line no-undef
  const actualGestureHandler = jest.requireActual('react-native-gesture-handler/jestSetup');
  return actualGestureHandler;
});
