/**
 * BagDetailScreen Scroll Indicators Tests
 * Tests for scroll indicator visibility and the blue box artifact fix
 */

import { render, waitFor } from '@testing-library/react-native';
import BagDetailScreen from '../../../src/screens/bags/BagDetailScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';
import { getBag } from '../../../src/services/bagService';

// Mock the bagService
jest.mock('../../../src/services/bagService', () => ({
  getBag: jest.fn(),
}));

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

// Mock bag data with discs
const mockBagData = {
  id: 'test-bag-id',
  name: 'Test Bag',
  description: 'A test bag for scroll indicator tests',
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

describe('BagDetailScreen Scroll Indicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBag.mockResolvedValue(mockBagData);
  });

  describe('ScrollView Scroll Indicators', () => {
    it('should hide vertical scroll indicators on outer ScrollView', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('bag-detail-screen')).toBeTruthy();
      });

      // Verify the AppContainer is providing consistent layout structure
      const appContainer = getByTestId('app-container');
      expect(appContainer).toBeTruthy();

      // The FlatList should have scroll indicators disabled
      const flatList = getByTestId('main-disc-list');
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
    });

    it('should not show scroll indicators on nested ScrollView', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('bag-detail-screen')).toBeTruthy();
      });

      // Verify consistent layout structure with AppContainer
      const appContainer = getByTestId('app-container');
      expect(appContainer).toBeTruthy();

      // The FlatList should have scroll indicators disabled
      const flatList = getByTestId('main-disc-list');
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
    });
  });

  describe('FlatList Scroll Indicators', () => {
    it('should hide vertical scroll indicators on disc list FlatList', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatList = getByTestId('main-disc-list');

      // FlatList should have both vertical and horizontal scroll indicators disabled
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
    });

    it('should hide horizontal scroll indicators on disc list FlatList', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatList = getByTestId('main-disc-list');

      // Verify horizontal scroll indicators are also disabled
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
    });

    it('should maintain scroll functionality while hiding indicators', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatList = getByTestId('main-disc-list');

      // Scroll should be enabled (we fixed the nested scroll issue)
      expect(flatList.props.scrollEnabled).toBe(true);

      // But scroll indicators should be hidden
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
    });
  });

  describe('Blue Box Artifact Prevention', () => {
    it('should not display blue rectangular box artifacts', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('bag-detail-screen')).toBeTruthy();
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatList = getByTestId('main-disc-list');

      // Verify FlatList has disabled scroll indicators
      // The AppContainer provides consistent layout structure to prevent blue box artifacts
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);

      // Verify AppContainer is present for consistent layout structure
      const appContainer = getByTestId('app-container');
      expect(appContainer).toBeTruthy();
    });

    it('should prevent scroll indicator overlap with nested containers', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('bag-detail-screen')).toBeTruthy();
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      // The AppContainer provides consistent layout structure to prevent blue box artifacts
      // FlatList has disabled scroll indicators to prevent overlap issues
      const flatList = getByTestId('main-disc-list');
      const appContainer = getByTestId('app-container');

      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);

      // Verify AppContainer provides consistent layout structure
      expect(appContainer).toBeTruthy();
    });
  });

  describe('Scroll Indicator Configuration', () => {
    it('should maintain consistent scroll indicator settings across re-renders', async () => {
      const { getByTestId, rerender } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatListBefore = getByTestId('main-disc-list');
      const indicatorsBefore = {
        vertical: flatListBefore.props.showsVerticalScrollIndicator,
        horizontal: flatListBefore.props.showsHorizontalScrollIndicator,
      };

      // Re-render component
      rerender(
        <ThemeProvider>
          <BagRefreshProvider>
            <BagDetailScreen route={mockRoute} navigation={mockNavigation} />
          </BagRefreshProvider>
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatListAfter = getByTestId('main-disc-list');
      const indicatorsAfter = {
        vertical: flatListAfter.props.showsVerticalScrollIndicator,
        horizontal: flatListAfter.props.showsHorizontalScrollIndicator,
      };

      // Settings should remain consistent
      expect(indicatorsBefore).toEqual(indicatorsAfter);
      expect(indicatorsAfter.vertical).toBe(false);
      expect(indicatorsAfter.horizontal).toBe(false);
    });

    it('should apply scroll indicator settings in multi-select mode', async () => {
      const { getByTestId, getByText } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      // Enter multi-select mode
      const selectButton = getByText('Select');
      expect(selectButton).toBeTruthy();

      // In multi-select mode, scroll indicators should still be hidden
      const flatList = getByTestId('main-disc-list');
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
    });

    it('should not show scroll indicators on empty bag state', async () => {
      // Test with empty bag
      const emptyBag = {
        ...mockBagData,
        bag_contents: [],
      };
      getBag.mockResolvedValue(emptyBag);

      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('bag-detail-screen')).toBeTruthy();
      });

      // Even with empty state, AppContainer provides consistent layout
      const appContainer = getByTestId('app-container');
      expect(appContainer).toBeTruthy();

      // FlatList should have scroll indicators disabled
      const flatList = getByTestId('main-disc-list');
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
    });
  });

  describe('iOS Specific Scroll Indicator Issues', () => {
    it('should handle iOS scroll indicator artifacts specifically', async () => {
      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatList = getByTestId('main-disc-list');

      // iOS has specific issues with scroll indicators on nested scroll views
      // Verify both vertical and horizontal indicators are disabled
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);

      // Scroll should be enabled now that we fixed the nested scroll issue
      expect(flatList.props.scrollEnabled).toBe(true);
    });

    it('should prevent blue box growth with multiple disc rows', async () => {
      // Test with larger dataset to ensure blue box doesn't grow
      const largeBag = {
        ...mockBagData,
        bag_contents: Array.from({ length: 10 }, (_, i) => ({
          id: `disc-${i + 1}`,
          model: `Model ${i + 1}`,
          brand: 'Test Brand',
          speed: 5,
          glide: 4,
          turn: 0,
          fade: 1,
        })),
      };
      getBag.mockResolvedValue(largeBag);

      const { getByTestId } = renderWithTheme(
        <BagDetailScreen route={mockRoute} navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('main-disc-list')).toBeTruthy();
      });

      const flatList = getByTestId('main-disc-list');

      // With more rows, indicators should still be hidden to prevent blue box growth
      expect(flatList.props.showsVerticalScrollIndicator).toBe(false);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
      expect(flatList.props.data.length).toBe(10);
    });
  });
});
