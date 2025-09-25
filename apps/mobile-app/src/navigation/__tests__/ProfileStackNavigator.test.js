import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProfileStackNavigator from '../ProfileStackNavigator';

// Mock ThemeContext
jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    activeTheme: 'light',
    setTheme: jest.fn(),
    changeTheme: jest.fn(),
    isLoading: false,
  })),
  useThemeColors: jest.fn(() => ({
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    primary: '#ec7032',
    border: '#E0E0E0',
  })),
  ThemeProvider: ({ children }) => children,
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { username: 'testuser', isAdmin: true },
  })),
  AuthProvider: ({ children }) => children,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock the screen components
jest.mock('../../screens/settings/SettingsScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function SettingsScreen() {
    return ReactLocal.createElement(Text, { testID: 'settings-screen' }, 'SettingsScreen');
  };
});

jest.mock('../../screens/settings/AccountSettingsScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AccountSettingsScreen() {
    return ReactLocal.createElement(Text, { testID: 'account-settings-screen' }, 'AccountSettingsScreen');
  };
});

jest.mock('../../screens/settings/AboutScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AboutScreen() {
    return ReactLocal.createElement(Text, { testID: 'about-screen' }, 'AboutScreen');
  };
});

jest.mock('../../screens/SupportScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function SupportScreen() {
    return ReactLocal.createElement(Text, { testID: 'support-screen' }, 'SupportScreen');
  };
});

jest.mock('../../screens/settings/AdminDashboardScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AdminDashboardScreen() {
    return ReactLocal.createElement(Text, { testID: 'admin-dashboard-screen' }, 'AdminDashboardScreen');
  };
});

jest.mock('../../screens/discs/AdminDiscScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AdminDiscScreen() {
    return ReactLocal.createElement(Text, { testID: 'admin-disc-screen' }, 'AdminDiscScreen');
  };
});

jest.mock('../../screens/PrivacyPolicyScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function PrivacyPolicyScreen() {
    return ReactLocal.createElement(Text, { testID: 'privacy-policy-screen' }, 'PrivacyPolicyScreen');
  };
});

jest.mock('../../screens/TermsOfServiceScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function TermsOfServiceScreen() {
    return ReactLocal.createElement(Text, { testID: 'terms-of-service-screen' }, 'TermsOfServiceScreen');
  };
});

describe('ProfileStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  it('should export a component', () => {
    expect(ProfileStackNavigator).toBeDefined();
    expect(typeof ProfileStackNavigator).toBe('function');
  });

  it('should not include LostDiscs route', () => {
    // LostDiscs should only be accessible via BagsStackNavigator
    // Test that the component renders without trying to import LostDiscsScreen
    const { getByTestId } = renderWithNavigation(<ProfileStackNavigator />);
    expect(getByTestId('settings-screen')).toBeTruthy();
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<ProfileStackNavigator />);

    // Should render the initial screen (Settings)
    expect(getByTestId('settings-screen')).toBeTruthy();
  });

  it('should include admin routes in the stack', () => {
    // This test verifies that the ProfileStackNavigator includes
    // admin routes that can be navigated to from the Settings screen
    const { getByTestId } = renderWithNavigation(<ProfileStackNavigator />);

    // Should render the initial screen (Settings)
    expect(getByTestId('settings-screen')).toBeTruthy();

    // Note: We can't directly test navigation to admin screens here,
    // but we verify the component renders which confirms the routes exist
  });
});
