/**
 * Cross-Tab Navigation Test
 * Tests navigation shortcuts between tabs for seamless user experience
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from '../../src/navigation/BottomTabNavigator';

// Mock all stack navigators to track navigation calls
const mockNavigate = jest.fn();
const mockGetState = jest.fn();

jest.mock('../../src/navigation/BagsStackNavigator', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return function BagsStackNavigator() {
    // Simple mock without Discover navigation since Discover tab is removed
    return React.createElement(View, { testID: 'bags-stack' }, [
      React.createElement(Text, { key: 'title' }, 'BagsStack'),
    ]);
  };
});

jest.mock('../../src/navigation/RoundsStackNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function RoundsStackNavigator() {
    return React.createElement(Text, { testID: 'rounds-stack' }, 'RoundsStack');
  };
});

// DiscoverStackNavigator removed - no longer part of bottom tab navigation

jest.mock('../../src/navigation/CommunityStackNavigator', () => {
  const React = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');
  return function CommunityStackNavigator({ navigation }) {
    // Mock an "Add to Bag" button that should navigate to Bags tab
    return React.createElement(View, { testID: 'community-stack' }, [
      React.createElement(Text, { key: 'title' }, 'CommunityStack'),
      React.createElement(
        TouchableOpacity,
        {
          key: 'add-to-bag-shortcut',
          testID: 'add-to-bag-shortcut',
          onPress: () => {
            // This should navigate to Bags tab
            navigation.navigate('Bags', { screen: 'BagsList' });
          },
        },
        React.createElement(Text, null, 'Add to Bag (View Bags)'),
      ),
    ]);
  };
});

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

// Mock Ionicons
jest.mock('@react-native-vector-icons/ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function Icon({
    name, size, color, ...props
  }) {
    return React.createElement(Text, {
      ...props, style: { fontSize: size, color },
    }, name);
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
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

describe.skip('Cross-Tab Navigation', () => {
  const { useAuth } = require('../../src/context/AuthContext');

  const renderWithProviders = (user = { username: 'testuser', isAdmin: false }) => {
    useAuth.mockReturnValue({ user });

    return render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockGetState.mockClear();
  });

  it('should export cross-tab navigation functionality', () => {
    // First test: ensure the navigation structure exists
    const { getByTestId } = renderWithProviders();

    // Should render the bottom tab navigator with navigation capability
    expect(getByTestId('bags-stack')).toBeTruthy();
  });

  it('should render only 4 tabs without Discover tab', async () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders();

    // Should render 4 tabs
    expect(getByTestId('bags-stack')).toBeTruthy();
    expect(getByText('Bags')).toBeTruthy();
    expect(getByText('Rounds')).toBeTruthy();
    expect(getByText('Baboons')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();

    // Should NOT have Discover tab
    expect(queryByText('Discover')).toBeNull();
  });

  it('should navigate from Baboons tab to Bags tab when "Add to Bag" shortcut is pressed', async () => {
    const { getByTestId, getByText } = renderWithProviders();

    // Navigate to Baboons tab first
    const baboonsTab = getByText('Baboons');
    fireEvent.press(baboonsTab);

    await waitFor(() => {
      expect(getByTestId('community-stack')).toBeTruthy();
    });

    // Should show "Add to Bag" shortcut
    expect(getByText('Add to Bag (View Bags)')).toBeTruthy();

    // Tap the shortcut button
    fireEvent.press(getByTestId('add-to-bag-shortcut'));

    // Should navigate back to Bags tab
    await waitFor(() => {
      expect(getByTestId('bags-stack')).toBeTruthy();
    });
  });

  it('should maintain tab state during cross-tab navigation', async () => {
    const { getByTestId, getByText } = renderWithProviders();

    // Start on Bags tab
    expect(getByTestId('bags-stack')).toBeTruthy();

    // Navigate to Baboons tab via tab press
    fireEvent.press(getByText('Baboons'));
    await waitFor(() => {
      expect(getByTestId('community-stack')).toBeTruthy();
    });

    // Navigate back to Bags via shortcut
    fireEvent.press(getByTestId('add-to-bag-shortcut'));
    await waitFor(() => {
      expect(getByTestId('bags-stack')).toBeTruthy();
    });

    // Tab state should be preserved - only 4 tabs should exist
    expect(getByText('Bags')).toBeTruthy();
    expect(getByText('Rounds')).toBeTruthy();
    expect(getByText('Baboons')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('should provide navigation shortcuts through Community tab', () => {
    const { getByTestId, getByText } = renderWithProviders();

    // Navigate to baboons to check shortcut
    fireEvent.press(getByText('Baboons'));
    expect(getByTestId('add-to-bag-shortcut')).toBeTruthy();

    // Navigate back to Bags tab
    fireEvent.press(getByText('Bags'));
    expect(getByTestId('bags-stack')).toBeTruthy();

    // Verify the 4-tab navigation structure works
    expect(getByText('Bags')).toBeTruthy();
    expect(getByText('Rounds')).toBeTruthy();
    expect(getByText('Baboons')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('should support complete navigation integration across all 4 tabs', async () => {
    const { getByTestId, getByText } = renderWithProviders();

    // Test complete navigation flow through all 4 tabs
    expect(getByTestId('bags-stack')).toBeTruthy();

    // Navigate to Community tab first to access the add-to-bag-shortcut
    fireEvent.press(getByText('Baboons'));
    await waitFor(() => {
      expect(getByTestId('community-stack')).toBeTruthy();
    });

    // Community to Bags
    fireEvent.press(getByTestId('add-to-bag-shortcut'));
    await waitFor(() => {
      expect(getByTestId('bags-stack')).toBeTruthy();
    });

    // All 4 tabs should work seamlessly (no Discover tab)
    expect(getByText('Bags')).toBeTruthy();
    expect(getByText('Rounds')).toBeTruthy();
    expect(getByText('Baboons')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });
});
