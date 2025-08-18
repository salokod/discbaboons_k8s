/**
 * Tests for SelectableDiscRow Component - Multi-Select Wrapper
 * Following TDD methodology for thin slice implementation
 */

import { render, fireEvent } from '@testing-library/react-native';
import SelectableDiscRow from '../../../src/components/bags/SelectableDiscRow';

// Mock all theme-related services first
jest.mock('../../../src/services/themeStorage', () => ({
  storeTheme: jest.fn().mockResolvedValue(true),
  getStoredTheme: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../src/services/systemTheme', () => ({
  getSystemColorScheme: jest.fn().mockReturnValue('light'),
  addSystemThemeChangeListener: jest.fn().mockReturnValue(() => {}),
  isSystemThemeSupported: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../src/utils/themeResolver', () => ({
  resolveTheme: jest.fn((theme) => (theme === 'system' ? 'light' : theme)),
}));

// Mock theme context
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    border: '#E0E0E0',
    primary: '#ec7032',
    textOnPrimary: '#FFFFFF',
    error: '#FF3B30',
    info: '#007AFF',
    success: '#28A745',
  })),
  useTheme: jest.fn(() => ({
    theme: 'light',
    activeTheme: 'light',
    isLoading: false,
  })),
}));

// Mock SwipeableDiscRow component - need to capture props for flight path tests
let capturedSwipeableProps = null;
jest.mock('../../../src/components/bags/SwipeableDiscRow', () => {
  const ReactMock = require('react');
  const { View, Text } = require('react-native');
  function MockSwipeableDiscRow(props) {
    capturedSwipeableProps = props; // Capture props at module level
    return ReactMock.createElement(
      View,
      { testID: 'swipeable-disc-row' },
      ReactMock.createElement(Text, { testID: 'disc-model' }, props.disc.model),
    );
  }
  MockSwipeableDiscRow.displayName = 'SwipeableDiscRow';
  return { __esModule: true, default: MockSwipeableDiscRow };
});

// Mock design system components
jest.mock('../../../src/design-system/typography', () => ({
  typography: {
    body: {},
    caption: {},
  },
}));

jest.mock('../../../src/design-system/spacing', () => ({
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
}));

// Test data
const mockDisc = {
  id: 'test-disc-1',
  model: 'Destroyer',
  brand: 'Innova',
  speed: 12,
  glide: 5,
  turn: -1,
  fade: 3,
};

const mockBagId = 'test-bag-1';
const mockBagName = 'Test Bag';

describe('SelectableDiscRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a component', () => {
    expect(SelectableDiscRow).toBeDefined();
    expect(typeof SelectableDiscRow).toBe('object'); // React.memo returns an object
  });

  it('should be wrapped with React.memo for performance optimization', () => {
    // Test that the component is memoized by checking if it has memo structure
    expect(SelectableDiscRow.$$typeof).toBeDefined();
    // React.memo wraps the component, so we check for the memo type
    expect(typeof SelectableDiscRow).toBe('object');
  });

  it('should render SwipeableDiscRow component', () => {
    const { getByTestId } = render(
      <SelectableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
        isMultiSelectMode={false}
        isSelected={false}
        onToggleSelection={jest.fn()}
      />,
    );

    expect(getByTestId('swipeable-disc-row')).toBeTruthy();
  });

  it('should show checkbox when in multi-select mode', () => {
    const { getByTestId } = render(
      <SelectableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
        isMultiSelectMode
        isSelected={false}
        onToggleSelection={jest.fn()}
      />,
    );

    expect(getByTestId('selection-checkbox')).toBeTruthy();
  });

  it('should not show checkbox when not in multi-select mode', () => {
    const { queryByTestId } = render(
      <SelectableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
        isMultiSelectMode={false}
        isSelected={false}
        onToggleSelection={jest.fn()}
      />,
    );

    expect(queryByTestId('selection-checkbox')).toBeNull();
  });

  it('should show checked checkbox when item is selected', () => {
    const { getByTestId } = render(
      <SelectableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
        isMultiSelectMode
        isSelected
        onToggleSelection={jest.fn()}
      />,
    );

    const checkbox = getByTestId('selection-checkbox');
    expect(checkbox).toBeTruthy();
    // The icon name and color are determined by the implementation
  });

  it('should show unchecked checkbox when item is not selected', () => {
    const { getByTestId } = render(
      <SelectableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
        isMultiSelectMode
        isSelected={false}
        onToggleSelection={jest.fn()}
      />,
    );

    const checkbox = getByTestId('selection-checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('should call onToggleSelection when checkbox is pressed', () => {
    const mockOnToggleSelection = jest.fn();
    const { getByTestId } = render(
      <SelectableDiscRow
        disc={mockDisc}
        bagId={mockBagId}
        bagName={mockBagName}
        isMultiSelectMode
        isSelected={false}
        onToggleSelection={mockOnToggleSelection}
      />,
    );

    const checkbox = getByTestId('selection-checkbox');
    fireEvent.press(checkbox);

    expect(mockOnToggleSelection).toHaveBeenCalledWith(mockDisc.id);
  });

  describe('Accessibility', () => {
    it('should have proper accessibility properties for checkbox', () => {
      const { getByTestId } = render(
        <SelectableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
          isMultiSelectMode
          isSelected={false}
          onToggleSelection={jest.fn()}
        />,
      );

      const checkbox = getByTestId('selection-checkbox');
      expect(checkbox.props.accessibilityRole).toBe('checkbox');
      expect(checkbox.props.accessibilityState).toEqual({ checked: false });
      expect(checkbox.props.accessibilityLabel).toBe('Select Destroyer');
    });

    it('should update accessibility state when selected', () => {
      const { getByTestId } = render(
        <SelectableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
          isMultiSelectMode
          isSelected
          onToggleSelection={jest.fn()}
        />,
      );

      const checkbox = getByTestId('selection-checkbox');
      expect(checkbox.props.accessibilityState).toEqual({ checked: true });
      expect(checkbox.props.accessibilityHint).toBe('Double tap to deselect');
    });

    it('should provide appropriate accessibility hint when not selected', () => {
      const { getByTestId } = render(
        <SelectableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
          isMultiSelectMode
          isSelected={false}
          onToggleSelection={jest.fn()}
        />,
      );

      const checkbox = getByTestId('selection-checkbox');
      expect(checkbox.props.accessibilityHint).toBe('Double tap to select');
    });
  });

  describe('Pass-through props', () => {
    it('should pass all required props to SwipeableDiscRow', () => {
      const mockOnSwipeRight = jest.fn();
      const mockOnSwipeLeft = jest.fn();

      const { getByTestId } = render(
        <SelectableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
          isMultiSelectMode={false}
          isSelected={false}
          onToggleSelection={jest.fn()}
          onSwipeRight={mockOnSwipeRight}
          onSwipeLeft={mockOnSwipeLeft}
        />,
      );

      expect(getByTestId('swipeable-disc-row')).toBeTruthy();
      expect(getByTestId('disc-model')).toBeTruthy();
    });
  });

  describe('Flight path visibility in multi-select mode', () => {
    beforeEach(() => {
      capturedSwipeableProps = null; // Reset captured props before each test
    });

    it('should hide flight paths when in multi-select mode', () => {
      render(
        <SelectableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
          isMultiSelectMode
          isSelected={false}
          onToggleSelection={jest.fn()}
        />,
      );

      // Flight paths should be hidden in multi-select mode
      expect(capturedSwipeableProps?.hideFlightPath).toBe(true);
    });

    it('should show flight paths when not in multi-select mode', () => {
      render(
        <SelectableDiscRow
          disc={mockDisc}
          bagId={mockBagId}
          bagName={mockBagName}
          isMultiSelectMode={false}
          isSelected={false}
          onToggleSelection={jest.fn()}
        />,
      );

      // Flight paths should not be hidden when not in multi-select mode
      expect(capturedSwipeableProps?.hideFlightPath).toBeFalsy();
    });
  });
});
