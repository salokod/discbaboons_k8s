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
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-vector-icons)/)',
  ],
  moduleNameMapper: {
    '^@react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/@react-native-vector-icons/$1.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/__tests__/**',
  ],
};
