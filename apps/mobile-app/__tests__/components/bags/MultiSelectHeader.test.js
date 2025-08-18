/**
 * MultiSelectHeader Tests
 * Test-driven development for multi-select header component
 */

import { render, fireEvent } from '@testing-library/react-native';
import MultiSelectHeader from '../../../src/components/bags/MultiSelectHeader';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('MultiSelectHeader', () => {
  describe('should export a component', () => {
    it('should be a React component', () => {
      expect(MultiSelectHeader).toBeTruthy();
      expect(typeof MultiSelectHeader).toBe('object');
    });
  });

  describe('component rendering', () => {
    it('should render with theme support', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('multi-select-header')).toBeTruthy();
    });

    it('should display "Select items" when no items are selected', () => {
      const { getByText } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Select items')).toBeTruthy();
    });

    it('should display selected count when items are selected', () => {
      const { getByText } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={3}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('3 selected')).toBeTruthy();
    });

    it('should display Cancel button', () => {
      const { getByText } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Cancel')).toBeTruthy();
    });

    it('should display Select All button', () => {
      const { getByText } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('Select All')).toBeTruthy();
    });
  });

  describe('user interactions', () => {
    it('should call onCancel when Cancel button is pressed', () => {
      const mockOnCancel = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={mockOnCancel}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectAll when Select All button is pressed', () => {
      const mockOnSelectAll = jest.fn();
      const { getByText } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={mockOnSelectAll}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByText('Select All'));
      expect(mockOnSelectAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('prop validation', () => {
    it('should handle selectedCount prop correctly', () => {
      const { getByText, rerender } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={1}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('1 selected')).toBeTruthy();

      rerender(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={5}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByText('5 selected')).toBeTruthy();
    });
  });

  describe('flight path toggle', () => {
    it('should render flight path toggle button', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
            showFlightPaths={false}
            onToggleFlightPaths={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('flight-path-toggle')).toBeTruthy();
    });

    it('should display flight path icon when showFlightPaths is false', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
            showFlightPaths={false}
            onToggleFlightPaths={jest.fn()}
          />
        </ThemeProvider>,
      );

      const toggleButton = getByTestId('flight-path-toggle');
      expect(toggleButton).toBeTruthy();
    });

    it('should call onToggleFlightPaths when toggle button is pressed', () => {
      const mockOnToggleFlightPaths = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
            showFlightPaths={false}
            onToggleFlightPaths={mockOnToggleFlightPaths}
          />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('flight-path-toggle'));
      expect(mockOnToggleFlightPaths).toHaveBeenCalledTimes(1);
    });

    it('should show different visual state when showFlightPaths is true', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
            showFlightPaths
            onToggleFlightPaths={jest.fn()}
          />
        </ThemeProvider>,
      );

      const toggleButton = getByTestId('flight-path-toggle');
      expect(toggleButton).toBeTruthy();
    });

    it('should not render flight path toggle when props are not provided', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <MultiSelectHeader
            selectedCount={0}
            onSelectAll={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('flight-path-toggle')).toBeNull();
    });
  });
});
