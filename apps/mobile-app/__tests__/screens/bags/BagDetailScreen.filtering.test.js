/**
 * BagDetailScreen Filtering Logic Tests
 * Tests the actual filtering logic implementation
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';
import { getBag } from '../../../src/services/bagService';

// Mock the bagService
jest.mock('../../../src/services/bagService', () => ({
  getBag: jest.fn(),
  getLostDiscCountForBag: jest.fn().mockResolvedValue(0),
}));

// Mock the filter and sort panels - return null to not render them
jest.mock('../../../src/design-system/components/FilterPanel', () => (
  function MockFilterPanel({ visible, onApplyFilters, onClose }) {
    if (!visible) return null;

    return (
      <MockedComponent
        testID="filter-panel"
        onApplyFilters={onApplyFilters}
        onClose={onClose}
      />
    );
  }
));

jest.mock('../../../src/design-system/components/SortPanel', () => (
  function MockSortPanel({ visible, onApplySort, onClose }) {
    if (!visible) return null;

    return (
      <MockedComponent
        testID="sort-panel"
        onApplySort={onApplySort}
        onClose={onClose}
      />
    );
  }
));

// Mock component for panels
function MockedComponent({
  testID, onApplyFilters, onApplySort, onClose,
}) {
  const { View, TouchableOpacity, Text } = require('react-native');

  return (
    <View testID={testID}>
      <TouchableOpacity testID={`${testID}-close`} onPress={onClose}>
        <Text>Close</Text>
      </TouchableOpacity>
      {onApplyFilters && (
        <TouchableOpacity
          testID={`${testID}-apply-brand-filter`}
          onPress={() => onApplyFilters({ brands: ['Innova'] })}
        >
          <Text>Filter by Innova</Text>
        </TouchableOpacity>
      )}
      {onApplyFilters && (
        <TouchableOpacity
          testID={`${testID}-apply-speed-filter`}
          onPress={() => onApplyFilters({ speed: ['10-15'] })}
        >
          <Text>Filter by Speed 10-15</Text>
        </TouchableOpacity>
      )}
      {onApplySort && (
        <TouchableOpacity
          testID={`${testID}-apply-sort`}
          onPress={() => onApplySort({ field: 'model', direction: 'asc' })}
        >
          <Text>Sort by Model A-Z</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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

// Mock bag data with diverse discs for comprehensive filtering tests
const mockBagData = {
  id: 'test-bag-id',
  name: 'Test Filtering Bag',
  description: 'Testing filtering functionality',
  bag_contents: [
    {
      id: 'disc-1',
      model: 'Destroyer',
      brand: 'Innova',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
      color: 'red',
      weight: '175',
      condition: 'good',
    },
    {
      id: 'disc-2',
      model: 'Buzzz',
      brand: 'Discraft',
      speed: 5,
      glide: 4,
      turn: -1,
      fade: 1,
      color: 'blue',
      weight: '177',
      condition: 'new',
    },
    {
      id: 'disc-3',
      model: 'Leopard',
      brand: 'Innova',
      speed: 6,
      glide: 5,
      turn: -2,
      fade: 1,
      color: 'yellow',
      weight: '172',
      condition: 'worn',
    },
    {
      id: 'disc-4',
      model: 'Zone',
      brand: 'Discraft',
      speed: 4,
      glide: 3,
      turn: 0,
      fade: 3,
      color: 'white',
      weight: '173',
      condition: 'beat-in',
    },
    {
      id: 'disc-5',
      model: 'Thunderbird',
      brand: 'Innova',
      speed: 9,
      glide: 5,
      turn: 0,
      fade: 2,
      color: 'orange',
      weight: '175',
      condition: 'good',
    },
    // Disc with disc_master fallback data
    {
      id: 'disc-6',
      // No direct model/brand, should fall back to disc_master
      disc_master: {
        model: 'Wraith',
        brand: 'Innova',
        speed: 11,
        glide: 5,
        turn: -1,
        fade: 3,
      },
      color: 'green',
      weight: '174',
      condition: 'new',
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

describe('BagDetailScreen Filtering Logic', () => {
  beforeEach(() => {
    getBag.mockResolvedValue(mockBagData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Brand Filtering', () => {
    it('should filter discs by brand correctly', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Your Discs (6)')).toBeTruthy();
      });

      // Open filter panel
      fireEvent.press(getByText('Filter'));

      await waitFor(() => {
        expect(getByTestId('filter-panel')).toBeTruthy();
      });

      // Apply Innova brand filter
      fireEvent.press(getByTestId('filter-panel-apply-brand-filter'));

      // Should show filtered results
      await waitFor(() => {
        expect(getByText('Your Discs (4 of 6)')).toBeTruthy();
      });

      // Should show Innova discs
      expect(getByText('Destroyer')).toBeTruthy();
      expect(getByText('Leopard')).toBeTruthy();
      expect(getByText('Thunderbird')).toBeTruthy();
      expect(getByText('Wraith')).toBeTruthy(); // From disc_master

      // Should not show Discraft discs
      expect(() => getByText('Buzzz')).toThrow();
      expect(() => getByText('Zone')).toThrow();
    });
  });

  describe('Speed Range Filtering', () => {
    it('should filter discs by speed range correctly', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Your Discs (6)')).toBeTruthy();
      });

      // Open filter panel
      fireEvent.press(getByText('Filter'));

      await waitFor(() => {
        expect(getByTestId('filter-panel')).toBeTruthy();
      });

      // Apply speed filter for high speed discs (10-15)
      fireEvent.press(getByTestId('filter-panel-apply-speed-filter'));

      // Should show filtered results
      await waitFor(() => {
        expect(getByText('Your Discs (2 of 6)')).toBeTruthy();
      });

      // Should show high speed discs
      expect(getByText('Destroyer')).toBeTruthy(); // Speed 12
      expect(getByText('Wraith')).toBeTruthy(); // Speed 11

      // Should not show lower speed discs
      expect(() => getByText('Buzzz')).toThrow(); // Speed 5
      expect(() => getByText('Leopard')).toThrow(); // Speed 6
      expect(() => getByText('Zone')).toThrow(); // Speed 4
      expect(() => getByText('Thunderbird')).toThrow(); // Speed 9
    });
  });

  describe('Filter State Management', () => {
    it('should show active filter count in button', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Filter')).toBeTruthy();
      });

      // Open and apply filter
      fireEvent.press(getByText('Filter'));
      fireEvent.press(getByTestId('filter-panel-apply-brand-filter'));

      // Filter button should show active state
      await waitFor(() => {
        expect(getByText('Filter (1)')).toBeTruthy();
      });
    });

    it('should show clear all button when filters are active', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Filter')).toBeTruthy();
      });

      // Apply filter
      fireEvent.press(getByText('Filter'));
      fireEvent.press(getByTestId('filter-panel-apply-brand-filter'));

      // Should show clear all button
      await waitFor(() => {
        expect(getByText('Clear All (1)')).toBeTruthy();
      });
    });

    it('should clear all filters when clear all is pressed', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Filter')).toBeTruthy();
      });

      // Apply filter
      fireEvent.press(getByText('Filter'));
      fireEvent.press(getByTestId('filter-panel-apply-brand-filter'));

      // Clear all filters
      await waitFor(() => {
        expect(getByText('Clear All (1)')).toBeTruthy();
      });

      fireEvent.press(getByText('Clear All (1)'));

      // Should show all discs again
      await waitFor(() => {
        expect(getByText('Your Discs (6)')).toBeTruthy();
        expect(getByText('Filter')).toBeTruthy(); // No active count
      });
    });
  });

  describe('Empty Filter Results', () => {
    it('should show empty state when no discs match filters', async () => {
      // Mock a bag with only Discraft discs
      getBag.mockResolvedValue({
        ...mockBagData,
        bag_contents: [
          {
            id: 'disc-1',
            model: 'Buzzz',
            brand: 'Discraft',
            speed: 5,
            glide: 4,
            turn: -1,
            fade: 1,
          },
        ],
      });

      const {
        getByText, getByTestId,
      } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Your Discs (1)')).toBeTruthy();
      });

      // Apply Innova filter (which won't match any discs)
      fireEvent.press(getByText('Filter'));
      fireEvent.press(getByTestId('filter-panel-apply-brand-filter'));

      await waitFor(() => {
        expect(getByText('No Matching Discs')).toBeTruthy();
        expect(getByText(/No discs match your current filters/)).toBeTruthy();
      });
    });
  });

  describe('Disc Master Fallback', () => {
    it('should use disc_master data when direct properties are missing', async () => {
      // Already tested above with the Wraith disc that has no direct model/brand
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Your Discs (6)')).toBeTruthy();
      });

      // Filter by brand should include disc with disc_master brand
      fireEvent.press(getByText('Filter'));
      fireEvent.press(getByTestId('filter-panel-apply-brand-filter'));

      await waitFor(() => {
        expect(getByText('Wraith')).toBeTruthy(); // Should find disc via disc_master
      });
    });
  });
});
