/**
 * Test for contextual Lost Discs button in BagDetailHeader
 * Validates display conditions and styling
 */

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import BagDetailHeader from '../../../src/components/bags/BagDetailHeader';

// Mock dependencies
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    primary: '#007AFF',
    error: '#FF3B30',
    surface: '#F8F9FA',
    border: '#E5E5EA',
    info: '#34C759',
  }),
}));

// Mock the modal components to avoid complex dependencies
jest.mock('../../../src/components/modals/BaboonBagBreakdownModal', () => {
  const { View } = require('react-native');
  return function MockBaboonBagBreakdownModal() {
    return <View testID="mock-breakdown-modal" />;
  };
});

jest.mock('../../../src/components/modals/BaboonsVisionModal', () => {
  const { View } = require('react-native');
  return function MockBaboonsVisionModal() {
    return <View testID="mock-vision-modal" />;
  };
});

jest.mock('../../../src/components/bags/MultiSelectHeader', () => {
  const { View } = require('react-native');
  return function MockMultiSelectHeader() {
    return <View testID="mock-multi-select-header" />;
  };
});

describe('BagDetailHeader - Contextual Lost Discs Button', () => {
  const mockBag = {
    id: 'test-bag-1',
    name: 'Test Bag',
    description: 'A test bag',
    bag_contents: [
      {
        id: 'disc-1',
        disc_id: 'disc-1',
        brand: 'Innova',
        model: 'Destroyer',
        is_lost: false,
      },
    ],
  };

  const defaultProps = {
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
    filteredDiscCount: 1,
    lostDiscCount: 0,
    onViewLostDiscs: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display contextual Lost Discs button when lostDiscCount > 0', () => {
    const { getByTestId } = render(
      <BagDetailHeader
        bag={defaultProps.bag}
        isMultiSelectMode={defaultProps.isMultiSelectMode}
        selectedCount={defaultProps.selectedCount}
        activeFilterCount={defaultProps.activeFilterCount}
        sort={defaultProps.sort}
        onAddDisc={defaultProps.onAddDisc}
        onSort={defaultProps.onSort}
        onFilter={defaultProps.onFilter}
        onSelectAll={defaultProps.onSelectAll}
        onCancelMultiSelect={defaultProps.onCancelMultiSelect}
        onEnterMultiSelect={defaultProps.onEnterMultiSelect}
        onClearFiltersAndSort={defaultProps.onClearFiltersAndSort}
        filteredDiscCount={defaultProps.filteredDiscCount}
        lostDiscCount={3}
        onViewLostDiscs={defaultProps.onViewLostDiscs}
      />,
    );

    const lostDiscsButton = getByTestId('contextual-lost-discs-button');
    expect(lostDiscsButton).toBeTruthy();
  });

  it('should not display contextual Lost Discs button when lostDiscCount is 0', () => {
    const { queryByTestId } = render(
      <BagDetailHeader
        bag={defaultProps.bag}
        isMultiSelectMode={defaultProps.isMultiSelectMode}
        selectedCount={defaultProps.selectedCount}
        activeFilterCount={defaultProps.activeFilterCount}
        sort={defaultProps.sort}
        onAddDisc={defaultProps.onAddDisc}
        onSort={defaultProps.onSort}
        onFilter={defaultProps.onFilter}
        onSelectAll={defaultProps.onSelectAll}
        onCancelMultiSelect={defaultProps.onCancelMultiSelect}
        onEnterMultiSelect={defaultProps.onEnterMultiSelect}
        onClearFiltersAndSort={defaultProps.onClearFiltersAndSort}
        filteredDiscCount={defaultProps.filteredDiscCount}
        lostDiscCount={0}
        onViewLostDiscs={defaultProps.onViewLostDiscs}
      />,
    );

    const lostDiscsButton = queryByTestId('contextual-lost-discs-button');
    expect(lostDiscsButton).toBeNull();
  });

  it('should not display contextual Lost Discs button in multi-select mode', () => {
    const { queryByTestId } = render(
      <BagDetailHeader
        bag={defaultProps.bag}
        isMultiSelectMode
        selectedCount={defaultProps.selectedCount}
        activeFilterCount={defaultProps.activeFilterCount}
        sort={defaultProps.sort}
        onAddDisc={defaultProps.onAddDisc}
        onSort={defaultProps.onSort}
        onFilter={defaultProps.onFilter}
        onSelectAll={defaultProps.onSelectAll}
        onCancelMultiSelect={defaultProps.onCancelMultiSelect}
        onEnterMultiSelect={defaultProps.onEnterMultiSelect}
        onClearFiltersAndSort={defaultProps.onClearFiltersAndSort}
        filteredDiscCount={defaultProps.filteredDiscCount}
        lostDiscCount={3}
        onViewLostDiscs={defaultProps.onViewLostDiscs}
      />,
    );

    const lostDiscsButton = queryByTestId('contextual-lost-discs-button');
    expect(lostDiscsButton).toBeNull();
  });

  it('should show correct count in button text', () => {
    const { getByTestId } = render(
      <BagDetailHeader
        bag={defaultProps.bag}
        isMultiSelectMode={defaultProps.isMultiSelectMode}
        selectedCount={defaultProps.selectedCount}
        activeFilterCount={defaultProps.activeFilterCount}
        sort={defaultProps.sort}
        onAddDisc={defaultProps.onAddDisc}
        onSort={defaultProps.onSort}
        onFilter={defaultProps.onFilter}
        onSelectAll={defaultProps.onSelectAll}
        onCancelMultiSelect={defaultProps.onCancelMultiSelect}
        onEnterMultiSelect={defaultProps.onEnterMultiSelect}
        onClearFiltersAndSort={defaultProps.onClearFiltersAndSort}
        filteredDiscCount={defaultProps.filteredDiscCount}
        lostDiscCount={5}
        onViewLostDiscs={defaultProps.onViewLostDiscs}
      />,
    );

    const lostDiscsButton = getByTestId('contextual-lost-discs-button');

    // Check that the button contains an Icon with alert-circle-outline
    const iconElement = lostDiscsButton.findByType(Icon);
    expect(iconElement.props.name).toBe('alert-circle-outline');
    expect(iconElement.props.color).toBe('#FF9500');

    // Check that the button contains Text with the correct content
    const textElements = lostDiscsButton.findAllByType(Text);
    const lostDiscText = textElements.find((element) => Array.isArray(element.props.children)
      && element.props.children.includes('lost'));
    expect(lostDiscText).toBeTruthy();
    expect(lostDiscText.props.children).toEqual([5, ' ', 'lost']);
    expect(lostDiscText.props.style.color).toBe('#FF9500');
  });

  it('should have correct accessibility properties', () => {
    const { getByTestId } = render(
      <BagDetailHeader
        bag={defaultProps.bag}
        isMultiSelectMode={defaultProps.isMultiSelectMode}
        selectedCount={defaultProps.selectedCount}
        activeFilterCount={defaultProps.activeFilterCount}
        sort={defaultProps.sort}
        onAddDisc={defaultProps.onAddDisc}
        onSort={defaultProps.onSort}
        onFilter={defaultProps.onFilter}
        onSelectAll={defaultProps.onSelectAll}
        onCancelMultiSelect={defaultProps.onCancelMultiSelect}
        onEnterMultiSelect={defaultProps.onEnterMultiSelect}
        onClearFiltersAndSort={defaultProps.onClearFiltersAndSort}
        filteredDiscCount={defaultProps.filteredDiscCount}
        lostDiscCount={3}
        onViewLostDiscs={defaultProps.onViewLostDiscs}
      />,
    );

    const lostDiscsButton = getByTestId('contextual-lost-discs-button');
    expect(lostDiscsButton.props.accessibilityLabel).toBe('View 3 lost discs from this bag');
    expect(lostDiscsButton.props.accessibilityRole).toBe('button');
  });

  it('should use orange theming color', () => {
    const { getByTestId } = render(
      <BagDetailHeader
        bag={defaultProps.bag}
        isMultiSelectMode={defaultProps.isMultiSelectMode}
        selectedCount={defaultProps.selectedCount}
        activeFilterCount={defaultProps.activeFilterCount}
        sort={defaultProps.sort}
        onAddDisc={defaultProps.onAddDisc}
        onSort={defaultProps.onSort}
        onFilter={defaultProps.onFilter}
        onSelectAll={defaultProps.onSelectAll}
        onCancelMultiSelect={defaultProps.onCancelMultiSelect}
        onEnterMultiSelect={defaultProps.onEnterMultiSelect}
        onClearFiltersAndSort={defaultProps.onClearFiltersAndSort}
        filteredDiscCount={defaultProps.filteredDiscCount}
        lostDiscCount={3}
        onViewLostDiscs={defaultProps.onViewLostDiscs}
      />,
    );

    const lostDiscsButton = getByTestId('contextual-lost-discs-button');
    const buttonStyle = lostDiscsButton.props.style;

    expect(buttonStyle).toEqual(
      expect.objectContaining({
        borderColor: '#FF9500',
      }),
    );
  });
});
