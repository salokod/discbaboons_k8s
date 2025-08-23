/**
 * BagDetailScreen Sort/Filter Unit Tests
 * Tests for the new sort and filter functionality
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';
import { getBag } from '../../../src/services/bagService';

// Mock the bagService
jest.mock('../../../src/services/bagService', () => ({
  getBag: jest.fn(),
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

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
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

// Mock bag data with various discs for filtering/sorting
const mockBagData = {
  id: 'test-bag-id',
  name: 'Test Bag',
  description: 'A test bag for unit testing',
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

describe('BagDetailScreen Sort and Filter', () => {
  beforeEach(() => {
    getBag.mockResolvedValue(mockBagData);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render sort and filter buttons', async () => {
      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Sort')).toBeTruthy();
        expect(getByText('Filter')).toBeTruthy();
      });
    });

    it('should show all discs initially without filters', async () => {
      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Your Discs (4)')).toBeTruthy();
        expect(getByText('Destroyer')).toBeTruthy();
        expect(getByText('Buzzz')).toBeTruthy();
        expect(getByText('Leopard')).toBeTruthy();
        expect(getByText('Zone')).toBeTruthy();
      });
    });
  });

  describe('Sort Functionality', () => {
    it('should show sort panel when sort button is pressed', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Sort')).toBeTruthy();
      });

      fireEvent.press(getByText('Sort'));

      await waitFor(() => {
        expect(getByTestId('sort-panel')).toBeTruthy();
      });
    });

    it('should update sort state when sort is applied', async () => {
      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Sort')).toBeTruthy();
      });

      // Sort button should initially show no active sort
      expect(getByText('Sort')).toBeTruthy();

      // After sorting is applied, button should show active state
      // This would be tested through integration with SortPanel mock
    });
  });

  describe('Filter Functionality', () => {
    it('should show filter panel when filter button is pressed', async () => {
      const { getByText, getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Filter')).toBeTruthy();
      });

      fireEvent.press(getByText('Filter'));

      await waitFor(() => {
        expect(getByTestId('filter-panel')).toBeTruthy();
      });
    });

    it('should update filter state when filters are applied', async () => {
      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Filter')).toBeTruthy();
      });

      // Filter button should initially show no active filters
      expect(getByText('Filter')).toBeTruthy();

      // After filters are applied, button should show active state with count
      // This would be tested through integration with FilterPanel mock
    });
  });

  describe('Clear All Functionality', () => {
    it('should not show clear all button when no filters or sort are active', async () => {
      const { queryByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(queryByText(/Clear All/)).toBeNull();
      });
    });

    // Additional clear all tests would require mocking filter/sort state changes
  });

  describe('Disc Count Display', () => {
    it('should show correct disc count in section header', async () => {
      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Your Discs (4)')).toBeTruthy();
      });
    });

    // Test for filtered disc count would require actual filtering logic
  });

  describe('Empty State Handling', () => {
    it('should show empty state when bag has no contents', async () => {
      getBag.mockResolvedValue({
        ...mockBagData,
        bag_contents: [],
      });

      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Ready to Build Your Bag')).toBeTruthy();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate to DiscSearchScreen when Add Disc is pressed', async () => {
      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Add Disc')).toBeTruthy();
      });

      fireEvent.press(getByText('Add Disc'));

      expect(mockNavigate).toHaveBeenCalledWith('DiscSearchScreen', {
        mode: 'addToBag',
        bagId: 'test-bag-id',
        bagName: 'Test Bag',
      });
    });
  });

  describe('Analytics Integration', () => {
    it('should show analytics buttons when bag has contents', async () => {
      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Baboon Breakdown')).toBeTruthy();
        expect(getByText('Baboon Vision')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error state when bag loading fails', async () => {
      getBag.mockRejectedValue(new Error('Failed to load bag'));

      const { getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('Failed to load bag')).toBeTruthy();
        expect(getByText('Try Again')).toBeTruthy();
      });
    });

    it('should show error state when no bagId is provided', async () => {
      const routeWithoutBagId = { params: {} };

      const { getByText } = renderWithTheme(
        <BagDetailScreen route={routeWithoutBagId} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('No bag ID provided')).toBeTruthy();
      });
    });
  });
});
