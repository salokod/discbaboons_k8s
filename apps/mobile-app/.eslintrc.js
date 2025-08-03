module.exports = {
  root: true,
  extends: [
    '@react-native',
    'airbnb',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['@react-native/babel-preset'],
    },
  },
  rules: {
    // React Native specific overrides
    'react/prop-types': 'off', // React Native often doesn't use prop-types
    'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }],
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off', // React Native has special module resolution
    'global-require': 'off', // React Native uses require() for images
    // Modern JSX runtime (React 17+)
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
