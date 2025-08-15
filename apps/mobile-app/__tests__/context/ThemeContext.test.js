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

// Mock system theme service
jest.mock('../../src/services/systemTheme', () => ({
  getSystemColorScheme: jest.fn(),
  addSystemThemeChangeListener: jest.fn(),
  isSystemThemeSupported: jest.fn(),
}));

describe('ThemeContext', () => {
  let mockThemeStorage;
  let mockSystemTheme;

  beforeEach(() => {
    mockThemeStorage = require('../../src/services/themeStorage');
    mockSystemTheme = require('../../src/services/systemTheme');

    // Clear all mocks before each test
    mockThemeStorage.storeTheme.mockClear();
    mockThemeStorage.getStoredTheme.mockClear();
    mockThemeStorage.clearTheme.mockClear();
    mockSystemTheme.getSystemColorScheme.mockClear();
    mockSystemTheme.addSystemThemeChangeListener.mockClear();
    mockSystemTheme.isSystemThemeSupported.mockClear();

    // Set default mock values
    mockThemeStorage.getStoredTheme.mockResolvedValue(null);
    mockSystemTheme.getSystemColorScheme.mockReturnValue(THEME_NAMES.LIGHT);
    mockSystemTheme.isSystemThemeSupported.mockReturnValue(true);
  });

  it('should export ThemeProvider and useTheme', () => {
    expect(ThemeProvider).toBeDefined();
    expect(useTheme).toBeDefined();
  });

  it('should provide default theme (system)', () => {
    function TestComponent() {
      const { theme } = useTheme();
      return <Text testID="theme-name">{theme}</Text>;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.SYSTEM);
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

    // Initially system theme
    expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.SYSTEM);

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

    // Should return resolved system theme colors by default (resolves to light)
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

    // Initially system theme (resolves to light)
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.LIGHT].background);

    // Switch to blackout theme
    act(() => {
      getByTestId('switch-blackout').props.onPress();
    });

    // Colors should update to blackout theme
    expect(getByTestId('bg-color').children[0]).toBe(themes[THEME_NAMES.BLACKOUT].background);
  });

  describe('Theme Persistence', () => {
    it('should default to system preference when no stored theme', () => {
      // Mock no stored theme (default mock behavior)
      mockThemeStorage.getStoredTheme.mockResolvedValue(null);

      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should default to system preference
      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.SYSTEM);
      // Should resolve to light since system detection defaults to light
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);
    });

    it('should resolve activeTheme to system color scheme on init', () => {
      // Test that system theme preference resolves to actual theme
      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.SYSTEM);
      // activeTheme should be resolved from system (currently defaults to light)
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);
    });

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

    it('should allow changing to system theme via changeTheme function', async () => {
      mockThemeStorage.storeTheme.mockResolvedValue(true);

      function TestComponent() {
        const { theme, changeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-name">{theme}</Text>
            <Text testID="change-to-light" onPress={() => changeTheme(THEME_NAMES.LIGHT)}>
              Change to Light
            </Text>
            <Text testID="change-to-system" onPress={() => changeTheme(THEME_NAMES.SYSTEM)}>
              Change to System
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Start with system theme, then change to light
      expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.SYSTEM);

      await act(async () => {
        getByTestId('change-to-light').props.onPress();
      });

      // Should now be light theme
      expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.LIGHT);

      // Now try to change back to system - this should work but currently fails
      await act(async () => {
        getByTestId('change-to-system').props.onPress();
      });

      // Should be able to change back to system theme
      expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.SYSTEM);
      expect(mockThemeStorage.storeTheme).toHaveBeenCalledWith(THEME_NAMES.SYSTEM);
    });

    it('should load stored system theme on initialization', async () => {
      // Mock stored system theme - simulates user who previously selected system theme
      mockThemeStorage.getStoredTheme.mockResolvedValue(THEME_NAMES.SYSTEM);

      function TestComponent() {
        const { theme } = useTheme();
        return <Text testID="theme-name">{theme}</Text>;
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Initially starts with system theme (default)
      expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.SYSTEM);

      // Wait for stored theme to load (should remain system)
      await act(async () => {
        // Allow useEffect to complete
      });

      // Should have loaded the stored system theme successfully
      expect(getByTestId('theme-name').children[0]).toBe(THEME_NAMES.SYSTEM);
      expect(mockThemeStorage.getStoredTheme).toHaveBeenCalled();
    });

    it('should load stored system theme when user restarts app', async () => {
      // This test specifically addresses the bug where stored 'system' theme
      // would fail to load because themes['system'] is undefined

      // Simulate a scenario where user selected system theme, then app restarted
      mockThemeStorage.getStoredTheme.mockResolvedValue(THEME_NAMES.SYSTEM);

      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Wait for initialization effects to complete
      await act(async () => {
        // Allow all useEffects to run, including theme loading
      });

      // Theme preference should be loaded as system
      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.SYSTEM);

      // Active theme should be resolved (defaults to light when system detection returns light)
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);

      // Verify storage was accessed
      expect(mockThemeStorage.getStoredTheme).toHaveBeenCalled();
    });
  });

  describe('Active Theme State', () => {
    it('should provide activeTheme alongside theme preference', () => {
      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(getByTestId('theme-preference')).toBeTruthy();
      expect(getByTestId('active-theme')).toBeTruthy();
    });

    it('should initialize activeTheme based on stored preference', () => {
      function TestComponent() {
        const { activeTheme } = useTheme();
        return <Text testID="active-theme">{activeTheme}</Text>;
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should initialize activeTheme (system resolves to light)
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);
    });

    it('should set activeTheme to light when preference is light', () => {
      function TestComponent() {
        const { theme, activeTheme, setTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
            <Text testID="set-light" onPress={() => setTheme(THEME_NAMES.LIGHT)}>
              Set Light
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        getByTestId('set-light').props.onPress();
      });

      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.LIGHT);
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);
    });

    it('should resolve activeTheme when preference is system', () => {
      function TestComponent() {
        const { theme, activeTheme, setTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
            <Text testID="set-system" onPress={() => setTheme('system')}>
              Set System
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        getByTestId('set-system').props.onPress();
      });

      expect(getByTestId('theme-preference').children[0]).toBe('system');
      // activeTheme should be system-resolved (defaults to 'light' when system is unknown)
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);
    });
  });

  describe('System Theme Detection', () => {
    it('should call getSystemColorScheme when preference is system', () => {
      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-name">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(mockSystemTheme.getSystemColorScheme).toHaveBeenCalled();
    });

    it('should set activeTheme to system color scheme result', () => {
      // Mock system theme as dark
      mockSystemTheme.getSystemColorScheme.mockReturnValue(THEME_NAMES.DARK);

      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.DARK);
      expect(mockSystemTheme.getSystemColorScheme).toHaveBeenCalled();
    });

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

  describe('Unsupported System Theme Detection', () => {
    it('should fallback to light when system detection unsupported', () => {
      // Mock system theme detection as unsupported
      mockSystemTheme.isSystemThemeSupported.mockReturnValue(false);

      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should still prefer system but fallback activeTheme to light
      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);

      // Should not call getSystemColorScheme when unsupported
      expect(mockSystemTheme.getSystemColorScheme).not.toHaveBeenCalled();
    });

    it('should not crash when Appearance API unavailable', () => {
      // Mock system theme detection as unsupported
      mockSystemTheme.isSystemThemeSupported.mockReturnValue(false);
      // Ensure getSystemColorScheme doesn't get called
      mockSystemTheme.getSystemColorScheme.mockImplementation(() => {
        throw new Error('Appearance API not available');
      });

      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      // Should not throw when rendering
      expect(() => {
        render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      }).not.toThrow();

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should gracefully fallback to light theme
      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);
    });
  });

  describe('Loading State', () => {
    it('should provide isLoading state', () => {
      function TestComponent() {
        const { isLoading } = useTheme();
        return <Text testID="loading-state">{isLoading ? 'loading' : 'loaded'}</Text>;
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should have loading state initially or after theme loads
      expect(getByTestId('loading-state')).toBeTruthy();
    });

    it('should set isLoading to true during theme change', async () => {
      // Set up initial state with loaded theme
      mockThemeStorage.getStoredTheme.mockResolvedValue(null);
      mockThemeStorage.storeTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      function TestComponent() {
        const { isLoading, changeTheme } = useTheme();
        return (
          <>
            <Text testID="loading-state">{isLoading ? 'loading' : 'loaded'}</Text>
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

      // Wait for initial loading to complete
      await act(async () => {
        // Allow initial theme loading to complete
      });

      // Should be loaded after initialization
      expect(getByTestId('loading-state').children[0]).toBe('loaded');

      // Trigger theme change
      act(() => {
        getByTestId('change-theme').props.onPress();
      });

      // Should be loading during theme change
      expect(getByTestId('loading-state').children[0]).toBe('loading');

      // Wait for theme change to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 150);
        });
      });

      // Should be loaded again
      expect(getByTestId('loading-state').children[0]).toBe('loaded');
    });

    it('should set isLoading to true during initial theme load', async () => {
      mockThemeStorage.getStoredTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve(THEME_NAMES.DARK), 100);
      }));

      function TestComponent() {
        const { isLoading } = useTheme();
        return <Text testID="loading-state">{isLoading ? 'loading' : 'loaded'}</Text>;
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Should be loading initially
      expect(getByTestId('loading-state').children[0]).toBe('loading');

      // Wait for theme to load
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 150);
        });
      });

      // Should be loaded after initialization
      expect(getByTestId('loading-state').children[0]).toBe('loaded');
    });
  });

  describe('System Theme Change Listening', () => {
    it('should add system listener when preference changes to system', () => {
      function TestComponent() {
        const { theme, setTheme } = useTheme();
        return (
          <>
            <Text testID="theme-name">{theme}</Text>
            <Text testID="set-light" onPress={() => setTheme(THEME_NAMES.LIGHT)}>
              Set Light
            </Text>
            <Text testID="set-system" onPress={() => setTheme(THEME_NAMES.SYSTEM)}>
              Set System
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Initially system theme, should have listener
      expect(mockSystemTheme.addSystemThemeChangeListener).toHaveBeenCalled();

      // Clear the mock and change to non-system theme
      mockSystemTheme.addSystemThemeChangeListener.mockClear();
      act(() => {
        getByTestId('set-light').props.onPress();
      });

      // Verify listener is not added for non-system theme
      expect(mockSystemTheme.addSystemThemeChangeListener).not.toHaveBeenCalled();

      // Now change to system theme
      act(() => {
        getByTestId('set-system').props.onPress();
      });

      // Should add listener when changing to system
      expect(mockSystemTheme.addSystemThemeChangeListener).toHaveBeenCalled();
    });

    it('should update activeTheme when system theme changes', () => {
      let systemChangeCallback;
      mockSystemTheme.addSystemThemeChangeListener.mockImplementation((callback) => {
        systemChangeCallback = callback;
        return () => {}; // cleanup function
      });

      function TestComponent() {
        const { theme, activeTheme } = useTheme();
        return (
          <>
            <Text testID="theme-preference">{theme}</Text>
            <Text testID="active-theme">{activeTheme}</Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Initially should be system with light theme
      expect(getByTestId('theme-preference').children[0]).toBe(THEME_NAMES.SYSTEM);
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.LIGHT);

      // Simulate system theme change to dark
      act(() => {
        systemChangeCallback(THEME_NAMES.DARK);
      });

      // activeTheme should update to dark
      expect(getByTestId('active-theme').children[0]).toBe(THEME_NAMES.DARK);
    });

    it('should not add listener for non-system preferences', () => {
      function TestComponent() {
        const { theme, setTheme } = useTheme();
        return (
          <>
            <Text testID="theme-name">{theme}</Text>
            <Text testID="set-light" onPress={() => setTheme(THEME_NAMES.LIGHT)}>
              Set Light
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Initially system theme, listener should be added
      expect(mockSystemTheme.addSystemThemeChangeListener).toHaveBeenCalled();

      // Clear the mock and change to non-system theme
      mockSystemTheme.addSystemThemeChangeListener.mockClear();
      act(() => {
        getByTestId('set-light').props.onPress();
      });

      // Should not add listener for non-system themes
      expect(mockSystemTheme.addSystemThemeChangeListener).not.toHaveBeenCalled();
    });

    it('should remove system listener when preference changes from system', () => {
      const mockCleanup = jest.fn();
      mockSystemTheme.addSystemThemeChangeListener.mockReturnValue(mockCleanup);

      function TestComponent() {
        const { theme, setTheme } = useTheme();
        return (
          <>
            <Text testID="theme-name">{theme}</Text>
            <Text testID="set-light" onPress={() => setTheme(THEME_NAMES.LIGHT)}>
              Set Light
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Initially system theme, listener should be added
      expect(mockSystemTheme.addSystemThemeChangeListener).toHaveBeenCalled();

      // Change to non-system theme
      act(() => {
        getByTestId('set-light').props.onPress();
      });

      // Cleanup function should be called when switching away from system
      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should clean up listener on unmount', () => {
      const mockCleanup = jest.fn();
      mockSystemTheme.addSystemThemeChangeListener.mockReturnValue(mockCleanup);

      function TestComponent() {
        const { theme } = useTheme();
        return <Text testID="theme-name">{theme}</Text>;
      }

      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      // Initially system theme, listener should be added
      expect(mockSystemTheme.addSystemThemeChangeListener).toHaveBeenCalled();

      // Unmount the component
      unmount();

      // Cleanup function should be called on unmount
      expect(mockCleanup).toHaveBeenCalled();
    });
  });
});
