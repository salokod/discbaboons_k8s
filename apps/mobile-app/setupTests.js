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
