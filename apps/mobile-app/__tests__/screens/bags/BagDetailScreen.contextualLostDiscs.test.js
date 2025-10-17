/**
 * Test for contextual Lost Discs button in BagDetailScreen
 * Validates display conditions and navigation functionality
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import * as bagService from '../../../src/services/bagService';

// Mock dependencies
jest.mock('../../../src/services/bagService', () => ({
  getBag: jest.fn(),
  getLostDiscCountForBag: jest.fn(),
}));

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

jest.mock('../../../src/context/BagRefreshContext', () => ({
  useBagRefreshListener: jest.fn(),
  useBagRefreshContext: () => ({
    triggerBagListRefresh: jest.fn(),
  }),
}));

jest.mock('../../../src/hooks/useMultiSelect', () => ({
  __esModule: true,
  default: () => ({
    isMultiSelectMode: false,
    selectedIds: new Set(),
    selectedCount: 0,
    toggleSelection: jest.fn(),
    enterMultiSelectMode: jest.fn(),
    exitMultiSelectMode: jest.fn(),
  }),
}));

// Mock additional components that may cause issues
jest.mock('../../../src/components/bags/SwipeableDiscRow', () => {
  const { View, Text } = require('react-native');
  return function MockSwipeableDiscRow({ disc }) {
    return <View testID={`disc-row-${disc.id}`}><Text>{disc.model}</Text></View>;
  };
});

jest.mock('../../../src/components/modals/MoveDiscModal', () => {
  const { View } = require('react-native');
  return function MockMoveDiscModal() {
    return <View testID="mock-move-disc-modal" />;
  };
});

jest.mock('../../../src/components/modals/BulkMoveModal', () => {
  const { View } = require('react-native');
  return function MockBulkMoveModal() {
    return <View testID="mock-bulk-move-modal" />;
  };
});

jest.mock('../../../src/design-system/components/FilterPanel', () => {
  const { View } = require('react-native');
  return function MockFilterPanel() {
    return <View testID="mock-filter-panel" />;
  };
});

jest.mock('../../../src/design-system/components/SortPanel', () => {
  const { View } = require('react-native');
  return function MockSortPanel() {
    return <View testID="mock-sort-panel" />;
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('BagDetailScreen - Contextual Lost Discs Button', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
  };

  const mockRoute = {
    params: {
      bagId: 'test-bag-1',
    },
  };

  const mockBagWithLostDiscs = {
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
      {
        id: 'disc-2',
        disc_id: 'disc-2',
        brand: 'Discraft',
        model: 'Buzzz',
        is_lost: false,
      },
    ],
  };

  const mockBagWithoutLostDiscs = {
    id: 'test-bag-2',
    name: 'Test Bag 2',
    description: 'A test bag without lost discs',
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display contextual Lost Discs button when bag has lost discs', async () => {
    bagService.getBag.mockResolvedValue(mockBagWithLostDiscs);
    bagService.getLostDiscCountForBag.mockResolvedValue(3);

    const { queryByTestId } = render(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    // Wait for bag data to load
    await waitFor(() => {
      expect(bagService.getBag).toHaveBeenCalledWith('test-bag-1');
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(bagService.getLostDiscCountForBag).toHaveBeenCalledWith('test-bag-1');
    }, { timeout: 3000 });

    // Debug the component structure if needed
    // debug();

    // Check for contextual lost discs button
    await waitFor(() => {
      const lostDiscsButton = queryByTestId('contextual-lost-discs-button');
      expect(lostDiscsButton).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should not display contextual Lost Discs button when bag has no lost discs', async () => {
    const mockRouteWithoutLostDiscs = {
      params: {
        bagId: 'test-bag-2',
      },
    };

    bagService.getBag.mockResolvedValue(mockBagWithoutLostDiscs);
    bagService.getLostDiscCountForBag.mockResolvedValue(0);

    const { queryByTestId } = render(
      <BagDetailScreen route={mockRouteWithoutLostDiscs} navigation={mockNavigation} />,
    );

    // Wait for bag data to load
    await waitFor(() => {
      expect(bagService.getBag).toHaveBeenCalledWith('test-bag-2');
    });

    await waitFor(() => {
      expect(bagService.getLostDiscCountForBag).toHaveBeenCalledWith('test-bag-2');
    });

    // Button should not be present
    const lostDiscsButton = queryByTestId('contextual-lost-discs-button');
    expect(lostDiscsButton).toBeNull();
  });

  it('should show correct count badge on Lost Discs button', async () => {
    bagService.getBag.mockResolvedValue(mockBagWithLostDiscs);
    bagService.getLostDiscCountForBag.mockResolvedValue(3);

    const { getByTestId, getByText } = render(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(bagService.getLostDiscCountForBag).toHaveBeenCalledWith('test-bag-1');
    });

    // Check that button is present
    await waitFor(() => {
      const lostDiscsButton = getByTestId('contextual-lost-discs-button');
      expect(lostDiscsButton).toBeTruthy();
    });

    // Check button text includes count using getByText
    await waitFor(() => {
      expect(getByText('3 lost')).toBeTruthy();
    });
  });

  it('should navigate to LostDiscs screen with sourceBagId parameter when pressed', async () => {
    bagService.getBag.mockResolvedValue(mockBagWithLostDiscs);
    bagService.getLostDiscCountForBag.mockResolvedValue(3);

    const { getByTestId } = render(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(bagService.getLostDiscCountForBag).toHaveBeenCalledWith('test-bag-1');
    });

    const lostDiscsButton = getByTestId('contextual-lost-discs-button');
    fireEvent.press(lostDiscsButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('LostDiscs', {
      sourceBagId: 'test-bag-1',
      navigationSource: 'BagDetail',
    });
  });

  it('should have correct accessibility properties', async () => {
    bagService.getBag.mockResolvedValue(mockBagWithLostDiscs);
    bagService.getLostDiscCountForBag.mockResolvedValue(3);

    const { getByTestId } = render(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(bagService.getLostDiscCountForBag).toHaveBeenCalledWith('test-bag-1');
    });

    const lostDiscsButton = getByTestId('contextual-lost-discs-button');
    expect(lostDiscsButton.props.accessibilityLabel).toBe('View 3 lost discs from this bag');
    expect(lostDiscsButton.props.accessibilityRole).toBe('button');
  });

  it('should use orange theming color', async () => {
    bagService.getBag.mockResolvedValue(mockBagWithLostDiscs);
    bagService.getLostDiscCountForBag.mockResolvedValue(3);

    const { getByTestId } = render(
      <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(bagService.getLostDiscCountForBag).toHaveBeenCalledWith('test-bag-1');
    });

    const lostDiscsButton = getByTestId('contextual-lost-discs-button');
    const buttonStyle = lostDiscsButton.props.style;

    // Check for orange border color (#FF9500)
    expect(buttonStyle).toEqual(
      expect.objectContaining({
        borderColor: '#FF9500',
      }),
    );
  });
});
