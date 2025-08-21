/**
 * Cross-Component Theme Integration Tests - Simplified
 *
 * Basic integration test to validate theme consistency across components
 * without complex render management that causes test renderer conflicts
 */

import {
  fireEvent, waitFor, act, cleanup,
} from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { renderWithTheme } from './testUtils';

// Import theme modules
import { ThemeProvider, useTheme, useThemeColors } from '../../src/context/ThemeContext';
import { THEME_NAMES, themes } from '../../src/design-system/themes';
import * as themeStorage from '../../src/services/themeStorage';
import * as systemTheme from '../../src/services/systemTheme';

// Mock vector icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Mock theme services
jest.mock('../../src/services/themeStorage');
jest.mock('../../src/services/systemTheme');

describe('Cross-Component Theme Integration - Simplified', () => {
  let mockStorageGet;
  let mockStorageStore;
  let mockSystemThemeService;

  // Component that displays theme colors
  function ThemeColorDisplay({ testId }) {
    const colors = useThemeColors();
    return (
      <View testID={`color-display-${testId}`}>
        <Text testID={`${testId}-background`}>{colors.background}</Text>
        <Text testID={`${testId}-primary`}>{colors.primary}</Text>
        <Text testID={`${testId}-text`}>{colors.text}</Text>
      </View>
    );
  }

  // Component that uses theme context
  function ThemeContextDisplay({ testId }) {
    const { theme, activeTheme } = useTheme();
    return (
      <View testID={`context-display-${testId}`}>
        <Text testID={`${testId}-theme`}>{theme}</Text>
        <Text testID={`${testId}-active-theme`}>{activeTheme}</Text>
      </View>
    );
  }

  // Component that can change themes
  function ThemeController({ testId }) {
    const { changeTheme } = useTheme();
    return (
      <View testID={`controller-${testId}`}>
        <TouchableOpacity
          testID={`${testId}-set-dark`}
          onPress={() => changeTheme(THEME_NAMES.DARK)}
        >
          <Text>Dark</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`${testId}-set-light`}
          onPress={() => changeTheme(THEME_NAMES.LIGHT)}
        >
          <Text>Light</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Combined test app
  function CrossComponentTestApp() {
    const colors = useThemeColors();
    return (
      <View testID="cross-component-app" style={{ backgroundColor: colors.background }}>
        <Text testID="app-background-color">{colors.background}</Text>
        <ThemeColorDisplay testId="comp1" />
        <ThemeColorDisplay testId="comp2" />
        <ThemeContextDisplay testId="comp1" />
        <ThemeController testId="comp1" />
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

    // Default: no stored theme, light system theme
    mockStorageGet.mockResolvedValue(null);
    mockStorageStore.mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Multiple Component Theme Consistency', () => {
    it('should apply theme consistently across multiple components', async () => {
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <CrossComponentTestApp />
        </ThemeProvider>,
      );

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('cross-component-app')).toBeTruthy();
      });

      // Verify all components start with consistent light theme
      const lightTheme = themes[THEME_NAMES.LIGHT];
      expect(getByTestId('comp1-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('comp2-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('comp1-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
    });

    it('should update all components simultaneously when theme changes', async () => {
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <CrossComponentTestApp />
        </ThemeProvider>,
      );

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('cross-component-app')).toBeTruthy();
      });

      // Change theme from one component
      await act(async () => {
        fireEvent.press(getByTestId('comp1-set-dark'));
      });

      // Verify all components updated simultaneously
      const darkTheme = themes[THEME_NAMES.DARK];
      await waitFor(() => {
        expect(getByTestId('comp1-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('comp2-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('comp1-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('app-background-color')).toHaveTextContent(darkTheme.background);
      });
    });

    it('should maintain consistency with all color properties', async () => {
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <CrossComponentTestApp />
        </ThemeProvider>,
      );

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('cross-component-app')).toBeTruthy();
      });

      // Change to dark theme
      await act(async () => {
        fireEvent.press(getByTestId('comp1-set-dark'));
      });

      // Verify all color properties are consistent across components
      const darkTheme = themes[THEME_NAMES.DARK];
      await waitFor(() => {
        ['comp1', 'comp2'].forEach((comp) => {
          expect(getByTestId(`${comp}-background`)).toHaveTextContent(darkTheme.background);
          expect(getByTestId(`${comp}-primary`)).toHaveTextContent(darkTheme.primary);
          expect(getByTestId(`${comp}-text`)).toHaveTextContent(darkTheme.text);
        });
      });
    });

    it('should handle rapid theme changes consistently', async () => {
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <CrossComponentTestApp />
        </ThemeProvider>,
      );

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('cross-component-app')).toBeTruthy();
      });

      // Rapid theme changes
      await act(async () => {
        fireEvent.press(getByTestId('comp1-set-dark'));
      });

      await act(async () => {
        fireEvent.press(getByTestId('comp1-set-light'));
      });

      await act(async () => {
        fireEvent.press(getByTestId('comp1-set-dark'));
      });

      // Verify final state is consistent across all components
      const darkTheme = themes[THEME_NAMES.DARK];
      await waitFor(() => {
        expect(getByTestId('comp1-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('comp2-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('comp1-active-theme')).toHaveTextContent(THEME_NAMES.DARK);
      });
    });
  });

  describe('System Theme Changes Across Components', () => {
    it('should propagate system theme changes to all components', async () => {
      // Start with system theme
      mockStorageGet.mockResolvedValue(THEME_NAMES.SYSTEM);

      let systemChangeCallback;
      mockSystemThemeService.addSystemThemeChangeListener.mockImplementation((callback) => {
        systemChangeCallback = callback;
        return () => {};
      });

      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <CrossComponentTestApp />
        </ThemeProvider>,
      );

      // Wait for components to load with light system theme
      await waitFor(() => {
        expect(getByTestId('cross-component-app')).toBeTruthy();
      });

      // Verify initial light theme across all components
      const lightTheme = themes[THEME_NAMES.LIGHT];
      expect(getByTestId('comp1-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('comp2-background')).toHaveTextContent(lightTheme.background);

      // Simulate system theme change to dark
      await act(() => {
        systemChangeCallback(THEME_NAMES.DARK);
      });

      // Verify all components updated to dark theme
      const darkTheme = themes[THEME_NAMES.DARK];
      await waitFor(() => {
        expect(getByTestId('comp1-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('comp2-background')).toHaveTextContent(darkTheme.background);
      });
    });
  });

  describe('Theme Context Error Handling', () => {
    it('should handle theme context errors gracefully across components', async () => {
      // Mock storage error
      mockStorageGet.mockRejectedValue(new Error('Storage failed'));

      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <CrossComponentTestApp />
        </ThemeProvider>,
      );

      // Should still render with fallback theme
      await waitFor(() => {
        expect(getByTestId('cross-component-app')).toBeTruthy();
      });

      // All components should use fallback theme
      const lightTheme = themes[THEME_NAMES.LIGHT];
      expect(getByTestId('comp1-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('comp2-background')).toHaveTextContent(lightTheme.background);
    });

    it('should continue functioning when storage operations fail during theme changes', async () => {
      const { getByTestId } = await renderWithTheme(
        <ThemeProvider>
          <CrossComponentTestApp />
        </ThemeProvider>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('cross-component-app')).toBeTruthy();
      });

      // Mock storage failure for theme change
      mockStorageStore.mockRejectedValue(new Error('Storage write failed'));

      // Change theme despite storage failure
      await act(async () => {
        fireEvent.press(getByTestId('comp1-set-dark'));
      });

      // Theme should still change across all components
      const darkTheme = themes[THEME_NAMES.DARK];
      await waitFor(() => {
        expect(getByTestId('comp1-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('comp2-background')).toHaveTextContent(darkTheme.background);
      });
    });
  });
});
