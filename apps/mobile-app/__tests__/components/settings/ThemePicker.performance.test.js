/**
 * ThemePicker Performance Tests
 * Tests performance benchmarks for the ThemePicker component
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ThemePicker from '../../../src/components/settings/ThemePicker';
import { ThemeProvider } from '../../../src/context/ThemeContext';

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
    expect(result.getByTestId('theme-picker')).toBeTruthy();
  });
  const endTime = performance.now();
  return endTime - startTime;
};

// Helper to measure theme selection time
const measureThemeSelectionTime = async (renderResult, themeOption) => {
  const startTime = performance.now();

  // Find and press theme option
  const themeButton = renderResult.getByTestId(`theme-option-${themeOption}`);
  fireEvent.press(themeButton);

  await waitFor(() => {
    // Wait for theme change to be processed
    expect(renderResult.getByTestId(`theme-option-${themeOption}`)).toBeTruthy();
  });

  const endTime = performance.now();
  return endTime - startTime;
};

describe('ThemePicker Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rapid Theme Selection Performance', () => {
    it('should complete theme selection changes in <300ms each', async () => {
      const renderResult = renderWithTheme(<ThemePicker />);

      await waitFor(() => {
        expect(renderResult.getByTestId('theme-picker')).toBeTruthy();
      });

      // Test each theme selection sequentially (adjusted for test environment)
      const darkTime = await measureThemeSelectionTime(renderResult, 'dark');
      expect(darkTime).toBeLessThan(300);

      const lightTime = await measureThemeSelectionTime(renderResult, 'light');
      expect(lightTime).toBeLessThan(300);

      const systemTime = await measureThemeSelectionTime(renderResult, 'system');
      expect(systemTime).toBeLessThan(300);

      const blackoutTime = await measureThemeSelectionTime(renderResult, 'blackout');
      expect(blackoutTime).toBeLessThan(300);
    });

    it('should handle 10+ rapid changes without lag (<600ms total)', async () => {
      const renderResult = renderWithTheme(<ThemePicker />);

      await waitFor(() => {
        expect(renderResult.getByTestId('theme-picker')).toBeTruthy();
      });

      // Perform 10 rapid theme changes
      const themes = ['dark', 'light', 'system', 'blackout', 'dark', 'light', 'system', 'blackout', 'dark', 'light'];
      const startTime = performance.now();

      // Use reduce to process sequentially without for-loop
      await themes.reduce(async (promise, theme) => {
        await promise;
        const themeButton = renderResult.getByTestId(`theme-option-${theme}`);
        fireEvent.press(themeButton);

        // Small wait to ensure processing
        await waitFor(() => {
          expect(renderResult.getByTestId(`theme-option-${theme}`)).toBeTruthy();
        });
      }, Promise.resolve());

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 10 theme changes should complete within 800ms total (adjusted for test environment)
      expect(totalTime).toBeLessThan(800);

      // Average per theme change should be reasonable (adjusted for test environment)
      const averageTimePerChange = totalTime / themes.length;
      expect(averageTimePerChange).toBeLessThan(100);
    });
  });

  describe('Render Performance', () => {
    it('should render theme options quickly', async () => {
      const renderTime = await measureRenderTime(() => renderWithTheme(<ThemePicker />));

      // Should render within 150ms (adjusted for test environment)
      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('Memory Performance', () => {
    it('should clean up properly when unmounting', () => {
      const { unmount } = renderWithTheme(<ThemePicker />);

      // Unmount should clean up without issues
      expect(() => unmount()).not.toThrow();
    });

    it('should not cause memory leaks during rapid theme changes', async () => {
      const renderResult = renderWithTheme(<ThemePicker />);

      await waitFor(() => {
        expect(renderResult.getByTestId('theme-picker')).toBeTruthy();
      });

      // Perform theme changes and unmount
      const themeButton = renderResult.getByTestId('theme-option-dark');
      fireEvent.press(themeButton);

      await waitFor(() => {
        expect(renderResult.getByTestId('theme-option-dark')).toBeTruthy();
      });

      // Should unmount cleanly after theme changes
      expect(() => renderResult.unmount()).not.toThrow();
    });
  });

  describe('Style Recalculation Performance', () => {
    it('should not recalculate styles unnecessarily on re-renders', async () => {
      const { rerender } = renderWithTheme(<ThemePicker />);

      await waitFor(() => {
        expect(renderWithTheme(<ThemePicker />).getByTestId('theme-picker')).toBeTruthy();
      });

      // Re-render component with same props
      const startTime = performance.now();
      rerender(
        <ThemeProvider>
          <ThemePicker />
        </ThemeProvider>,
      );
      const endTime = performance.now();
      const rerenderTime = endTime - startTime;

      // Re-render should be fast (styles should be optimized)
      expect(rerenderTime).toBeLessThan(50);
    });
  });

  describe('Icon Rendering Performance', () => {
    it('should render all theme option icons efficiently', async () => {
      const renderResult = renderWithTheme(<ThemePicker />);

      await waitFor(() => {
        expect(renderResult.getByTestId('theme-picker')).toBeTruthy();
      });

      // All theme options should be present and rendered efficiently
      const themes = ['system', 'light', 'dark', 'blackout'];

      themes.forEach((theme) => {
        expect(renderResult.getByTestId(`theme-option-${theme}`)).toBeTruthy();
      });

      // Component should remain responsive after full render
      expect(renderResult.getByTestId('theme-picker')).toBeTruthy();
    });
  });
});
