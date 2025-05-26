export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!coverage/**',
    '!**/prisma/**',
  ],
  testTimeout: 5000,
  transform: {},
};
