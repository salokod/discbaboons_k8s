import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AdminStackNavigator from '../AdminStackNavigator';

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

jest.mock('../../screens/discs/DiscSearchScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function DiscSearchScreen() {
    return ReactLocal.createElement(Text, { testID: 'disc-search-screen' }, 'DiscSearchScreen');
  };
});

jest.mock('../../screens/discs/SubmitDiscScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function SubmitDiscScreen() {
    return ReactLocal.createElement(Text, { testID: 'submit-disc-screen' }, 'SubmitDiscScreen');
  };
});

describe('AdminStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  it('should export a component', () => {
    expect(AdminStackNavigator).toBeDefined();
    expect(typeof AdminStackNavigator).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<AdminStackNavigator />);

    // Should render the initial screen (AdminDashboard)
    expect(getByTestId('admin-dashboard-screen')).toBeTruthy();
  });
});
