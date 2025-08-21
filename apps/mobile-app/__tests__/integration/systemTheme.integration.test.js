/**
 * System Theme Integration Tests - Simplified
 *
 * Basic integration test to validate system theme functionality
 * without complex render management that causes test renderer conflicts
 */

import {
  fireEvent, waitFor, act, cleanup,
} from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { renderWithTheme } from './testUtils';

// Import theme modules
import { useTheme, useThemeColors } from '../../src/context/ThemeContext';
import { THEME_NAMES, themes } from '../../src/design-system/themes';
import * as themeStorage from '../../src/services/themeStorage';
import * as systemTheme from '../../src/services/systemTheme';

// Mock vector icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Mock theme services
jest.mock('../../src/services/themeStorage');
jest.mock('../../src/services/systemTheme');

describe('System Theme Integration - Simplified', () => {
  let mockStorageGet;
  let mockStorageStore;
  let mockSystemThemeService;

  // Simple test component
  function TestThemeConsumer() {
    const { theme, activeTheme, changeTheme } = useTheme();
    const colors = useThemeColors();

    return (
      <View testID="theme-consumer">
        <Text testID="current-theme">{theme}</Text>
        <Text testID="active-theme">{activeTheme}</Text>
        <Text testID="background-color">{colors.background}</Text>
        <TouchableOpacity
          testID="change-to-dark"
          onPress={() => changeTheme(THEME_NAMES.DARK)}
        >
          <Text>Dark</Text>
        </TouchableOpacity>
      </View>
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

    // Default mocks
    mockStorageGet.mockResolvedValue(null);
    mockStorageStore.mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic System Theme Integration', () => {
    it('should start with system theme as default', async () => {
      const { getByTestId } = await renderWithTheme(<TestThemeConsumer />, { testStorage: true });

      // Wait for initial load
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
      const { getByTestId } = await renderWithTheme(<TestThemeConsumer />, { testStorage: true });

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

    it('should handle system theme changes', async () => {
      let systemChangeCallback;
      mockSystemThemeService.addSystemThemeChangeListener.mockImplementation((callback) => {
        systemChangeCallback = callback;
        return () => {};
      });

      const { getByTestId } = await renderWithTheme(<TestThemeConsumer />, { testStorage: true });

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
  });

  describe('Error Handling Integration', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      mockStorageStore.mockRejectedValue(new Error('Storage failed'));

      const { getByTestId } = await renderWithTheme(<TestThemeConsumer />, { testStorage: true });

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

      const { getByTestId } = await renderWithTheme(<TestThemeConsumer />, { testStorage: true });

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
});
