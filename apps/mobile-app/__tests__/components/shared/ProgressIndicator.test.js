/**
 * ProgressIndicator Component Tests
 * Test-driven development for reusable progress display component
 */

import { render } from '@testing-library/react-native';
import ProgressIndicator from '../../../src/components/shared/ProgressIndicator';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Helper to render with theme context
const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('ProgressIndicator Component', () => {
  describe('should export a function', () => {
    it('should be a function', () => {
      expect(typeof ProgressIndicator).toBe('function');
    });
  });

  describe('basic rendering', () => {
    it('should render without crashing with minimal props', () => {
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
        />,
      );

      expect(getByTestId('progress-indicator')).toBeTruthy();
    });

    it('should display progress text with processed and total counts', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
        />,
      );

      expect(getByText('3 of 10')).toBeTruthy();
    });
  });

  describe('progress bar rendering', () => {
    it('should render progress bar with correct fill percentage', () => {
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
        />,
      );

      const progressBar = getByTestId('progress-bar');
      const progressFill = getByTestId('progress-fill');

      expect(progressBar).toBeTruthy();
      expect(progressFill).toBeTruthy();
    });

    it('should handle zero progress correctly', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={0}
          totalItems={5}
        />,
      );

      expect(getByText('0 of 5')).toBeTruthy();
    });

    it('should handle completed progress correctly', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={5}
          totalItems={5}
        />,
      );

      expect(getByText('5 of 5')).toBeTruthy();
    });
  });

  describe('current item display', () => {
    it('should show current item when provided', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={2}
          totalItems={5}
          currentItem="Moving Disc Golf Disc"
        />,
      );

      expect(getByText('Moving Disc Golf Disc')).toBeTruthy();
    });

    it('should not show current item section when not provided', () => {
      const { queryByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={2}
          totalItems={5}
        />,
      );

      expect(queryByTestId('current-item')).toBeFalsy();
    });

    it('should show current item section when provided', () => {
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={2}
          totalItems={5}
          currentItem="Processing item"
        />,
      );

      expect(getByTestId('current-item')).toBeTruthy();
    });
  });

  describe('operation type display', () => {
    it('should show operation type when provided', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={2}
          totalItems={5}
          operationType="move"
        />,
      );

      expect(getByText('Moving 2 of 5')).toBeTruthy();
    });

    it('should handle different operation types', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={1}
          totalItems={3}
          operationType="remove"
        />,
      );

      expect(getByText('Removing 1 of 3')).toBeTruthy();
    });

    it('should use default text when no operation type provided', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={2}
          totalItems={5}
        />,
      );

      expect(getByText('2 of 5')).toBeTruthy();
    });
  });

  describe('failed items display', () => {
    it('should show failed count when greater than zero', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={5}
          failedItems={1}
        />,
      );

      expect(getByText('3 of 5 (1 failed)')).toBeTruthy();
    });

    it('should not show failed count when zero', () => {
      const { getByText, queryByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={5}
          failedItems={0}
        />,
      );

      expect(getByText('3 of 5')).toBeTruthy();
      expect(queryByText('failed')).toBeFalsy();
    });

    it('should combine operation type and failed items correctly', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={2}
          totalItems={4}
          operationType="move"
          failedItems={1}
        />,
      );

      expect(getByText('Moving 2 of 4 (1 failed)')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility label for progress', () => {
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
          operationType="move"
        />,
      );

      const progressIndicator = getByTestId('progress-indicator');
      expect(progressIndicator.props.accessibilityLabel).toBe(
        'Progress: Moving 3 of 10 items, 30% complete',
      );
    });

    it('should include failed items in accessibility label', () => {
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
          operationType="remove"
          failedItems={1}
        />,
      );

      const progressIndicator = getByTestId('progress-indicator');
      expect(progressIndicator.props.accessibilityLabel).toBe(
        'Progress: Removing 3 of 10 items, 30% complete, 1 failed',
      );
    });

    it('should have proper accessibility role', () => {
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
        />,
      );

      const progressIndicator = getByTestId('progress-indicator');
      expect(progressIndicator.props.accessibilityRole).toBe('progressbar');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid total items gracefully', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={0}
        />,
      );

      expect(getByText('3 of 0')).toBeTruthy();
    });

    it('should handle processed items exceeding total items', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={8}
          totalItems={5}
        />,
      );

      expect(getByText('8 of 5')).toBeTruthy();
    });

    it('should handle negative values gracefully', () => {
      const { getByText } = renderWithTheme(
        <ProgressIndicator
          processedItems={-1}
          totalItems={5}
        />,
      );

      expect(getByText('0 of 5')).toBeTruthy();
    });
  });

  describe('style variations', () => {
    it('should accept custom style prop', () => {
      const customStyle = { marginTop: 20 };
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
          style={customStyle}
        />,
      );

      const progressIndicator = getByTestId('progress-indicator');
      expect(progressIndicator.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining(customStyle)]),
      );
    });

    it('should apply theme colors correctly', () => {
      const { getByTestId } = renderWithTheme(
        <ProgressIndicator
          processedItems={3}
          totalItems={10}
        />,
      );

      // Component should render without theme-related errors
      expect(getByTestId('progress-indicator')).toBeTruthy();
      expect(getByTestId('progress-bar')).toBeTruthy();
      expect(getByTestId('progress-fill')).toBeTruthy();
    });
  });
});
