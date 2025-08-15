/**
 * Theme Persistence Integration Tests
 *
 * This integration test suite validates that theme choices persist across
 * app sessions through proper storage integration and initialization.
 * Tests the complete flow from initial load → theme change → storage → restart → persistence.
 */

import {
  render, fireEvent, waitFor, act, cleanup,
} from '@testing-library/react-native';
import {
  View, Text, TouchableOpacity,
} from 'react-native';

// Import theme modules
import {
  ThemeProvider, useTheme, useThemeColors,
} from '../../src/context/ThemeContext';
import { THEME_NAMES, themes } from '../../src/design-system/themes';
import * as themeStorage from '../../src/services/themeStorage';
import * as systemTheme from '../../src/services/systemTheme';

// Mock React Native globals
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

describe('Theme Persistence Integration', () => {
  let mockStorageGet;
  let mockStorageStore;
  let mockSystemThemeService;

  // Test component that displays theme info and allows changes
  function ThemePersistenceTestApp() {
    const {
      theme, activeTheme, changeTheme, isLoading,
    } = useTheme();
    const colors = useThemeColors();

    if (isLoading) {
      return (
        <View testID="loading-state">
          <Text>Loading...</Text>
        </View>
      );
    }

    return (
      <View testID="theme-app" style={{ backgroundColor: colors.background }}>
        <Text testID="current-theme">{theme}</Text>
        <Text testID="active-theme">{activeTheme}</Text>
        <Text testID="background-color">{colors.background}</Text>
        <Text testID="primary-color">{colors.primary}</Text>
        <TouchableOpacity
          testID="set-light-theme"
          onPress={() => changeTheme(THEME_NAMES.LIGHT)}
        >
          <Text>Light Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="set-dark-theme"
          onPress={() => changeTheme(THEME_NAMES.DARK)}
        >
          <Text>Dark Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="set-system-theme"
          onPress={() => changeTheme(THEME_NAMES.SYSTEM)}
        >
          <Text>System Theme</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function TestAppWrapper() {
    return (
      <ThemeProvider>
        <ThemePersistenceTestApp />
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

    // Default: no stored theme (fresh install)
    mockStorageGet.mockResolvedValue(null);
    mockStorageStore.mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Fresh App Install - No Stored Theme', () => {
    it('should start with system theme as default on fresh install', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Should start with loading
      expect(getByTestId('loading-state')).toBeTruthy();

      // Wait for theme to load
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Should default to system theme
      expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
      expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);

      // Should not store anything on initial load
      expect(mockStorageStore).not.toHaveBeenCalled();
    });

    it('should store theme when user makes first manual selection', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // User selects dark theme
      await act(async () => {
        fireEvent.press(getByTestId('set-dark-theme'));
      });

      // Should update theme
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });

      // Should store the selection
      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.DARK);
      expect(mockStorageStore).toHaveBeenCalledTimes(1);
    });
  });

  describe('App Restart - Theme Persistence', () => {
    it('should restore light theme from storage on app restart', async () => {
      // Simulate stored light theme
      mockStorageGet.mockResolvedValue(THEME_NAMES.LIGHT);

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for theme to load from storage
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Should restore light theme
      expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
      expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
      expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.LIGHT].background);

      // Should have called storage to retrieve
      expect(mockStorageGet).toHaveBeenCalled();
    });

    it('should restore dark theme from storage on app restart', async () => {
      // Simulate stored dark theme
      mockStorageGet.mockResolvedValue(THEME_NAMES.DARK);

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for theme to load from storage
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Should restore dark theme
      expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
      expect(getByTestId('primary-color')).toHaveTextContent(themes[THEME_NAMES.DARK].primary);
    });

    it('should restore system theme preference from storage', async () => {
      // Simulate stored system theme preference
      mockStorageGet.mockResolvedValue(THEME_NAMES.SYSTEM);
      mockSystemThemeService.getSystemColorScheme.mockReturnValue(THEME_NAMES.DARK);

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for theme to load from storage
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Should restore system theme preference and resolve to current system theme
      expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
    });
  });

  describe('Theme Changes with Storage', () => {
    it('should persist multiple theme changes in sequence', async () => {
      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Change to light theme
      await act(async () => {
        fireEvent.press(getByTestId('set-light-theme'));
      });

      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
      });

      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.LIGHT);

      // Change to dark theme
      await act(async () => {
        fireEvent.press(getByTestId('set-dark-theme'));
      });

      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });

      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.DARK);

      // Change to system theme
      await act(async () => {
        fireEvent.press(getByTestId('set-system-theme'));
      });

      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      });

      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.SYSTEM);

      // Should have called storage for each change
      expect(mockStorageStore).toHaveBeenCalledTimes(3);
    });

    it('should continue functioning when storage fails', async () => {
      // Mock storage failure
      mockStorageStore.mockRejectedValue(new Error('Storage unavailable'));

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Change theme despite storage failure
      await act(async () => {
        fireEvent.press(getByTestId('set-dark-theme'));
      });

      // Theme should still change in memory
      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);
      });

      // Storage should have been attempted
      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.DARK);
    });
  });

  describe('Invalid Stored Data Handling', () => {
    it('should fallback to system theme when stored theme is invalid', async () => {
      // Simulate invalid stored theme
      mockStorageGet.mockResolvedValue('invalid-theme');

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for theme to load
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Should fallback to system theme default
      expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
    });

    it('should handle storage retrieval errors gracefully', async () => {
      // Mock storage retrieval error
      mockStorageGet.mockRejectedValue(new Error('Storage read failed'));

      const { getByTestId } = render(<TestAppWrapper />);

      // Wait for theme to load
      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // Should fallback to system theme default
      expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);
    });
  });

  describe('Complete Persistence Flow', () => {
    it('should simulate complete app lifecycle with theme persistence', async () => {
      // Scenario: User opens app, changes theme, restarts app

      // Step 1: First app session - user changes to dark theme
      mockStorageGet.mockResolvedValue(null); // Fresh install

      const { getByTestId, unmount } = render(<TestAppWrapper />);

      await waitFor(() => {
        expect(getByTestId('theme-app')).toBeTruthy();
      });

      // User selects dark theme
      await act(async () => {
        fireEvent.press(getByTestId('set-dark-theme'));
      });

      await waitFor(() => {
        expect(getByTestId('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });

      expect(mockStorageStore).toHaveBeenCalledWith(THEME_NAMES.DARK);

      // Simulate app close
      unmount();

      // Step 2: Second app session - should restore dark theme
      jest.clearAllMocks();
      mockStorageGet.mockResolvedValue(THEME_NAMES.DARK); // Stored from previous session
      mockStorageStore.mockResolvedValue();

      const { getByTestId: getByTestId2 } = render(<TestAppWrapper />);

      await waitFor(() => {
        expect(getByTestId2('theme-app')).toBeTruthy();
      });

      // Should restore dark theme from storage
      expect(getByTestId2('current-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId2('active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId2('background-color')).toHaveTextContent(themes[THEME_NAMES.DARK].background);

      // Should have retrieved from storage
      expect(mockStorageGet).toHaveBeenCalled();

      // Should not store again on load (only on change)
      expect(mockStorageStore).not.toHaveBeenCalled();
    });
  });
});
