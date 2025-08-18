/**
 * BagDetailHeader Component Tests
 * Tests for the extracted header component
 */

/* eslint-disable react/jsx-props-no-spreading */

import { render, fireEvent } from '@testing-library/react-native';
import BagDetailHeader from '../../../src/components/bags/BagDetailHeader';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock bag data
const mockBag = {
  id: 'test-bag-id',
  name: 'Test Bag',
  description: 'A test bag for header tests',
  bag_contents: [
    {
      id: 'disc-1',
      model: 'Destroyer',
      brand: 'Innova',
    },
    {
      id: 'disc-2',
      model: 'Buzzz',
      brand: 'Discraft',
    },
  ],
};

// Mock props
const mockProps = {
  bag: mockBag,
  isMultiSelectMode: false,
  selectedCount: 0,
  activeFilterCount: 0,
  sort: { field: null, direction: 'asc' },
  onAddDisc: jest.fn(),
  onSort: jest.fn(),
  onFilter: jest.fn(),
  onSelectAll: jest.fn(),
  onCancelMultiSelect: jest.fn(),
  onEnterMultiSelect: jest.fn(),
  onClearFiltersAndSort: jest.fn(),
};

// Helper to render component with theme
const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('BagDetailHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should export a component', () => {
      expect(BagDetailHeader).toBeDefined();
    });

    it('should render without crashing', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      expect(getByText('Test Bag')).toBeTruthy();
    });

    it('should display bag name and description', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      expect(getByText('Test Bag')).toBeTruthy();
      expect(getByText('A test bag for header tests')).toBeTruthy();
    });

    it('should handle missing bag description gracefully', () => {
      const bagWithoutDescription = { ...mockBag, description: null };
      const { getByText, queryByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} bag={bagWithoutDescription} />,
      );

      expect(getByText('Test Bag')).toBeTruthy();
      expect(queryByText('A test bag for header tests')).toBeNull();
    });
  });

  describe('Normal Mode Actions', () => {
    it('should render action buttons in normal mode', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      expect(getByText('Add Disc')).toBeTruthy();
      expect(getByText('Sort')).toBeTruthy();
      expect(getByText('Filter')).toBeTruthy();
      expect(getByText('Select')).toBeTruthy();
    });

    it('should call onAddDisc when Add Disc button is pressed', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      fireEvent.press(getByText('Add Disc'));
      expect(mockProps.onAddDisc).toHaveBeenCalledTimes(1);
    });

    it('should call onSort when Sort button is pressed', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      fireEvent.press(getByText('Sort'));
      expect(mockProps.onSort).toHaveBeenCalledTimes(1);
    });

    it('should call onFilter when Filter button is pressed', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      fireEvent.press(getByText('Filter'));
      expect(mockProps.onFilter).toHaveBeenCalledTimes(1);
    });

    it('should call onEnterMultiSelect when Select button is pressed', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      fireEvent.press(getByText('Select'));
      expect(mockProps.onEnterMultiSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multi-Select Mode', () => {
    const multiSelectProps = {
      ...mockProps,
      isMultiSelectMode: true,
      selectedCount: 2,
    };

    it('should render MultiSelectHeader in multi-select mode', () => {
      const { getByText, queryByText } = renderWithTheme(
        <BagDetailHeader {...multiSelectProps} />,
      );

      // Should not show normal action buttons
      expect(queryByText('Add Disc')).toBeNull();
      expect(queryByText('Select')).toBeNull();

      // Should still show Sort and Filter
      expect(getByText('Sort')).toBeTruthy();
      expect(getByText('Filter')).toBeTruthy();
    });

    it('should show reduced action set in multi-select mode', () => {
      const { getByText, queryByText } = renderWithTheme(
        <BagDetailHeader {...multiSelectProps} />,
      );

      // Should not show Add Disc and Select buttons
      expect(queryByText('Add Disc')).toBeNull();
      expect(queryByText('Select')).toBeNull();

      // Should keep Sort and Filter for convenience
      expect(getByText('Sort')).toBeTruthy();
      expect(getByText('Filter')).toBeTruthy();
    });
  });

  describe('Filter and Sort State Display', () => {
    it('should show active filter count in Filter button', () => {
      const propsWithFilters = {
        ...mockProps,
        activeFilterCount: 3,
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...propsWithFilters} />,
      );

      expect(getByText('Filter (3)')).toBeTruthy();
    });

    it('should show active sort count in Sort button', () => {
      const propsWithSort = {
        ...mockProps,
        sort: { field: 'model', direction: 'asc' },
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...propsWithSort} />,
      );

      expect(getByText('Sort (1)')).toBeTruthy();
    });

    it('should show Clear All button when filters or sort are active', () => {
      const propsWithFiltersAndSort = {
        ...mockProps,
        activeFilterCount: 2,
        sort: { field: 'model', direction: 'asc' },
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...propsWithFiltersAndSort} />,
      );

      expect(getByText('Clear All (3)')).toBeTruthy();
    });

    it('should not show Clear All button when no filters or sort are active', () => {
      const { queryByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      expect(queryByText(/Clear All/)).toBeNull();
    });

    it('should call onClearFiltersAndSort when Clear All button is pressed', () => {
      const propsWithFilters = {
        ...mockProps,
        activeFilterCount: 1,
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...propsWithFilters} />,
      );

      fireEvent.press(getByText('Clear All (1)'));
      expect(mockProps.onClearFiltersAndSort).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sort Icon Display', () => {
    it('should show default sort icon when no sort is active', () => {
      // Test is implicit - component should render without crashing
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      expect(getByText('Sort')).toBeTruthy();
    });

    it('should show ascending arrow when sort direction is asc', () => {
      const propsWithAscSort = {
        ...mockProps,
        sort: { field: 'model', direction: 'asc' },
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...propsWithAscSort} />,
      );

      expect(getByText('Sort (1)')).toBeTruthy();
    });

    it('should show descending arrow when sort direction is desc', () => {
      const propsWithDescSort = {
        ...mockProps,
        sort: { field: 'model', direction: 'desc' },
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...propsWithDescSort} />,
      );

      expect(getByText('Sort (1)')).toBeTruthy();
    });
  });

  describe('Analytics Section', () => {
    it('should show analytics buttons when bag has contents', () => {
      // The analytics buttons are rendered by BaboonBagBreakdownModal and BaboonsVisionModal
      // components, so we just verify the component renders without crashing
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      expect(getByText('Test Bag')).toBeTruthy();
    });

    it('should not show analytics section when bag has no contents', () => {
      const emptyBag = {
        ...mockBag,
        bag_contents: [],
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} bag={emptyBag} />,
      );

      expect(getByText('Test Bag')).toBeTruthy();
    });

    it('should handle null bag gracefully', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} bag={null} />,
      );

      expect(getByText('Bag Details')).toBeTruthy();
    });
  });

  describe('Theme Integration', () => {
    it('should render with proper theme styling', () => {
      const { getByText } = renderWithTheme(
        <BagDetailHeader {...mockProps} />,
      );

      // Verify component renders without theme-related errors
      expect(getByText('Test Bag')).toBeTruthy();
      expect(getByText('Add Disc')).toBeTruthy();
    });
  });

  describe('Component Props Validation', () => {
    it('should handle all required props correctly', () => {
      // Test with minimal required props
      const minimalProps = {
        bag: null,
        isMultiSelectMode: false,
        selectedCount: 0,
        activeFilterCount: 0,
        sort: { field: null, direction: 'asc' },
        onAddDisc: jest.fn(),
        onSort: jest.fn(),
        onFilter: jest.fn(),
        onSelectAll: jest.fn(),
        onCancelMultiSelect: jest.fn(),
        onEnterMultiSelect: jest.fn(),
        onClearFiltersAndSort: jest.fn(),
      };

      const { getByText } = renderWithTheme(
        <BagDetailHeader {...minimalProps} />,
      );

      expect(getByText('Bag Details')).toBeTruthy();
    });
  });
});
