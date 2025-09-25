/**
 * BottomTabNavigator Tests
 * Tests for bottom tab navigation component
 */

import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from '../../src/navigation/BottomTabNavigator';

// Mock only the services, not the context providers
jest.mock('../../src/services/themeStorage', () => ({
  getStoredTheme: jest.fn(() => Promise.resolve('light')),
  storeTheme: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/services/systemTheme', () => ({
  getSystemColorScheme: jest.fn(() => 'light'),
  addSystemThemeChangeListener: jest.fn(() => () => {}),
  isSystemThemeSupported: jest.fn(() => true),
}));

// Mock react-native-safe-area-context for testing
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));

// Add missing React Navigation context mocks
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useTheme: jest.fn(() => ({
      dark: false,
      colors: {
        primary: '#007AFF',
        background: '#ffffff',
        card: '#ffffff',
        text: '#000000',
        border: '#c7c7cc',
        notification: '#ff453a',
      },
    })),
  };
});

// Note: Ionicons is mocked globally in __mocks__ directory

// Mock AuthContext
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => children,
}));

// Mock ThemeContext
jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    activeTheme: 'light',
    systemTheme: 'light',
    setTheme: jest.fn(),
  })),
  useThemeColors: jest.fn(() => ({
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    primary: '#007AFF',
    secondary: '#8E8E93',
    accent: '#FF9500',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    border: '#C7C7CC',
  })),
  ThemeProvider: ({ children }) => children,
}));

// Mock BagRefreshContext
jest.mock('../../src/context/BagRefreshContext', () => ({
  useBagRefreshContext: jest.fn(() => ({
    addBagListListener: jest.fn(),
    removeBagListListener: jest.fn(),
    triggerBagListRefresh: jest.fn(),
  })),
  BagRefreshProvider: ({ children }) => children,
}));

// Mock FriendsContext
jest.mock('../../src/context/FriendsContext', () => ({
  FriendsProvider: ({ children }) => children,
  useFriends: jest.fn(() => ({
    friends: {
      list: [],
      pagination: {},
      loading: false,
      lastRefresh: null,
      error: null,
    },
    requests: {
      incoming: [],
      outgoing: [],
      badge: 0,
      loading: false,
      processingRequests: new Set(),
    },
    loading: false,
    error: null,
    dispatch: jest.fn(),
  })),
}));

// Mock all stack navigators
jest.mock('../../src/navigation/BagsStackNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function BagsStackNavigator() {
    return React.createElement(Text, { testID: 'bags-stack' }, 'BagsStack');
  };
});

jest.mock('../../src/navigation/RoundsStackNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function RoundsStackNavigator() {
    return React.createElement(Text, { testID: 'rounds-stack' }, 'RoundsStack');
  };
});

jest.mock('../../src/navigation/CommunityStackNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CommunityStackNavigator() {
    return React.createElement(Text, { testID: 'community-stack' }, 'CommunityStack');
  };
});

jest.mock('../../src/navigation/ProfileStackNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function ProfileStackNavigator() {
    return React.createElement(Text, { testID: 'profile-stack' }, 'ProfileStack');
  };
});

describe('BottomTabNavigator', () => {
  const { useAuth } = require('../../src/context/AuthContext');

  const renderWithNavigation = (user = { username: 'testuser', isAdmin: false }) => {
    useAuth.mockReturnValue({ user });

    return render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>,
    );
  };

  describe('Component Export', () => {
    test('should export a BottomTabNavigator component', () => {
      expect(typeof BottomTabNavigator).toBe('function');
    });
  });

  describe('Tab Configuration', () => {
    test('should render exactly 4 tabs (Bags, Rounds, Baboons, Profile)', () => {
      const { getByText } = renderWithNavigation();

      // Verify all expected tabs are present
      expect(getByText('Bags')).toBeTruthy();
      expect(getByText('Rounds')).toBeTruthy();
      expect(getByText('Baboons')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });
  });
});
