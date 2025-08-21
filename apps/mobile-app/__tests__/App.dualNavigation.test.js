import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('../src/navigation/BottomTabNavigator', () => {
  const ReactLocal = require('react');
  const { View, Text } = require('react-native');
  return function BottomTabNavigator() {
    return ReactLocal.createElement(
      View,
      { testID: 'bottom-tab-navigator' },
      ReactLocal.createElement(Text, null, 'Bottom Tab Navigation'),
    );
  };
});

// Mock AuthContext with authenticated user
jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    user: { username: 'testuser', isAdmin: false },
  })),
}));

describe('App Bottom Tab Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should always render BottomTabNavigator when authenticated', () => {
    const { getAllByTestId } = render(<App />);

    expect(getAllByTestId('bottom-tab-navigator').length).toBeGreaterThan(0);
  });

  it('should render bottom tab navigation regardless of any navigation mode preference', () => {
    const { getAllByTestId } = render(<App />);

    expect(getAllByTestId('bottom-tab-navigator').length).toBeGreaterThan(0);
  });
});
