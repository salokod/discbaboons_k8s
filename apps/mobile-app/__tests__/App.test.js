/**
 * App Navigation Tests
 */

import { render } from '@testing-library/react-native';
import App from '../App';

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
  };
});

// Mock the HapticService functions
jest.mock('../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

// Mock the screens that don't exist yet
jest.mock('../src/screens/LoginScreen', () => 'LoginScreen');
jest.mock('../src/screens/HomeScreen', () => 'HomeScreen');

describe('App', () => {
  it('should render NavigationContainer', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('navigation-container')).toBeTruthy();
  });

  it('should render AuthNavigator when not authenticated', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('auth-navigator')).toBeTruthy();
  });

  // Integration test: LoginScreen rendering is tested in LoginScreen.test.js
  // Navigation integration will be tested through user interactions

  // TODO: Test authenticated state through integration tests when we have LoginScreen
  // We'll test the auth flow by actually logging in through the UI
});
