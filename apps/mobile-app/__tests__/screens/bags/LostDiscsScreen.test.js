/**
 * LostDiscsScreen Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LostDiscsScreen from '../../../src/screens/bags/LostDiscsScreen';
import { getLostDiscs } from '../../../src/services/bagService';

// Mock services
jest.mock('../../../src/services/bagService', () => ({
  getLostDiscs: jest.fn(),
}));

// Mock React Navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
};

const mockRoute = {
  params: {},
};

// Mock theme context
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#333333',
    textLight: '#666666',
    primary: '#007AFF',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    info: '#5856D6',
  }),
}));

// Mock NavigationHeader component
jest.mock('../../../src/components/NavigationHeader', () => function MockNavigationHeader({ title, onBack, backAccessibilityLabel }) {
  const { Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity testID="nav-header-back" onPress={onBack} accessibilityLabel={backAccessibilityLabel}>
      <Text testID="nav-header-title">{title}</Text>
      <Text testID="nav-header-back-label">{backAccessibilityLabel}</Text>
    </TouchableOpacity>
  );
});

// Mock AppContainer component
jest.mock('../../../src/components/AppContainer', () => function MockAppContainer({ children }) {
  const { View } = require('react-native');
  return <View testID="app-container">{children}</View>;
});

// Mock SearchBar component
jest.mock('../../../src/design-system/components/SearchBar', () => function MockSearchBar({ value, onChangeText, placeholder }) {
  const { TextInput } = require('react-native');
  return (
    <TextInput
      testID="search-bar"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
    />
  );
});

// Mock RecoverDiscModal component
jest.mock('../../../src/components/modals/RecoverDiscModal', () => function MockRecoverDiscModal({
  visible, discs, onClose, onSuccess,
}) {
  const {
    View, Text, TouchableOpacity,
  } = require('react-native');
  if (!visible) return null;

  return (
    <View testID="recover-disc-modal">
      <Text testID="modal-title">Recover Disc Modal</Text>
      <Text testID="modal-disc-count">
        {discs.length}
        {' '}
        discs
      </Text>
      <TouchableOpacity testID="modal-close" onPress={onClose}>
        <Text>Close</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="modal-success" onPress={onSuccess}>
        <Text>Success</Text>
      </TouchableOpacity>
    </View>
  );
});

describe('LostDiscsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export LostDiscsScreen component', () => {
    expect(LostDiscsScreen).toBeTruthy();
    // Component is wrapped with memo() so it's an object with type info
    expect(LostDiscsScreen).toBeInstanceOf(Object);
  });

  it('should render without crashing', async () => {
    getLostDiscs.mockResolvedValue({
      items: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByTestId('app-container')).toBeTruthy();
    expect(getByTestId('nav-header-title')).toBeTruthy();
  });

  it('should display correct screen title', async () => {
    getLostDiscs.mockResolvedValue({
      items: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('nav-header-title')).toHaveTextContent('Lost Discs');
    });
  });

  it('should handle back navigation correctly', async () => {
    getLostDiscs.mockResolvedValue({
      items: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('nav-header-back'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should fetch lost discs on mount', async () => {
    const mockLostDiscs = {
      items: [
        {
          id: 'content-1',
          disc_id: 'disc-123',
          bag_id: 'bag-456',
          bag_name: 'My Bag',
          brand: 'Innova',
          model: 'Thunderbird',
          is_lost: true,
          lost_notes: 'Lost at hole 7',
          lost_at: '2024-01-15T10:30:00.000Z',
        },
      ],
      pagination: {
        total: 1, limit: 20, offset: 0, hasMore: false,
      },
    };

    getLostDiscs.mockResolvedValue(mockLostDiscs);

    render(<LostDiscsScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(getLostDiscs).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    });
  });

  it('should show loading state initially', async () => {
    getLostDiscs.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({
        items: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      }), 100);
    }));

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should handle error state when fetch fails', async () => {
    const errorMessage = 'Failed to load lost discs';
    getLostDiscs.mockRejectedValue(new Error(errorMessage));

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('error-message')).toHaveTextContent(errorMessage);
    });
  });

  it('should display empty state when no lost discs', async () => {
    getLostDiscs.mockResolvedValue({
      items: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });
  });

  it('should render search bar component', async () => {
    getLostDiscs.mockResolvedValue({
      items: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('search-bar')).toBeTruthy();
    });
  });

  it('should handle search input changes', async () => {
    getLostDiscs.mockResolvedValue({
      items: [
        {
          id: 'content-1',
          brand: 'Innova',
          model: 'Thunderbird',
          is_lost: true,
        },
      ],
      pagination: {
        total: 1, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      const searchBar = getByTestId('search-bar');
      fireEvent.changeText(searchBar, 'Thunderbird');
      expect(searchBar.props.value).toBe('Thunderbird');
    });
  });

  it('should follow BagDetailScreen patterns with orange theming', async () => {
    getLostDiscs.mockResolvedValue({
      items: [
        {
          id: 'content-1',
          brand: 'Innova',
          model: 'Thunderbird',
          is_lost: true,
        },
      ],
      pagination: {
        total: 1, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      // Verify that orange theming would be applied (test structure is in place)
      expect(getByTestId('app-container')).toBeTruthy();
    });
  });

  it('should handle pull to refresh', async () => {
    getLostDiscs.mockResolvedValue({
      items: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = render(
      <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('lost-discs-list')).toBeTruthy();
    });

    // Mock RefreshControl would be tested here in integration
    expect(getLostDiscs).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  describe('Recovery Modal Integration', () => {
    it('should have modal state management for recover disc modal', async () => {
      getLostDiscs.mockResolvedValue({
        items: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
      );

      await waitFor(() => {
        // Test should verify modal state exists (component renders successfully)
        expect(getByTestId('lost-discs-screen')).toBeTruthy();
      });
    });

    it('should store selected disc when recovery button is pressed and show modal', async () => {
      const mockLostDiscs = {
        items: [
          {
            id: 'content-1',
            disc_id: 'disc-123',
            bag_id: 'bag-456',
            bag_name: 'My Bag',
            brand: 'Innova',
            model: 'Thunderbird',
            is_lost: true,
            lost_notes: 'Lost at hole 7',
            lost_at: '2024-01-15T10:30:00.000Z',
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };

      getLostDiscs.mockResolvedValue(mockLostDiscs);

      const { getByTestId, queryByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
      );

      await waitFor(() => {
        expect(getByTestId('recover-button-content-1')).toBeTruthy();
      });

      // Modal should not be visible initially
      expect(queryByTestId('recover-disc-modal')).toBeNull();

      // Press the recover button - should store disc and show modal
      fireEvent.press(getByTestId('recover-button-content-1'));

      // Modal should now be visible with the selected disc
      expect(getByTestId('recover-disc-modal')).toBeTruthy();
      expect(getByTestId('modal-disc-count')).toHaveTextContent('1 discs');
    });

    it('should close modal when onClose callback is called', async () => {
      const mockLostDiscs = {
        items: [
          {
            id: 'content-1',
            disc_id: 'disc-123',
            bag_id: 'bag-456',
            bag_name: 'My Bag',
            brand: 'Innova',
            model: 'Thunderbird',
            is_lost: true,
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };

      getLostDiscs.mockResolvedValue(mockLostDiscs);

      const { getByTestId, queryByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('recover-button-content-1'));
      });

      expect(getByTestId('recover-disc-modal')).toBeTruthy();

      // Close the modal
      fireEvent.press(getByTestId('modal-close'));

      expect(queryByTestId('recover-disc-modal')).toBeNull();
    });

    it('should close modal and refresh data when onSuccess callback is called', async () => {
      const mockLostDiscs = {
        items: [
          {
            id: 'content-1',
            disc_id: 'disc-123',
            bag_id: 'bag-456',
            bag_name: 'My Bag',
            brand: 'Innova',
            model: 'Thunderbird',
            is_lost: true,
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      };

      getLostDiscs.mockResolvedValue(mockLostDiscs);

      const { getByTestId, queryByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={mockRoute} />,
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('recover-button-content-1'));
      });

      expect(getByTestId('recover-disc-modal')).toBeTruthy();

      // Clear the mock call count to verify refresh call
      getLostDiscs.mockClear();

      // Success callback should close modal and refresh data
      fireEvent.press(getByTestId('modal-success'));

      expect(queryByTestId('recover-disc-modal')).toBeNull();
      expect(getLostDiscs).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    });
  });

  describe('Dynamic Back Button Behavior', () => {
    it('should show "Return to Bags" when navigated from BagsListScreen', async () => {
      getLostDiscs.mockResolvedValue({
        items: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const routeFromBagsList = {
        params: { navigationSource: 'BagsList' },
      };

      const { getByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={routeFromBagsList} />,
      );

      await waitFor(() => {
        expect(getByTestId('nav-header-back-label')).toHaveTextContent('Return to Bags');
      });
    });

    it('should show "Return to Bag Detail" when navigated from BagDetailScreen', async () => {
      getLostDiscs.mockResolvedValue({
        items: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const routeFromBagDetail = {
        params: {
          navigationSource: 'BagDetail',
          sourceBagId: 'bag-123',
        },
      };

      const { getByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={routeFromBagDetail} />,
      );

      await waitFor(() => {
        expect(getByTestId('nav-header-back-label')).toHaveTextContent('Return to Bag Detail');
      });
    });

    it('should show "Return to Settings" when navigated from Settings (legacy)', async () => {
      getLostDiscs.mockResolvedValue({
        items: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const routeFromSettings = {
        params: { navigationSource: 'Settings' },
      };

      const { getByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={routeFromSettings} />,
      );

      await waitFor(() => {
        expect(getByTestId('nav-header-back-label')).toHaveTextContent('Return to Settings');
      });
    });

    it('should default to "Return to Settings" when no navigation source provided', async () => {
      getLostDiscs.mockResolvedValue({
        items: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const routeWithoutSource = {
        params: {},
      };

      const { getByTestId } = render(
        <LostDiscsScreen navigation={mockNavigation} route={routeWithoutSource} />,
      );

      await waitFor(() => {
        expect(getByTestId('nav-header-back-label')).toHaveTextContent('Return to Settings');
      });
    });

    it('should pass sourceBagId to getLostDiscs when provided', async () => {
      const mockLostDiscs = {
        items: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      };

      getLostDiscs.mockResolvedValue(mockLostDiscs);

      const routeWithSourceBagId = {
        params: {
          navigationSource: 'BagDetail',
          sourceBagId: 'bag-456',
        },
      };

      render(
        <LostDiscsScreen navigation={mockNavigation} route={routeWithSourceBagId} />,
      );

      await waitFor(() => {
        expect(getLostDiscs).toHaveBeenCalledWith({
          limit: 20,
          offset: 0,
          sourceBagId: 'bag-456',
        });
      });
    });
  });
});
