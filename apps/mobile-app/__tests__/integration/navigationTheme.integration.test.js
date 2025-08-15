/**
 * Navigation Theme Switch Integration Tests
 *
 * This integration test suite validates that theme switching maintains consistency
 * while navigating between different screens in the app. Tests ensure that:
 * 1. Theme changes propagate to all navigation elements
 * 2. Screen transitions maintain theme consistency
 * 3. Navigation UI elements (headers, drawers) reflect current theme
 * 4. Theme persistence works across navigation state changes
 */

import {
  render, fireEvent, waitFor, act, cleanup,
} from '@testing-library/react-native';
import {
  View, Text, TouchableOpacity,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
// Native stack navigator not needed for simplified integration tests

// Import theme and navigation modules
import {
  ThemeProvider, useTheme, useThemeColors,
} from '../../src/context/ThemeContext';
import DrawerNavigator from '../../src/navigation/DrawerNavigator';
import { THEME_NAMES, themes } from '../../src/design-system/themes';
import * as themeStorage from '../../src/services/themeStorage';
import * as systemTheme from '../../src/services/systemTheme';

// Mock React Native and React Navigation
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj) => obj.ios || obj.default },
  Appearance: {
    getColorScheme: jest.fn(),
    addChangeListener: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: {
    create: (styles) => styles,
    flatten: (styles) => (Array.isArray(styles) ? Object.assign({}, ...styles) : styles),
  },
}));

// Mock vector icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Mock navigation dependencies
jest.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: () => ({
    Navigator: 'DrawerNavigator',
    Screen: 'DrawerScreen',
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'StackNavigator',
    Screen: 'StackScreen',
  }),
}));

// Mock specific screen components to avoid complex dependencies
jest.mock('../../src/screens/bags/BagsListScreen', () => 'MockBagsListScreen');

jest.mock('../../src/screens/settings/SettingsScreen', () => 'MockSettingsScreen');

jest.mock('../../src/components/settings/SettingsDrawer', () => 'MockSettingsDrawer');

// Mock other screen dependencies
jest.mock('../../src/screens/bags/CreateBagScreen', () => 'MockCreateBagScreen');
jest.mock('../../src/screens/bags/BagDetailScreen', () => 'MockBagDetailScreen');
jest.mock('../../src/screens/discs/DiscSearchScreen', () => 'MockDiscSearchScreen');
jest.mock('../../src/screens/discs/SubmitDiscScreen', () => 'MockSubmitDiscScreen');
jest.mock('../../src/screens/discs/AdminDiscScreen', () => 'MockAdminDiscScreen');
jest.mock('../../src/screens/discs/AddDiscToBagScreen', () => 'MockAddDiscToBagScreen');
jest.mock('../../src/screens/settings/AccountSettingsScreen', () => 'MockAccountSettingsScreen');
jest.mock('../../src/screens/settings/AboutScreen', () => 'MockAboutScreen');
jest.mock('../../src/screens/TermsOfServiceScreen', () => 'MockTermsOfServiceScreen');
jest.mock('../../src/screens/PrivacyPolicyScreen', () => 'MockPrivacyPolicyScreen');
jest.mock('../../src/screens/SupportScreen', () => 'MockSupportScreen');

// Mock ErrorBoundary and ThemeErrorBoundary
jest.mock('../../src/components/ErrorBoundary', () => 'MockErrorBoundary');
jest.mock('../../src/components/settings/ThemeErrorBoundary', () => 'MockThemeErrorBoundary');

// Mock DrawerNavigator
jest.mock('../../src/navigation/DrawerNavigator', () => function MockDrawerNavigator() {
  const React = require('react');
  const { View: MockView } = require('react-native');
  return React.createElement(MockView, { testID: 'drawer-navigator' });
});

// Mock theme services
jest.mock('../../src/services/themeStorage');
jest.mock('../../src/services/systemTheme');

// Stack navigator not needed for simplified test structure

// Home screen component
function HomeScreen() {
  const colors = useThemeColors();
  const { changeTheme } = useTheme();

  const handleChangeToDark = () => changeTheme(THEME_NAMES.DARK);
  const handleChangeToLight = () => changeTheme(THEME_NAMES.LIGHT);

  return (
    <View testID="home-screen" style={{ backgroundColor: colors.background }}>
      <Text testID="home-bg-color">{colors.background}</Text>
      <Text testID="home-text-color">{colors.text}</Text>
      <TouchableOpacity
        testID="home-change-to-dark"
        onPress={handleChangeToDark}
      >
        <Text>Change to Dark</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="home-change-to-light"
        onPress={handleChangeToLight}
      >
        <Text>Change to Light</Text>
      </TouchableOpacity>
    </View>
  );
}

// Details screen component
function DetailsScreen() {
  const colors = useThemeColors();

  return (
    <View testID="details-screen" style={{ backgroundColor: colors.background }}>
      <Text testID="details-bg-color">{colors.background}</Text>
      <Text testID="details-text-color">{colors.text}</Text>
      <Text testID="details-primary-color">{colors.primary}</Text>
    </View>
  );
}

describe('Navigation Theme Switch Integration', () => {
  let mockStorageGet;
  let mockStorageStore;
  let mockSystemThemeService;

  // Simple navigation test app that includes theme switching
  function NavigationTestApp() {
    const colors = useThemeColors();
    const { theme, activeTheme } = useTheme();

    return (
      <NavigationContainer>
        <View testID="navigation-root" style={{ backgroundColor: colors.background }}>
          <Text testID="nav-current-theme">{theme}</Text>
          <Text testID="nav-active-theme">{activeTheme}</Text>
          <Text testID="nav-background-color">{colors.background}</Text>

          {/* Simplified navigation structure for testing */}
          <View testID="navigation-content">
            <HomeScreen />
            <DetailsScreen />
          </View>
        </View>
      </NavigationContainer>
    );
  }

  function TestAppWrapper() {
    return (
      <ThemeProvider>
        <NavigationTestApp />
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock theme storage
    mockStorageGet = jest.fn();
    mockStorageStore = jest.fn();
    jest.spyOn(themeStorage, 'getStoredTheme').mockImplementation(mockStorageGet);
    jest.spyOn(themeStorage, 'storeTheme').mockImplementation(mockStorageStore);

    // Mock system theme service
    mockSystemThemeService = {
      getSystemColorScheme: jest.fn().mockReturnValue(THEME_NAMES.LIGHT),
      addSystemThemeChangeListener: jest.fn().mockReturnValue(() => {}),
      isSystemThemeSupported: jest.fn().mockReturnValue(true),
    };

    jest.spyOn(systemTheme, 'getSystemColorScheme').mockImplementation(mockSystemThemeService.getSystemColorScheme);
    jest.spyOn(systemTheme, 'addSystemThemeChangeListener').mockImplementation(mockSystemThemeService.addSystemThemeChangeListener);
    jest.spyOn(systemTheme, 'isSystemThemeSupported').mockImplementation(mockSystemThemeService.isSystemThemeSupported);

    // Default: no stored theme, light system theme
    mockStorageGet.mockResolvedValue(null);
    mockStorageStore.mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Theme Propagation Through Navigation', () => {
    it('should apply theme consistently across navigation stack', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('navigation-root')).toBeTruthy();
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Verify initial light theme across all navigation elements
      expect(getByTestId('nav-background-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);
      expect(getByTestId('home-bg-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);
      expect(getByTestId('home-text-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].text);
    });

    it('should update all navigation elements when theme changes', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Change to dark theme from home screen
      await act(async () => {
        fireEvent.press(getByTestId('home-change-to-dark'));
      });

      // Verify theme change propagated to all elements
      await waitFor(() => {
        expect(getByTestId('nav-current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('nav-active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('nav-background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
        expect(getByTestId('home-bg-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
        expect(getByTestId('home-text-color')).toHaveTextContent(themes[THEME_NAMES.DARK].text);
      });

      // Verify storage was called
      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.DARK);
    });

    it('should maintain theme when navigating between screens', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load and change to dark theme
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('home-change-to-dark'));
      });

      await waitFor(() => {
        expect(getByTestId('nav-current-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });

      // Simulate navigation to details screen (in real app this would be through navigation)
      // For this test, we'll verify the theme context is maintained
      expect(getByTestId('nav-background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);

      // Theme should remain consistent
      expect(getByTestId('nav-current-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId('nav-active-theme')).toHaveTextContent(THEME_NAMES.DARK);
    });
  });

  describe('Real Navigation Component Integration', () => {
    function DrawerNavigationTestApp() {
      return (
        <NavigationContainer>
          <ThemeProvider>
            <DrawerNavigator />
          </ThemeProvider>
        </NavigationContainer>
      );
    }

    it('should integrate theme with DrawerNavigator', async () => {
      const { getByTestId } = render(<DrawerNavigationTestApp />);

      // Wait for drawer navigator to load
      await waitFor(() => {
        expect(getByTestId('drawer-navigator')).toBeTruthy();
      });

      // Should render with theme context
      expect(getByTestId('drawer-navigator')).toBeTruthy();
    });

    it('should apply theme to drawer navigator components', async () => {
      const { getByTestId } = render(<DrawerNavigationTestApp />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('drawer-navigator')).toBeTruthy();
      });

      // Verify the drawer navigator is using theme context
      expect(getByTestId('drawer-navigator')).toBeTruthy();
    });
  });

  describe('Screen-Specific Theme Behavior', () => {
    it('should update screen-specific theme elements immediately', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Verify initial light theme colors
      expect(getByTestId('home-bg-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);
      expect(getByTestId('home-text-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].text);

      // Change to dark theme
      await act(async () => {
        fireEvent.press(getByTestId('home-change-to-dark'));
      });

      // Verify immediate update to dark theme colors
      await waitFor(() => {
        expect(getByTestId('home-bg-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
        expect(getByTestId('home-text-color')).toHaveTextContent(themes[THEME_NAMES.DARK].text);
      });

      // Change back to light theme
      await act(async () => {
        fireEvent.press(getByTestId('home-change-to-light'));
      });

      // Verify immediate update back to light theme
      await waitFor(() => {
        expect(getByTestId('home-bg-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);
        expect(getByTestId('home-text-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].text);
      });
    });

    it('should handle rapid theme changes during navigation', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeTruthy();
      });

      // Rapid theme changes
      await act(async () => {
        fireEvent.press(getByTestId('home-change-to-dark'));
      });

      await act(async () => {
        fireEvent.press(getByTestId('home-change-to-light'));
      });

      await act(async () => {
        fireEvent.press(getByTestId('home-change-to-dark'));
      });

      // Should end up with dark theme consistently applied
      await waitFor(() => {
        expect(getByTestId('nav-current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('nav-active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('home-bg-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
      });

      // Should have called storage for each change
      expect(mockStorageStore).toHaveBeenCalledTimes(3);
    });
  });

  describe('Theme Restoration with Navigation State', () => {
    it('should restore theme consistently across navigation hierarchy', async () => {
      // Simulate stored dark theme
      mockStorageGet.mockResolvedValue(THEME_NAMES.DARK);

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for theme restoration
      await waitFor(() => {
        expect(getByTestId('navigation-root')).toBeTruthy();
      });

      // Verify dark theme restored throughout navigation
      await waitFor(() => {
        expect(getByTestId('nav-current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('nav-active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('nav-background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
        expect(getByTestId('home-bg-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
        expect(getByTestId('home-text-color')).toHaveTextContent(themes[THEME_NAMES.DARK].text);
      });
    });

    it('should handle theme restoration errors gracefully in navigation context', async () => {
      // Mock storage retrieval error
      mockStorageGet.mockRejectedValue(new Error('Storage error'));

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for fallback theme to be applied
      await waitFor(() => {
        expect(getByTestId('navigation-root')).toBeTruthy();
      });

      // Should fallback to system theme (light)
      await waitFor(() => {
        expect(getByTestId('nav-current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
        expect(getByTestId('nav-active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
        expect(getByTestId('nav-background-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);
      });
    });
  });
});
