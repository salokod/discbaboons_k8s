module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/integration/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-vector-icons)/)',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/setupTests.js',
  ],
  moduleNameMapper: {
    '^@react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/@react-native-vector-icons/$1.js',
  },
};
