module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/integration/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
};
