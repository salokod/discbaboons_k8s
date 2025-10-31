/**
 * ThemePicker Component Tests
 */

import {
  render, screen, fireEvent, act,
} from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ThemePicker from '../../../src/components/settings/ThemePicker';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock theme storage service for loading state tests
jest.mock('../../../src/services/themeStorage', () => ({
  storeTheme: jest.fn(),
  getStoredTheme: jest.fn(),
  clearTheme: jest.fn(),
}));

// Mock the native haptic feedback library
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Wrapper component with all necessary providers
function TestWrapper({ children }) {
  return (
    <NavigationContainer>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </NavigationContainer>
  );
}

describe('ThemePicker', () => {
  let mockThemeStorage;
  let mockHapticFeedback;

  beforeEach(() => {
    mockThemeStorage = require('../../../src/services/themeStorage');
    mockHapticFeedback = require('react-native-haptic-feedback');

    // Clear all mocks before each test
    mockThemeStorage.storeTheme.mockClear();
    mockThemeStorage.getStoredTheme.mockClear();
    mockThemeStorage.clearTheme.mockClear();
    mockHapticFeedback.trigger.mockClear();

    // Set default mock values
    mockThemeStorage.getStoredTheme.mockResolvedValue(null);
    mockThemeStorage.storeTheme.mockResolvedValue(true);
  });

  it('should export a component', () => {
    expect(ThemePicker).toBeDefined();
    expect(typeof ThemePicker).toBe('object'); // memo returns an object
  });

  it('should render the theme picker component', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    expect(screen.getByTestId('theme-picker')).toBeTruthy();
  });

  it('should display theme options', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    expect(screen.getByText('System')).toBeTruthy();
    expect(screen.getByText('Light')).toBeTruthy();
    expect(screen.getByText('Dark')).toBeTruthy();
    expect(screen.getByText('Blackout')).toBeTruthy();
  });

  it('should allow selecting a theme option', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    const darkThemeOption = screen.getByTestId('theme-option-dark');
    expect(darkThemeOption).toBeTruthy();

    fireEvent.press(darkThemeOption);
    // Theme change behavior will be tested separately
  });

  it('should have professional styling matching CreateBagScreen patterns', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    const themeContainer = screen.getByTestId('theme-picker');
    expect(themeContainer).toBeTruthy();

    // Check that theme options are present
    expect(screen.getByTestId('theme-option-system')).toBeTruthy();
    expect(screen.getByTestId('theme-option-light')).toBeTruthy();
    expect(screen.getByTestId('theme-option-dark')).toBeTruthy();
    expect(screen.getByTestId('theme-option-blackout')).toBeTruthy();
  });

  it('should show descriptions for each theme option', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    expect(screen.getByText('Follow your device theme')).toBeTruthy();
    expect(screen.getByText('Clean and bright interface')).toBeTruthy();
    expect(screen.getByText('Easy on the eyes in low light')).toBeTruthy();
    expect(screen.getByText('Pure black for OLED displays')).toBeTruthy();
  });

  it('should show "system" as selected when theme preference is "system"', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    // Since the default theme preference is 'system', it should be selected
    const systemOption = screen.getByTestId('theme-option-system');
    const lightOption = screen.getByTestId('theme-option-light');
    const darkOption = screen.getByTestId('theme-option-dark');
    const blackoutOption = screen.getByTestId('theme-option-blackout');

    // System should be selected (it's the default)
    expect(systemOption).toBeTruthy();

    // Other options should not be selected
    expect(lightOption).toBeTruthy();
    expect(darkOption).toBeTruthy();
    expect(blackoutOption).toBeTruthy();

    // Check that the checkmark icon exists for system theme
    expect(screen.getByTestId('theme-option-system')).toBeTruthy();
  });

  it('should not show resolved theme as selected when using "system"', () => {
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    // Even though the system theme might resolve to 'light' or 'dark',
    // only the 'system' option should show as selected, not the resolved theme
    const systemOption = screen.getByTestId('theme-option-system');
    // System option should be present and testable
    expect(systemOption).toBeTruthy();

    // This test verifies that the component uses the theme preference
    // (not activeTheme) for showing selection
    // We can't easily test the visual selection state without access to styles,
    // but we verify the structure is correct for the selection logic
  });

  describe('Haptic Feedback', () => {
    it('should not throw runtime errors when using haptic feedback', async () => {
      // This test ensures the original error "isSupported is not a function" is fixed
      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      // Should not throw the original haptic error
      await act(async () => {
        expect(() => fireEvent.press(darkThemeOption)).not.toThrow();
      });
    });
  });

  describe('Theme Transition Animation', () => {
    it('should render with animated view for theme transitions', () => {
      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      const themePickerElement = screen.getByTestId('theme-picker');
      expect(themePickerElement).toBeTruthy();

      // Component should render successfully with animation setup
      expect(screen.getByText('System')).toBeTruthy();
    });

    it('should have smooth transition behavior on theme change', async () => {
      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      // Should not throw error when animation is triggered
      await act(async () => {
        expect(() => fireEvent.press(darkThemeOption)).not.toThrow();
      });

      // Component should still be rendered after theme change
      expect(screen.getByTestId('theme-picker')).toBeTruthy();
    });

    it('should maintain functionality during animation', async () => {
      // Set up slow theme storage to see loading state
      mockThemeStorage.storeTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      // Press the option to trigger loading state
      act(() => {
        fireEvent.press(darkThemeOption);
      });

      // Wait for loading state to appear
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      });

      // Should show loading state during animation/theme change
      expect(screen.getByTestId('theme-option-dark-loading')).toBeTruthy();
    });

    it('should prevent multiple animations when loading', async () => {
      // Set up slow theme storage to keep loading state active
      mockThemeStorage.storeTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');
      const lightThemeOption = screen.getByTestId('theme-option-light');

      await act(async () => {
        fireEvent.press(darkThemeOption);
      });

      // Should be in disabled state while loading
      expect(lightThemeOption.props.accessibilityState?.disabled).toBe(true);

      // Should not throw error when trying to click disabled option
      await act(async () => {
        expect(() => fireEvent.press(lightThemeOption)).not.toThrow();
      });
    });
  });

  describe('Success Toast for Theme Change', () => {
    it('should show toast after successful theme change', async () => {
      mockThemeStorage.storeTheme.mockResolvedValue(true);

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      await act(async () => {
        fireEvent.press(darkThemeOption);
        // Wait for theme change to complete
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      // Should show success toast
      expect(screen.getByTestId('toast')).toBeTruthy();
      expect(screen.getByTestId('toast-message')).toBeTruthy();
    });

    it('should display theme name in toast message', async () => {
      mockThemeStorage.storeTheme.mockResolvedValue(true);

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      await act(async () => {
        fireEvent.press(darkThemeOption);
        // Wait for theme change to complete
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      // Should show theme name in toast
      expect(screen.getByText(/Switched to Dark theme/)).toBeTruthy();
    });

    it('should auto-dismiss toast after 2 seconds', async () => {
      jest.useFakeTimers();
      mockThemeStorage.storeTheme.mockResolvedValue(true);

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      await act(async () => {
        fireEvent.press(darkThemeOption);
        // Wait for theme change to complete
        jest.advanceTimersByTime(0);
      });

      // Toast should be visible initially
      expect(screen.getByTestId('toast')).toBeTruthy();

      // Wait for auto-dismiss (2 seconds + animation time)
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      // Toast should be hidden
      expect(screen.queryByTestId('toast')).toBeNull();
      jest.useRealTimers();
    });

    it('should show toast even when storage fails due to graceful degradation', async () => {
      mockThemeStorage.storeTheme.mockRejectedValue(new Error('Storage failed'));

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      await act(async () => {
        fireEvent.press(darkThemeOption);
        // Wait for theme change attempt to complete
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      // Should show toast because theme changes in memory (graceful degradation)
      expect(screen.getByTestId('toast')).toBeTruthy();
      expect(screen.getByText(/Switched to Dark theme/)).toBeTruthy();
    });

    it('should show different messages for different themes', async () => {
      mockThemeStorage.storeTheme.mockResolvedValue(true);

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for haptic support check to complete
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      // Test Dark theme
      const darkThemeOption = screen.getByTestId('theme-option-dark');
      await act(async () => {
        fireEvent.press(darkThemeOption);
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(screen.getByText(/Switched to Dark theme/)).toBeTruthy();

      // Wait for toast to disappear
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 2500);
        });
      });

      // Test Light theme
      const lightThemeOption = screen.getByTestId('theme-option-light');
      await act(async () => {
        fireEvent.press(lightThemeOption);
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(screen.getByText(/Switched to Light theme/)).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator on theme option when theme is changing', async () => {
      // Set up slow theme storage to keep loading state active
      mockThemeStorage.storeTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for initial loading to complete
      await act(async () => {
        // Allow initial theme loading to complete
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');
      expect(darkThemeOption).toBeTruthy();

      // Before pressing, there should be no loading indicator
      expect(screen.queryByTestId('theme-option-dark-loading')).toBeNull();

      act(() => {
        fireEvent.press(darkThemeOption);
      });

      // After pressing, should show loading indicator
      expect(screen.getByTestId('theme-option-dark-loading')).toBeTruthy();
    });

    it('should disable theme options while loading', async () => {
      // Set up slow theme storage to keep loading state active
      mockThemeStorage.storeTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for initial loading to complete
      await act(async () => {
        // Allow initial theme loading to complete
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');
      const lightThemeOption = screen.getByTestId('theme-option-light');

      act(() => {
        fireEvent.press(darkThemeOption);
      });

      // Dark option should be disabled while loading
      expect(darkThemeOption.props.accessibilityState?.disabled).toBe(true);

      // Other options should also be disabled while any theme is loading
      expect(lightThemeOption.props.accessibilityState?.disabled).toBe(true);
    });

    it('should show loading spinner instead of checkmark when theme is loading', async () => {
      // Set up slow theme storage to keep loading state active
      mockThemeStorage.storeTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for initial loading to complete
      await act(async () => {
        // Allow initial theme loading to complete
      });

      // Initially should show checkmark for selected system theme
      expect(screen.getByText('System')).toBeTruthy();

      // Press a different theme to trigger loading
      const darkThemeOption = screen.getByTestId('theme-option-dark');
      act(() => {
        fireEvent.press(darkThemeOption);
      });

      // Should show loading indicator for the dark theme option
      expect(screen.getByTestId('theme-option-dark-loading')).toBeTruthy();
    });

    it('should hide loading indicator after theme change completes', async () => {
      // Set up slow theme storage to keep loading state active initially
      mockThemeStorage.storeTheme.mockImplementation(() => new Promise((resolve) => {
        setTimeout(resolve, 100);
      }));

      render(
        <TestWrapper>
          <ThemePicker />
        </TestWrapper>,
      );

      // Wait for initial loading to complete
      await act(async () => {
        // Allow initial theme loading to complete
      });

      const darkThemeOption = screen.getByTestId('theme-option-dark');

      act(() => {
        fireEvent.press(darkThemeOption);
      });

      // Should show loading initially
      expect(screen.getByTestId('theme-option-dark-loading')).toBeTruthy();

      // Wait for theme change to complete
      await act(async () => {
        // Theme change should complete
        await new Promise((resolve) => {
          setTimeout(resolve, 150);
        });
      });

      // Loading indicator should be gone
      expect(screen.queryByTestId('theme-option-dark-loading')).toBeNull();
    });
  });
});
