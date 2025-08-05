/**
 * Test Setup for React Native Unit Tests
 *
 * This setup file is loaded before all unit tests run.
 * It configures mocks and globals needed for React Native testing.
 */

// Mock React Native globals
// eslint-disable-next-line no-underscore-dangle
global.__DEV__ = false;

// Mock console to reduce noise in tests (optional)
// global.console = {
//   ...console,
//   // Uncomment below to suppress console logs during tests
//   // log: jest.fn(),
//   // debug: jest.fn(),
//   // info: jest.fn(),
//   // warn: jest.fn(),
//   // error: jest.fn(),
// };
