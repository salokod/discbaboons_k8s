/**
 * Integration Test Setup for Mobile App
 *
 * This setup file configures the test environment for integration tests
 * that validate mobile app communication with express-server endpoints.
 */

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-mobile-integration-tests';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-mobile-integration-tests';

// Mock React Native globals for testing
// eslint-disable-next-line no-underscore-dangle
global.__DEV__ = false;

// Mock React Native Platform for node environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
}));

// Mock database environment variables to prevent connection errors during testing
process.env.POSTGRES_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';
process.env.POSTGRES_DB = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';

// Global test setup
beforeAll(async () => {
  // Setup complete
});

afterAll(async () => {
  // Cleanup complete
});
