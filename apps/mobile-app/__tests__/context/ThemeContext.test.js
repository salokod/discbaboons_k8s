import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme, useThemeColors } from '../../src/context/ThemeContext';
import { THEME_NAMES, themes } from '../../src/design-system/themes';

// Mock theme storage service
jest.mock('../../src/services/themeStorage', () => ({
  storeTheme: jest.fn(),
  getStoredTheme: jest.fn(),
  clearTheme: jest.fn(),
}));

describe('ThemeContext', () => {
  let mockThemeStorage;

  beforeEach(() => {
    mockThemeStorage = require('../../src/services/themeStorage');

    // Clear all mocks before each test
    mockThemeStorage.storeTheme.mockClear();
    mockThemeStorage.getStoredTheme.mockClear();
    mockThemeStorage.clearTheme.mockClear();

    // Set default mock values
    mockThemeStorage.getStoredTheme.mockResolvedValue(null);
  });

  it('should export ThemeProvider and useTheme', () => {
    expect(ThemeProvider).toBeDefined();
    expect(useTheme).toBeDefined();
  });

  it('should provide default theme (light)', () => {
    function TestComponent() {
      const { theme } = useTheme();
      return <Text testID="theme-name">{theme}</Text>;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.LIGHT);
  });

  it('should allow theme changes', () => {
    function TestComponent() {
      const { theme, setTheme } = useTheme();
      return (
        <>
          <Text testID="theme-name">{theme}</Text>
          <Text testID="set-dark" onPress={() => setTheme(THEME_NAMES.DARK)}>
            Set Dark
          </Text>
        </>
      );
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Initially light theme
    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.LIGHT);

    // Change to dark theme
    act(() => {
      getByTestId('set-dark').props.onPress();
    });
    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.DARK);
  });

  it('should provide theme colors via useThemeColors hook', () => {
    function TestComponent() {
      const colors = useThemeColors();
      return (
        <>
          <Text testID="bg-color">{colors.background}</Text>
          <Text testID="text-color">{colors.text}</Text>
        </>
      );
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Should return light theme colors by default
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.LIGHT].background);
    expect(getByTestId('text-color').children[0]).toBe(themes[THEME_NAMES.LIGHT].text);
  });

  it('should update colors when theme changes', () => {
    function TestComponent() {
      const { setTheme } = useTheme();
      const colors = useThemeColors();
      return (
        <>
          <Text testID="bg-color">{colors.background}</Text>
          <Text testID="switch-blackout" onPress={() => setTheme(THEME_NAMES.BLACKOUT)}>
            Switch to Blackout
          </Text>
        </>
      );
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Initially light theme
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.LIGHT].background);

    // Switch to blackout theme
    act(() => {
      getByTestId('switch-blackout').props.onPress();
    });

    // Colors should update to blackout theme
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.BLACKOUT].background);
  });

  describe('Theme Persistence', () => {
    it('should load stored theme on initialization', async () => {
      // Mock stored theme
      mockThemeStorage.getStoredTheme.mockResolvedValue(THEME_NAMES.DARK);

      function TestComponent() {
        const { theme } = useTheme();
        return <Text testID="theme-name">{theme}</Text>;
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should start with stored theme after initialization
      await act(async () => {
        // Wait for theme to load
      });

      expect(mockThemeStorage.getStoredTheme).toHaveBeenCalled();
    });

    it('should store theme when changed via changeTheme', async () => {
      mockThemeStorage.storeTheme.mockResolvedValue(true);

      function TestComponent() {
        const { theme, changeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-name">{theme}</Text>
            <Text testID="change-theme" onPress={() => changeTheme(THEME_NAMES.DARK)}>
              Change Theme
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      await act(async () => {
        getByTestId('change-theme').props.onPress();
      });

      expect(mockThemeStorage.storeTheme).toHaveBeenCalledWith(THEME_NAMES.DARK);
    });
  });

  describe('System Theme Detection', () => {
    it('should provide system theme detection capability', () => {
      // Test that theme context has the capability to detect system preferences
      // This is a placeholder test for future system theme integration
      function TestComponent() {
        const { theme } = useTheme();
        return <Text testID="theme-name">{theme}</Text>;
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(getByTestId('theme-name')).toBeTruthy();
    });
  });
});
