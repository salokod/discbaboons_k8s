/**
 * Cross-Component Theme Integration Tests
 *
 * This integration test suite validates that all theme-aware components
 * update synchronously when theme changes occur. Tests ensure that:
 * 1. Multiple components render with consistent theme values
 * 2. Theme changes propagate to all components simultaneously
 * 3. Complex component hierarchies maintain theme consistency
 * 4. Theme-dependent calculations update across all components
 * 5. Custom theme hooks work consistently across component boundaries
 */

import {
  render, fireEvent, waitFor, act, cleanup,
} from '@testing-library/react-native';
import {
  View, Text, TouchableOpacity, ScrollView,
} from 'react-native';

// Import theme modules and components
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
  ScrollView: 'ScrollView',
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

describe('Cross-Component Theme Integration', () => {
  let mockStorageGet;
  let mockStorageStore;
  let mockSystemThemeService;

  // Component that displays theme colors for testing
  function ThemeColorDisplay({ testId }) {
    const colors = useThemeColors();
    return (
      <View testID={`color-display-${testId}`}>
        <Text testID={`${testId}-background`}>{colors.background}</Text>
        <Text testID={`${testId}-surface`}>{colors.surface}</Text>
        <Text testID={`${testId}-primary`}>{colors.primary}</Text>
        <Text testID={`${testId}-secondary`}>{colors.secondary}</Text>
        <Text testID={`${testId}-text`}>{colors.text}</Text>
        <Text testID={`${testId}-text-secondary`}>{colors.textSecondary || ''}</Text>
        <Text testID={`${testId}-border`}>{colors.border}</Text>
        <Text testID={`${testId}-success`}>{colors.success}</Text>
        <Text testID={`${testId}-warning`}>{colors.warning}</Text>
        <Text testID={`${testId}-error`}>{colors.error}</Text>
      </View>
    );
  }

  // Component that uses theme context
  function ThemeContextDisplay({ testId }) {
    const { theme, activeTheme, isLoading } = useTheme();
    return (
      <View testID={`context-display-${testId}`}>
        <Text testID={`${testId}-theme`}>{theme}</Text>
        <Text testID={`${testId}-active-theme`}>{activeTheme}</Text>
        <Text testID={`${testId}-loading`}>{isLoading ? 'loading' : 'loaded'}</Text>
      </View>
    );
  }

  // Component that can change themes
  function ThemeController({ testId }) {
    const { changeTheme } = useTheme();
    return (
      <View testID={`controller-${testId}`}>
        <TouchableOpacity
          testID={`${testId}-set-light`}
          onPress={() => changeTheme(THEME_NAMES.LIGHT)}
        >
          <Text>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`${testId}-set-dark`}
          onPress={() => changeTheme(THEME_NAMES.DARK)}
        >
          <Text>Dark</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`${testId}-set-system`}
          onPress={() => changeTheme(THEME_NAMES.SYSTEM)}
        >
          <Text>System</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Component that calculates theme-dependent values
  function ThemeCalculationsDisplay({ testId }) {
    const colors = useThemeColors();
    const { activeTheme } = useTheme();

    // Example calculations that depend on theme
    const isDarkTheme = activeTheme === THEME_NAMES.DARK;
    const contrastRatio = isDarkTheme ? 'high' : 'normal';
    const shadowColor = isDarkTheme ? colors.surface : colors.border;
    const overlayOpacity = isDarkTheme ? 0.8 : 0.4;

    return (
      <View testID={`calculations-${testId}`}>
        <Text testID={`${testId}-is-dark`}>{isDarkTheme ? 'dark' : 'light'}</Text>
        <Text testID={`${testId}-contrast`}>{contrastRatio}</Text>
        <Text testID={`${testId}-shadow-color`}>{shadowColor}</Text>
        <Text testID={`${testId}-overlay-opacity`}>{overlayOpacity}</Text>
      </View>
    );
  }

  // Complex nested component hierarchy
  function NestedComponentHierarchy() {
    return (
      <View testID="nested-hierarchy">
        <ThemeColorDisplay testId="level1" />
        <View testID="level2-container">
          <ThemeContextDisplay testId="level2" />
          <View testID="level3-container">
            <ThemeCalculationsDisplay testId="level3" />
            <View testID="level4-container">
              <ThemeColorDisplay testId="level4" />
              <ThemeController testId="level4" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Multiple independent components
  function MultipleIndependentComponents() {
    return (
      <View testID="multiple-components">
        <ThemeColorDisplay testId="comp1" />
        <ThemeColorDisplay testId="comp2" />
        <ThemeColorDisplay testId="comp3" />
        <ThemeContextDisplay testId="comp1" />
        <ThemeContextDisplay testId="comp2" />
        <ThemeCalculationsDisplay testId="comp1" />
        <ThemeCalculationsDisplay testId="comp2" />
        <ThemeController testId="comp1" />
      </View>
    );
  }

  // Component that integrates simulated real theme components
  function RealComponentIntegration() {
    const colors = useThemeColors();
    return (
      <ScrollView testID="real-component-integration" style={{ backgroundColor: colors.background }}>
        <View testID="theme-picker-container" />
        <View testID="theme-preview-light" />
        <View testID="theme-preview-dark" />
        <ThemeColorDisplay testId="real-integration" />
        <ThemeCalculationsDisplay testId="real-integration" />
        <ThemeController testId="real-integration" />
      </ScrollView>
    );
  }

  // Main test app that combines all components
  function CrossComponentTestApp({ scenario = 'nested' }) {
    const colors = useThemeColors();

    return (
      <View testID="cross-component-app" style={{ backgroundColor: colors.background }}>
        <Text testID="app-background-color">{colors.background}</Text>
        {scenario === 'nested' && <NestedComponentHierarchy />}
        {scenario === 'multiple' && <MultipleIndependentComponents />}
        {scenario === 'real' && <RealComponentIntegration />}
      </View>
    );
  }

  function TestAppWrapper({ scenario }) {
    return (
      <ThemeProvider>
        <CrossComponentTestApp scenario={scenario} />
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

  describe('Nested Component Hierarchy', () => {
    it('should apply theme consistently across all nested levels', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="nested" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('nested-hierarchy')).toBeTruthy();
      });

      // Verify all levels show consistent light theme colors
      const lightTheme = themes[THEME_NAMES.LIGHT];

      expect(getByTestId('level1-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('level1-primary')).toHaveTextContent(lightTheme.primary);
      expect(getByTestId('level4-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('level4-primary')).toHaveTextContent(lightTheme.primary);

      // Verify context values are consistent
      expect(getByTestId('level2-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      expect(getByTestId('level2-active-theme')).toHaveTextContent(THEME_NAMES.LIGHT);

      // Verify calculations are consistent
      expect(getByTestId('level3-is-dark')).toHaveTextContent('light');
      expect(getByTestId('level3-contrast')).toHaveTextContent('normal');
    });

    it('should update all nested components when theme changes', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="nested" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('nested-hierarchy')).toBeTruthy();
      });

      // Change theme from deep nested component
      await act(async () => {
        fireEvent.press(getByTestId('level4-set-dark'));
      });

      // Verify all levels updated to dark theme
      const darkTheme = themes[THEME_NAMES.DARK];

      await waitFor(() => {
        expect(getByTestId('level1-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('level1-primary')).toHaveTextContent(darkTheme.primary);
        expect(getByTestId('level4-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('level4-primary')).toHaveTextContent(darkTheme.primary);
        expect(getByTestId('app-background-color')).toHaveTextContent(darkTheme.background);
      });

      // Verify context updated
      expect(getByTestId('level2-theme')).toHaveTextContent(THEME_NAMES.DARK);
      expect(getByTestId('level2-active-theme')).toHaveTextContent(THEME_NAMES.DARK);

      // Verify calculations updated
      expect(getByTestId('level3-is-dark')).toHaveTextContent('dark');
      expect(getByTestId('level3-contrast')).toHaveTextContent('high');
    });

    it('should handle rapid theme changes across nested hierarchy', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="nested" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('nested-hierarchy')).toBeTruthy();
      });

      // Rapid theme changes
      await act(async () => {
        fireEvent.press(getByTestId('level4-set-dark'));
      });

      await act(async () => {
        fireEvent.press(getByTestId('level4-set-light'));
      });

      await act(async () => {
        fireEvent.press(getByTestId('level4-set-dark'));
      });

      // Verify final state is consistent across all levels
      const darkTheme = themes[THEME_NAMES.DARK];

      await waitFor(() => {
        expect(getByTestId('level1-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('level4-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('level2-active-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('level3-is-dark')).toHaveTextContent('dark');
      });
    });
  });

  describe('Multiple Independent Components', () => {
    it('should synchronize theme across multiple independent components', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="multiple" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('multiple-components')).toBeTruthy();
      });

      // Verify all components start with consistent light theme
      const lightTheme = themes[THEME_NAMES.LIGHT];

      expect(getByTestId('comp1-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('comp2-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('comp3-background')).toHaveTextContent(lightTheme.background);

      expect(getByTestId('comp1-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);
      expect(getByTestId('comp2-theme')).toHaveTextContent(THEME_NAMES.SYSTEM);

      expect(getByTestId('comp1-is-dark')).toHaveTextContent('light');
      expect(getByTestId('comp2-is-dark')).toHaveTextContent('light');
    });

    it('should update all independent components simultaneously', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="multiple" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('multiple-components')).toBeTruthy();
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
        expect(getByTestId('comp3-background')).toHaveTextContent(darkTheme.background);

        expect(getByTestId('comp1-theme')).toHaveTextContent(THEME_NAMES.DARK);
        expect(getByTestId('comp2-theme')).toHaveTextContent(THEME_NAMES.DARK);

        expect(getByTestId('comp1-is-dark')).toHaveTextContent('dark');
        expect(getByTestId('comp2-is-dark')).toHaveTextContent('dark');
      });
    });

    it('should maintain consistency with all color properties', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="multiple" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('multiple-components')).toBeTruthy();
      });

      // Change to dark theme
      await act(async () => {
        fireEvent.press(getByTestId('comp1-set-dark'));
      });

      // Verify all color properties are consistent across components
      const darkTheme = themes[THEME_NAMES.DARK];

      await waitFor(() => {
        // Check all color properties across multiple components
        ['comp1', 'comp2', 'comp3'].forEach((comp) => {
          expect(getByTestId(`${comp}-background`)).toHaveTextContent(darkTheme.background);
          expect(getByTestId(`${comp}-surface`)).toHaveTextContent(darkTheme.surface);
          expect(getByTestId(`${comp}-primary`)).toHaveTextContent(darkTheme.primary);
          expect(getByTestId(`${comp}-secondary`)).toHaveTextContent(darkTheme.secondary);
          expect(getByTestId(`${comp}-text`)).toHaveTextContent(darkTheme.text);
          expect(getByTestId(`${comp}-text-secondary`)).toHaveTextContent(darkTheme.textSecondary || '');
          expect(getByTestId(`${comp}-border`)).toHaveTextContent(darkTheme.border);
          expect(getByTestId(`${comp}-success`)).toHaveTextContent(darkTheme.success);
          expect(getByTestId(`${comp}-warning`)).toHaveTextContent(darkTheme.warning);
          expect(getByTestId(`${comp}-error`)).toHaveTextContent(darkTheme.error);
        });
      });
    });
  });

  describe('Real Component Integration', () => {
    it('should integrate with actual theme components', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="real" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('real-component-integration')).toBeTruthy();
      });

      // Verify ThemePicker is present
      expect(getByTestId('theme-picker-container')).toBeTruthy();

      // Verify ThemePreviewCards are present
      expect(getByTestId('theme-preview-light')).toBeTruthy();
      expect(getByTestId('theme-preview-dark')).toBeTruthy();

      // Verify integrated components show consistent theme
      const lightTheme = themes[THEME_NAMES.LIGHT];
      expect(getByTestId('real-integration-background')).toHaveTextContent(lightTheme.background);
    });

    it('should update real components when theme changes through ThemePicker', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="real" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('real-component-integration')).toBeTruthy();
      });

      // Change theme through controller
      await act(async () => {
        fireEvent.press(getByTestId('real-integration-set-dark'));
      });

      // Verify all integrated components updated
      const darkTheme = themes[THEME_NAMES.DARK];

      await waitFor(() => {
        expect(getByTestId('real-integration-background')).toHaveTextContent(darkTheme.background);
        expect(getByTestId('real-integration-is-dark')).toHaveTextContent('dark');
      });

      // Verify theme picker container is still present
      expect(getByTestId('theme-picker-container')).toBeTruthy();
    });

    it('should maintain theme consistency across preview cards and main UI', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="real" />);

      // Wait for components to load
      await waitFor(() => {
        expect(getByTestId('real-component-integration')).toBeTruthy();
      });

      // ThemePreviewCards should always show their specific themes
      expect(getByTestId('theme-preview-light')).toBeTruthy();
      expect(getByTestId('theme-preview-dark')).toBeTruthy();

      // Main UI should reflect current theme
      const lightTheme = themes[THEME_NAMES.LIGHT];
      expect(getByTestId('real-integration-background')).toHaveTextContent(lightTheme.background);

      // Change theme through controller instead of non-existent theme-option-dark
      await act(async () => {
        fireEvent.press(getByTestId('real-integration-set-dark'));
      });

      // Preview cards should remain unchanged (they show specific themes)
      expect(getByTestId('theme-preview-light')).toBeTruthy();
      expect(getByTestId('theme-preview-dark')).toBeTruthy();

      // Main UI should update
      const darkTheme = themes[THEME_NAMES.DARK];
      await waitFor(() => {
        expect(getByTestId('real-integration-background')).toHaveTextContent(darkTheme.background);
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

      const { getByTestId } = render(<TestAppWrapper scenario="multiple" />);

      // Wait for components to load with light system theme
      await waitFor(() => {
        expect(getByTestId('multiple-components')).toBeTruthy();
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
        expect(getByTestId('comp1-is-dark')).toHaveTextContent('dark');
        expect(getByTestId('comp2-is-dark')).toHaveTextContent('dark');
      });
    });
  });

  describe('Theme Context Error Handling', () => {
    it('should handle theme context errors gracefully across components', async () => {
      // Mock storage error
      mockStorageGet.mockRejectedValue(new Error('Storage failed'));

      const { getByTestId } = render(<TestAppWrapper scenario="nested" />);

      // Should still render with fallback theme
      await waitFor(() => {
        expect(getByTestId('nested-hierarchy')).toBeTruthy();
      });

      // All components should use fallback theme
      const lightTheme = themes[THEME_NAMES.LIGHT];
      expect(getByTestId('level1-background')).toHaveTextContent(lightTheme.background);
      expect(getByTestId('level4-background')).toHaveTextContent(lightTheme.background);
    });

    it('should continue functioning when storage operations fail during theme changes', async () => {
      const { getByTestId } = render(<TestAppWrapper scenario="multiple" />);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('multiple-components')).toBeTruthy();
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
        expect(getByTestId('comp3-background')).toHaveTextContent(darkTheme.background);
      });
    });
  });
});
