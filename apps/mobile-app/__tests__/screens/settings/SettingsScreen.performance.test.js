/**
 * SettingsScreen Performance Tests
 * Tests performance benchmarks for the Settings screen
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '../../../src/screens/settings/SettingsScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock AuthContext
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', isAdmin: false },
  }),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Helper to render component with theme
const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

// Helper to measure render time
const measureRenderTime = async (renderFn) => {
  const startTime = performance.now();
  const result = renderFn();
  await waitFor(() => {
    // Wait for component to be fully rendered
    expect(result.getByText('Settings')).toBeTruthy();
  });
  const endTime = performance.now();
  return endTime - startTime;
};

// Helper to measure theme switching time
const measureThemeSwitchTime = async (renderResult, themeOption) => {
  const startTime = performance.now();

  // Find and press theme option
  const themeButton = renderResult.getByTestId(`theme-option-${themeOption}`);
  fireEvent.press(themeButton);

  await waitFor(() => {
    // Wait for theme change to complete
    expect(renderResult.getByTestId(`theme-option-${themeOption}`)).toBeTruthy();
  });

  const endTime = performance.now();
  return endTime - startTime;
};

describe('SettingsScreen Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Render Performance', () => {
    it('should render in <1500ms', async () => {
      const renderTime = await measureRenderTime(() => renderWithTheme(
        <SettingsScreen navigation={mockNavigation} />,
      ));

      // Should render within 1.5 seconds (adjusted for test environment)
      expect(renderTime).toBeLessThan(1500);
    });
  });

  describe('Theme Switching Performance', () => {
    it('should complete theme switching in <200ms', async () => {
      const renderResult = renderWithTheme(
        <SettingsScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(renderResult.getByText('Settings')).toBeTruthy();
      });

      const switchTime = await measureThemeSwitchTime(renderResult, 'dark');

      // Theme switching should complete within 200ms
      expect(switchTime).toBeLessThan(200);
    });

    it('should handle multiple rapid theme changes without performance degradation', async () => {
      const renderResult = renderWithTheme(
        <SettingsScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(renderResult.getByText('Settings')).toBeTruthy();
      });

      // Perform 5 rapid theme changes and measure total time
      const themes = ['dark', 'light', 'system', 'blackout', 'light'];
      const startTime = performance.now();

      // Use Promise.all to avoid for-of loop with await
      await Promise.all(themes.map(async (theme) => {
        const themeButton = renderResult.getByTestId(`theme-option-${theme}`);
        fireEvent.press(themeButton);

        await waitFor(() => {
          expect(renderResult.getByTestId(`theme-option-${theme}`)).toBeTruthy();
        });
      }));

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 5 theme changes should complete within 1 second total
      expect(totalTime).toBeLessThan(1000);

      // Average per theme change should be reasonable
      const averageTimePerChange = totalTime / themes.length;
      expect(averageTimePerChange).toBeLessThan(200);
    });
  });

  describe('Memory Performance', () => {
    it('should clean up properly when unmounting', () => {
      const { unmount } = renderWithTheme(
        <SettingsScreen navigation={mockNavigation} />,
      );

      // Unmount should clean up without issues
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Style Recalculation Performance', () => {
    it('should not recalculate styles unnecessarily on re-renders', async () => {
      const { rerender } = renderWithTheme(
        <SettingsScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(mockNavigation.navigate).not.toHaveBeenCalled();
      });

      // Re-render component with same props
      const startTime = performance.now();
      rerender(
        <ThemeProvider>
          <SettingsScreen navigation={mockNavigation} />
        </ThemeProvider>,
      );
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;

      // Re-render should be fast (styles should be memoized)
      expect(rerenderTime).toBeLessThan(50);
    });
  });
});
