module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/integration/setup.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/integration/setup.js',
  ],
  testTimeout: 10000,
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/__tests__/**',
  ],
};
