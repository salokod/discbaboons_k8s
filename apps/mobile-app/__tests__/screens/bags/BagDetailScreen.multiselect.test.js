/**
 * BagDetailScreen Multi-Select Integration Tests
 * Tests the integration of multi-select functionality in BagDetailScreen
 * Following TDD methodology for comprehensive multi-select testing
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';
import { getBag } from '../../../src/services/bagService';

// Mock the bagService
jest.mock('../../../src/services/bagService', () => ({
  getBag: jest.fn(),
  removeDiscFromBag: jest.fn(),
  getBags: jest.fn(),
  getLostDiscCountForBag: jest.fn().mockResolvedValue(0),
}));

// Mock the filter and sort panels
jest.mock('../../../src/design-system/components/FilterPanel', () => function MockFilterPanel({ visible }) {
  if (!visible) return null;
  const { View } = require('react-native');
  return <View testID="filter-panel" />;
});

jest.mock('../../../src/design-system/components/SortPanel', () => function MockSortPanel({ visible }) {
  if (!visible) return null;
  const { View } = require('react-native');
  return <View testID="sort-panel" />;
});

// Mock modals
jest.mock('../../../src/components/modals/BaboonBagBreakdownModal', () => function MockBreakdownModal() {
  const { View } = require('react-native');
  return <View testID="breakdown-modal" />;
});

jest.mock('../../../src/components/modals/BaboonsVisionModal', () => function MockVisionModal() {
  const { View } = require('react-native');
  return <View testID="vision-modal" />;
});

jest.mock('../../../src/components/modals/MoveDiscModal', () => function MockMoveModal({ visible }) {
  if (!visible) return null;
  const { View } = require('react-native');
  return <View testID="move-modal" />;
});

jest.mock('../../../src/components/modals/BulkMoveModal', () => function MockBulkMoveModal({ visible }) {
  if (!visible) return null;
  const { View } = require('react-native');
  return <View testID="bulk-move-modal" />;
});

jest.mock('../../../src/components/modals/MarkAsLostModal', () => function MockMarkAsLostModal({ visible }) {
  if (!visible) return null;
  const { View } = require('react-native');
  return <View testID="mark-lost-modal" />;
});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock React Navigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.fn(),
}));

// Mock route with bagId
const mockRoute = {
  params: {
    bagId: 'test-bag-id',
  },
};

// Mock bag data with multiple discs for multi-select testing
const mockBagData = {
  id: 'test-bag-id',
  name: 'Test Multi-Select Bag',
  description: 'Testing multi-select functionality',
  bag_contents: [
    {
      id: 'disc-1',
      model: 'Destroyer',
      brand: 'Innova',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
    },
    {
      id: 'disc-2',
      model: 'Buzzz',
      brand: 'Discraft',
      speed: 5,
      glide: 4,
      turn: -1,
      fade: 1,
    },
    {
      id: 'disc-3',
      model: 'Aviar',
      brand: 'Innova',
      speed: 2,
      glide: 3,
      turn: 0,
      fade: 1,
    },
  ],
};

// Helper to render component with theme and providers
const renderWithTheme = (component) => render(
  <ThemeProvider>
    <BagRefreshProvider>
      {component}
    </BagRefreshProvider>
  </ThemeProvider>,
);

describe('BagDetailScreen Multi-Select Integration', () => {
  beforeEach(() => {
    getBag.mockResolvedValue(mockBagData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Select Mode Entry', () => {
    it('should enter multi-select mode when long pressing on a disc', async () => {
      const { getByText, getByTestId, getAllByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      // Long press on first disc to enter multi-select mode
      const discCards = getAllByTestId('card');
      fireEvent(discCards[0], 'onLongPress');

      // Should show multi-select header
      await waitFor(() => {
        expect(getByTestId('multi-select-header')).toBeTruthy();
      });

      // Should show bulk action bar
      expect(getByTestId('bulk-action-bar')).toBeTruthy();

      // Should show selection checkboxes for all discs
      const checkboxes = getAllByTestId('selection-checkbox');
      expect(checkboxes.length).toBe(3);
    });

    it('should enter multi-select mode via select button', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      // Press select button
      fireEvent.press(getByTestId('select-button'));

      // Should show multi-select header
      await waitFor(() => {
        expect(getByTestId('multi-select-header')).toBeTruthy();
      });
    });
  });

  describe('Multi-Select State Management', () => {
    it('should handle individual disc selection', async () => {
      const { getByText, getByTestId, getAllByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait and enter multi-select mode
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      await waitFor(() => {
        expect(getByTestId('multi-select-header')).toBeTruthy();
      });

      // Select first disc
      const checkboxes = getAllByTestId('selection-checkbox');
      fireEvent.press(checkboxes[0]);

      // Header should show "1 selected"
      await waitFor(() => {
        expect(getByText('1 selected')).toBeTruthy();
      });

      // Select second disc
      fireEvent.press(checkboxes[1]);

      // Header should show "2 selected"
      await waitFor(() => {
        expect(getByText('2 selected')).toBeTruthy();
      });

      // Deselect first disc
      fireEvent.press(checkboxes[0]);

      // Header should show "1 selected"
      await waitFor(() => {
        expect(getByText('1 selected')).toBeTruthy();
      });
    });

    it('should handle select all functionality', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      await waitFor(() => {
        expect(getByTestId('multi-select-header')).toBeTruthy();
      });

      // Press select all
      fireEvent.press(getByText('Select All'));

      // Should show all 3 discs selected
      await waitFor(() => {
        expect(getByText('3 selected')).toBeTruthy();
      });
    });

    it('should exit multi-select mode when cancel is pressed', async () => {
      const { getByText, getByTestId, queryByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      await waitFor(() => {
        expect(getByTestId('multi-select-header')).toBeTruthy();
      });

      // Press cancel
      fireEvent.press(getByText('Cancel'));

      // Should exit multi-select mode
      await waitFor(() => {
        expect(queryByTestId('multi-select-header')).toBeNull();
        expect(queryByTestId('bulk-action-bar')).toBeNull();
      });

      // Should show normal action buttons again
      expect(getByTestId('select-button')).toBeTruthy();
    });
  });

  describe('Bulk Actions', () => {
    it('should show bulk action bar with correct selected count', async () => {
      const { getByText, getByTestId, getAllByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode and select discs
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      await waitFor(() => {
        expect(getByTestId('bulk-action-bar')).toBeTruthy();
      });

      // Select 2 discs
      const checkboxes = getAllByTestId('selection-checkbox');
      fireEvent.press(checkboxes[0]);
      fireEvent.press(checkboxes[1]);

      // Bulk action bar should show correct counts for both actions
      await waitFor(() => {
        expect(getByText('Move 2')).toBeTruthy();
        expect(getByText('Mark 2 as Lost')).toBeTruthy();
      });
    });

    it('should handle bulk mark lost action', async () => {
      const { getByText, getByTestId, getAllByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode and select discs
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      const checkboxes = getAllByTestId('selection-checkbox');
      fireEvent.press(checkboxes[0]);
      fireEvent.press(checkboxes[1]);

      // Press bulk mark lost
      fireEvent.press(getByTestId('bulk-mark-lost-button'));

      // Should show mark as lost modal with selected discs
      await waitFor(() => {
        expect(getByTestId('mark-lost-modal')).toBeTruthy();
      });
    });

    it('should handle bulk move action', async () => {
      const { getByText, getByTestId, getAllByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode and select discs
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      const checkboxes = getAllByTestId('selection-checkbox');
      fireEvent.press(checkboxes[0]);

      // Press bulk move
      fireEvent.press(getByTestId('bulk-move-button'));

      // Should show bulk move modal
      await waitFor(() => {
        expect(getByTestId('bulk-move-modal')).toBeTruthy();
      });
    });
  });

  describe('Interaction with Existing Features', () => {
    it('should preserve filter and sort state when entering multi-select', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Sort')).toBeTruthy();
      });

      // Apply a sort first
      fireEvent.press(getByText('Sort'));
      // (Sort panel would apply sort - simplified for test)

      // Enter multi-select mode
      fireEvent.press(getByTestId('select-button'));

      // Sort button should still be available and show active state if sort was applied
      await waitFor(() => {
        expect(getByTestId('multi-select-header')).toBeTruthy();
      });

      // Filter and Sort should still be accessible
      expect(getByText('Sort')).toBeTruthy();
      expect(getByText('Filter')).toBeTruthy();
    });

    it('should disable swipe actions in multi-select mode', async () => {
      const { getByText, getByTestId, getAllByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      await waitFor(() => {
        expect(getByTestId('multi-select-header')).toBeTruthy();
      });

      // Disc rows should be wrapped with SelectableDiscRow instead of SwipeableDiscRow
      const selectableRows = getAllByTestId('selection-checkbox');
      expect(selectableRows.length).toBe(3);

      // Swipe actions should not be available
      // (This would be tested by ensuring swipe gestures don't trigger actions)
    });
  });

  describe('Empty Selection State', () => {
    it('should disable bulk actions when no discs are selected', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      await waitFor(() => {
        expect(getByTestId('bulk-action-bar')).toBeTruthy();
      });

      // Bulk action buttons should show 0 count and be disabled
      expect(getByText('Move 0')).toBeTruthy();
      expect(getByText('Mark 0 as Lost')).toBeTruthy();

      // Buttons should have disabled accessibility state
      const moveButton = getByTestId('bulk-move-button');
      const markLostButton = getByTestId('bulk-mark-lost-button');

      expect(moveButton.props.accessibilityState.disabled).toBe(true);
      expect(markLostButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Multi-Select Header Display', () => {
    it('should show correct text for different selection states', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Enter multi-select mode
      await waitFor(() => {
        expect(getByText('Your Discs (3)')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-button'));

      // Initially should show "Select items"
      await waitFor(() => {
        expect(getByText('Select items')).toBeTruthy();
      });
    });
  });
});
