/**
 * BulkActionBar Tests
 * Test-driven development for bulk action bar component
 */

import { render, fireEvent } from '@testing-library/react-native';
import BulkActionBar from '../../../src/components/bags/BulkActionBar';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('BulkActionBar', () => {
  describe('should export a component', () => {
    it('should be a React component', () => {
      expect(BulkActionBar).toBeTruthy();
      expect(typeof BulkActionBar).toBe('object');
    });
  });

  describe('component rendering', () => {
    it('should render with theme support when visible', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={0}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByTestId('bulk-action-bar')).toBeTruthy();
    });

    it('should not render when not visible', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={0}
            onMove={jest.fn()}
            visible={false}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('bulk-action-bar')).toBeNull();
    });

    it('should display Move button with count', () => {
      const { getByText } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={3}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByText('Move 3')).toBeTruthy();
    });

    it('should show count of 0 when no items selected', () => {
      const { getByText } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={0}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByText('Move 0')).toBeTruthy();
    });
  });

  describe('button states', () => {
    it('should disable all buttons when selectedCount is 0', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={0}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByTestId('bulk-move-button').props.accessibilityState.disabled).toBe(true);
    });

    it('should enable all buttons when selectedCount is greater than 0', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={3}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByTestId('bulk-move-button').props.accessibilityState.disabled).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('should call onMove when Move button is pressed', () => {
      const mockOnMove = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={3}
            onMove={mockOnMove}
            visible
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('bulk-move-button'));
      expect(mockOnMove).toHaveBeenCalledTimes(1);
    });

    it('should not call callbacks when buttons are disabled', () => {
      const mockOnMove = jest.fn();

      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={0}
            onMove={mockOnMove}
            visible
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('bulk-move-button'));

      expect(mockOnMove).not.toHaveBeenCalled();
    });
  });

  describe('prop validation', () => {
    it('should handle selectedCount changes correctly', () => {
      const { getByText, rerender } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={1}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByText('Move 1')).toBeTruthy();

      rerender(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={5}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByText('Move 5')).toBeTruthy();
    });

    it('should handle visibility changes correctly', () => {
      const { getByTestId, queryByTestId, rerender } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={3}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByTestId('bulk-action-bar')).toBeTruthy();

      rerender(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={3}
            onMove={jest.fn()}
            visible={false}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('bulk-action-bar')).toBeNull();
    });
  });

  describe('accessibility support', () => {
    it('should have proper testID for accessibility', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={3}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByTestId('bulk-action-bar')).toBeTruthy();
      expect(getByTestId('bulk-move-button')).toBeTruthy();
    });

    it('should have correct accessibility states for disabled buttons', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={0}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByTestId('bulk-move-button').props.accessibilityState.disabled).toBe(true);
    });

    it('should have correct accessibility states for enabled buttons', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <BulkActionBar
            selectedCount={3}
            onMove={jest.fn()}
            visible
          />
        </ThemeProvider>,
      );

      expect(getByTestId('bulk-move-button').props.accessibilityState.disabled).toBe(false);
    });
  });
});
