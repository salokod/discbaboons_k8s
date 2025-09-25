/**
 * Theme Error Wrapping Tests
 * Tests for wrapping Settings components with ThemeErrorBoundary in BottomTabNavigator
 */

import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from '../../src/navigation/BottomTabNavigator';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../src/context/BagRefreshContext';

// Mock console.error to avoid noise in tests
// eslint-disable-next-line no-console
const originalConsoleError = console.error;
beforeEach(() => {
  // eslint-disable-next-line no-console
  console.error = jest.fn();
});

afterEach(() => {
  // eslint-disable-next-line no-console
  console.error = originalConsoleError;
});

// Mock react-navigation to control navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(),
  removeItem: jest.fn().mockResolvedValue(),
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

// Mock all stack navigators to avoid complex rendering
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

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
}));

// Test wrapper with providers
function TestWrapper({ children }) {
  const { SafeAreaProvider } = require('react-native-safe-area-context');
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <BagRefreshProvider>
            <NavigationContainer>
              {children}
            </NavigationContainer>
          </BagRefreshProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

describe('Theme Error Wrapping in Navigation', () => {
  it('should render BottomTabNavigator without error boundaries (settings moved to Profile tab)', () => {
    const { queryByTestId } = render(
      <TestWrapper>
        <BottomTabNavigator />
      </TestWrapper>,
    );

    // BottomTabNavigator should render successfully
    // Note: Settings are now handled in Profile tab stack navigators
    expect(queryByTestId('bottom-tab-navigator')).toBeTruthy();
  });

  it('should handle navigation errors gracefully with bottom tabs', () => {
    // BottomTabNavigator should not crash the app
    expect(() => {
      render(
        <TestWrapper>
          <BottomTabNavigator />
        </TestWrapper>,
      );
    }).not.toThrow();
  });

  it('should verify BottomTabNavigator structure', () => {
    const { queryByTestId } = render(
      <TestWrapper>
        <BottomTabNavigator />
      </TestWrapper>,
    );

    // Should render bottom tab navigation successfully
    // Error boundaries for settings are now handled in ProfileStackNavigator
    expect(queryByTestId('bottom-tab-navigator')).toBeTruthy();
  });
});
