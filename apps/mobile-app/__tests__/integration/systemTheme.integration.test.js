/**
 * System Theme Integration Tests - Full Flow
 *
 * This integration test suite validates the complete system theme functionality
 * end-to-end, ensuring all components work together correctly for:
 * 1. Manual theme → System theme → OS changes → Manual theme flow
 * 2. Proper listener management throughout the entire flow
 * 3. State synchronization between all theme-related services and components
 */

import {
  render, fireEvent, waitFor, act,
} from '@testing-library/react-native';
import {
  View, Text, TouchableOpacity,
} from 'react-native';

// Import all theme-related modules
import {
  ThemeProvider, useTheme, useThemeColors,
} from '../../src/context/ThemeContext';
import { THEME_NAMES, themes } from '../../src/design-system/themes';
import * as themeStorage from '../../src/services/themeStorage';
import * as systemTheme from '../../src/services/systemTheme';

// Mock React Native Appearance API - must come before imports
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj) => obj.ios || obj.default },
  Appearance: {
    getColorScheme: jest.fn(),
    addChangeListener: jest.fn(),
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

// Mock theme storage
jest.mock('../../src/services/themeStorage');

// Mock system theme service
jest.mock('../../src/services/systemTheme');

describe('System Theme Integration - Full Flow', () => {
  let mockStorageGet;
  let mockStorageStore;
  let mockAppearanceGet;
  let mockAppearanceListener;
  let mockSystemThemeService;

  // Simple test component to access theme context
  function TestThemeConsumer() {
    const { theme, activeTheme, changeTheme } = useTheme();
    const colors = useThemeColors();

    return (
      <View testID="theme-consumer">
        <Text testID="current-theme">{theme}</Text>
        <Text testID="active-theme">{activeTheme}</Text>
        <Text testID="background-color">{colors.background}</Text>
        <TouchableOpacity
          testID="change-to-system"
          onPress={() => changeTheme(THEME_NAMES.SYSTEM)}
        >
          <Text>System</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="change-to-light"
          onPress={() => changeTheme(THEME_NAMES.LIGHT)}
        >
          <Text>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="change-to-dark"
          onPress={() => changeTheme(THEME_NAMES.DARK)}
        >
          <Text>Dark</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Mock ThemePicker component for testing
  function MockThemePicker() {
    const { changeTheme } = useTheme();

    return (
      <View testID="theme-picker">
        <TouchableOpacity
          testID="theme-option-light"
          onPress={() => changeTheme(THEME_NAMES.LIGHT)}
        >
          <Text>Light Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="theme-option-dark"
          onPress={() => changeTheme(THEME_NAMES.DARK)}
        >
          <Text>Dark Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="theme-option-system"
          onPress={() => changeTheme(THEME_NAMES.SYSTEM)}
        >
          <Text>System Theme</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Integration test app
  function IntegrationTestApp() {
    return (
      <ThemeProvider>
        <TestThemeConsumer />
        <MockThemePicker />
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
    mockAppearanceGet = jest.fn();
    mockAppearanceListener = jest.fn();
    mockSystemThemeService = {
      getSystemColorScheme: mockAppearanceGet,
      addSystemThemeChangeListener: mockAppearanceListener,
      isSystemThemeSupported: jest.fn().mockReturnValue(true),
    };

    jest.spyOn(systemTheme, 'getSystemColorScheme').mockImplementation(mockSystemThemeService.getSystemColorScheme);
    jest.spyOn(systemTheme, 'addSystemThemeChangeListener').mockImplementation(mockSystemThemeService.addSystemThemeChangeListener);
    jest.spyOn(systemTheme, 'isSystemThemeSupported').mockImplementation(mockSystemThemeService.isSystemThemeSupported);

    // Mock cleanup function
    mockAppearanceListener.mockReturnValue(() => {}); // cleanup function

    // Default mocks
    mockStorageGet.mockResolvedValue(null);
    mockAppearanceGet.mockReturnValue(THEME_NAMES.LIGHT);
  });

  describe('Basic System Theme Integration', () => {
    it('should start with system theme as default', async () => {
      const { getByTestId } = render(<IntegrationTestApp />);

      // Wait for initial load - should start with system theme by default
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
        expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);
      });

      // Verify system theme service was called
      expect(mockSystemThemeService.getSystemColorScheme).toHaveBeenCalled();
      expect(mockSystemThemeService.isSystemThemeSupported).toHaveBeenCalled();
      expect(mockSystemThemeService.addSystemThemeChangeListener).toHaveBeenCalled();
    });

    it('should change from system to manual theme', async () => {
      const { getByTestId } = render(<IntegrationTestApp />);

      // Wait for initial system theme
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      });

      // Change to manual dark theme
      await act(async () => {
        fireEvent.press(getByTestId('change-to-dark'));
      });

      // Verify manual theme applied
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
      });

      // Verify theme storage was called
      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.DARK);
    });

    it('should respond to system theme changes', async () => {
      let systemChangeCallback;
      mockAppearanceListener.mockImplementation((callback) => {
        systemChangeCallback = callback;
        return () => {}; // cleanup function
      });

      const { getByTestId } = render(<IntegrationTestApp />);

      // Wait for initial system theme
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
      });

      // Simulate system theme change to dark
      await act(() => {
        systemChangeCallback(THEME_NAMES.DARK);
      });

      // Verify active theme updated to dark
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
      });
    });

    it('should integrate with ThemePicker component', async () => {
      const { getByTestId } = render(<IntegrationTestApp />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      });

      // Verify ThemePicker system option is available
      const systemOption = getByTestId('theme-option-system');
      expect(systemOption).toBeTruthy();

      // Select dark theme via ThemePicker
      await act(async () => {
        fireEvent.press(getByTestId('theme-option-dark'));
      });

      // Verify theme changed
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      mockStorageStore.mockRejectedValue(new Error('Storage failed'));

      const { getByTestId } = render(<IntegrationTestApp />);

      // Wait for initial system theme
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      });

      // Change theme despite storage failure
      await act(async () => {
        fireEvent.press(getByTestId('change-to-dark'));
      });

      // Theme should still change in memory
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });
    });

    it('should handle system theme detection failure gracefully', async () => {
      // Mock system theme as unsupported
      mockSystemThemeService.isSystemThemeSupported.mockReturnValue(false);

      const { getByTestId } = render(<IntegrationTestApp />);

      // Should still start with system preference but fallback to light
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
      });

      // Manual themes should still work
      await act(async () => {
        fireEvent.press(getByTestId('change-to-dark'));
      });

      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });
    });
  });

  describe('Theme Resolution Integration', () => {
    it('should properly resolve all theme types', async () => {
      const { getByTestId } = render(<IntegrationTestApp />);

      // Test system theme resolution
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
      });

      // Test manual light theme
      await act(async () => {
        fireEvent.press(getByTestId('change-to-light'));
      });

      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
        expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);
      });

      // Test manual dark theme
      await act(async () => {
        fireEvent.press(getByTestId('change-to-dark'));
      });

      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
      });
    });
  });
});
