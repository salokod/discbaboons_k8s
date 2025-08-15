module.exports = {
  preset: 'react-native',
  testTimeout: 10000, // Increase timeout from default 5000ms to 10000ms to prevent timeout failures
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/integration/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-vector-icons|react-error-boundary|react-native-reanimated|reanimated-color-picker|react-native-gesture-handler|react-native-drawer-layout)/)',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/setupTests.js',
  ],
  moduleNameMapper: {
    '^@react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/@react-native-vector-icons/$1.js',
  },
};
