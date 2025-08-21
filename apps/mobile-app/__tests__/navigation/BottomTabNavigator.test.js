/**
 * BottomTabNavigator Tests
 * Tests for bottom tab navigation component
 */

import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from '../../src/navigation/BottomTabNavigator';

// Mock ThemeContext
jest.mock('../../src/context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    primary: '#ec7032',
    border: '#E0E0E0',
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
  const renderWithNavigation = () => render(
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>,
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
