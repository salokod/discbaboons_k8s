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

// Note: Ionicons is mocked globally in __mocks__ directory

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

describe.skip('BottomTabNavigator', () => {
  const { ThemeProvider } = require('../../src/context/ThemeContext');
  const { AuthProvider } = require('../../src/context/AuthContext');
  const { BagRefreshProvider } = require('../../src/context/BagRefreshContext');
  const { SafeAreaProvider } = require('react-native-safe-area-context');
  const { GestureHandlerRootView } = require('react-native-gesture-handler');

  const renderWithNavigation = () => render(
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider testMode>
          <AuthProvider>
            <BagRefreshProvider>
              <NavigationContainer>
                <BottomTabNavigator />
              </NavigationContainer>
            </BagRefreshProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>,
  );

  describe('Component Export', () => {
    test('should export a BottomTabNavigator component', () => {
      expect(typeof BottomTabNavigator).toBe('function');
    });
  });

  describe('Tab Configuration', () => {
    test('should render exactly 4 tabs (Bags, Rounds, Baboons, Profile)', () => {
      const { getByText, queryByText } = renderWithNavigation();

      // Should have these 4 tabs
      expect(getByText('Bags')).toBeTruthy();
      expect(getByText('Rounds')).toBeTruthy();
      expect(getByText('Baboons')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();

      // Should NOT have Discover tab
      expect(queryByText('Discover')).toBeNull();
    });

    test('should have accessibility labels for the 4 tabs', () => {
      const { getByLabelText, queryByLabelText } = renderWithNavigation();

      // Should have these 4 tab accessibility labels
      expect(getByLabelText('Bags tab. Manage your disc golf bags and equipment.')).toBeTruthy();
      expect(getByLabelText('Rounds tab. Track your disc golf rounds and scores.')).toBeTruthy();
      expect(getByLabelText('Baboons tab. Community features.')).toBeTruthy();
      expect(getByLabelText('Profile tab. Settings and account management.')).toBeTruthy();

      // Should NOT have discover-tab accessibility label
      expect(queryByLabelText('Discover tab. Search and explore disc golf discs.')).toBeNull();
    });
  });

  describe('Component Structure', () => {
    test('should render bottom tab navigator container', () => {
      const { getByTestId } = renderWithNavigation();
      expect(getByTestId('bottom-tab-navigator')).toBeTruthy();
    });
  });
});
