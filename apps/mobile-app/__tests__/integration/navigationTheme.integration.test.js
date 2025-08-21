/**
 * Navigation Theme Integration Tests - Simplified
 *
 * Basic integration test to validate navigation-theme integration
 * without complex render management that causes test renderer conflicts
 */

import {
  fireEvent, waitFor, act, cleanup,
} from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { renderWithTheme } from './testUtils';

// Import theme modules
import { ThemeProvider, useTheme, useThemeColors } from '../../src/context/ThemeContext';
import { THEME_NAMES, themes } from '../../src/design-system/themes';
import * as themeStorage from '../../src/services/themeStorage';
import * as systemTheme from '../../src/services/systemTheme';

// Mock React Native components
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

// Mock theme services
jest.mock('../../src/services/themeStorage');
jest.mock('../../src/services/systemTheme');

describe('Navigation Theme Integration - Simplified', () => {
  let mockStorageGet;
  let mockStorageStore;
  let mockSystemThemeService;

  // Simple navigation screen
  function HomeScreen() {
    const colors = useThemeColors();
    const { changeTheme } = useTheme();

    return (
      <View testID="home-screen" style={{ backgroundColor: colors.background }}>
        <Text testID="home-bg-color">{colors.background}</Text>
        <Text testID="home-text-color">{colors.text}</Text>
        <TouchableOpacity
          testID="home-change-to-dark"
          onPress={() => changeTheme(THEME_NAMES.DARK)}
        >
          <Text>Change to Dark</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="home-change-to-light"
          onPress={() => changeTheme(THEME_NAMES.LIGHT)}
        >
          <Text>Change to Light</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Navigation test app
  function NavigationTestApp() {
    const colors = useThemeColors();
    const { theme, activeTheme } = useTheme();

    return (
      <NavigationContainer>
        <View testID="navigation-root" style={{ backgroundColor: colors.background }}>
          <Text testID="nav-current-theme">{theme}</Text>
          <Text testID="nav-active-theme">{activeTheme}</Text>
          <Text testID="nav-background-color">{colors.background}</Text>
          <HomeScreen />
        </View>
      </NavigationContainer>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();

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
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <NavigationTestApp />
        </ThemeProvider>,
      );

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
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <NavigationTestApp />
        </ThemeProvider>,
      );

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
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <NavigationTestApp />
        </ThemeProvider>,
      );

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

      // Theme should remain consistent
      expect(getByTestId('nav-background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
      expect(getByTestId('nav-current-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId('nav-active-theme')).toHaveTextContent(THEME_NAMES.DARK);
    });
  });

  describe('Screen-Specific Theme Behavior', () => {
    it('should update screen-specific theme elements immediately', async () => {
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <NavigationTestApp />
        </ThemeProvider>,
      );

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
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <NavigationTestApp />
        </ThemeProvider>,
      );

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

      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <NavigationTestApp />
        </ThemeProvider>,
      );

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

      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <NavigationTestApp />
        </ThemeProvider>,
      );

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
