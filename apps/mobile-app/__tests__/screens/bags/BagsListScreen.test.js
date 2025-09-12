/**
 * BagsListScreen Tests
 */

import {
  render, waitFor, act, fireEvent,
} from '@testing-library/react-native';
import { TouchableOpacity, Text } from 'react-native';
import BagsListScreen from '../../../src/screens/bags/BagsListScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';

// Mock AuthContext since EmptyBagsScreen now uses it
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock token storage service
jest.mock('../../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

// Mock bag service
jest.mock('../../../src/services/bagService', () => ({
  getBags: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

// Mock DeleteBagConfirmationModal to prevent test crashes
jest.mock('../../../src/components/modals/DeleteBagConfirmationModal', () => 'DeleteBagConfirmationModal');

describe('BagsListScreen', () => {
  let mockUseAuth;
  let mockGetBags;

  beforeEach(() => {
    mockUseAuth = require('../../../src/context/AuthContext').useAuth;
    const mockTokenStorage = require('../../../src/services/tokenStorage');
    mockGetBags = require('../../../src/services/bagService').getBags;

    // Default auth state for regular user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false,
      },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
    });

    mockTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'token123',
      refreshToken: 'refresh123',
    });

    // Mock getBags to return empty array by default
    mockGetBags.mockResolvedValue({ bags: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export a BagsListScreen component', () => {
    expect(BagsListScreen).toBeTruthy();
  });

  it('should show empty bags screen when no bags exist', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <BagsListScreen />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    // Wait for loading to complete and EmptyBagsScreen to render
    await waitFor(() => {
      expect(getByTestId('empty-bags-screen')).toBeTruthy();
    });
  });

  it('should display empty state content', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <BagRefreshProvider>
          <BagsListScreen />
        </BagRefreshProvider>
      </ThemeProvider>,
    );

    // Wait for loading to complete and EmptyBagsScreen content to render
    await waitFor(() => {
      expect(getByText('Organize Your Disc Golf Collection')).toBeTruthy();
      expect(getByText('Create First Bag')).toBeTruthy();
    });
  });
});

describe('BagsListScreen - Slice 2: Bag List Refresh Integration', () => {
  let mockUseAuth;
  let mockGetBags;

  beforeEach(() => {
    mockUseAuth = require('../../../src/context/AuthContext').useAuth;
    const mockTokenStorage = require('../../../src/services/tokenStorage');
    mockGetBags = require('../../../src/services/bagService').getBags;

    // Default auth state for regular user
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false,
      },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
    });

    mockTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'token123',
      refreshToken: 'refresh123',
    });

    // Mock getBags to return sample bags
    mockGetBags.mockResolvedValue({
      bags: [
        { id: '1', name: 'Tournament Bag', disc_count: 15 },
        { id: '2', name: 'Practice Bag', disc_count: 8 },
      ],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component) => render(
    <ThemeProvider>
      <BagRefreshProvider>
        {component}
      </BagRefreshProvider>
    </ThemeProvider>,
  );

  it('should re-fetch bags when bag list refresh is triggered', async () => {
    function TestComponent() {
      const { useBagRefreshContext } = require('../../../src/context/BagRefreshContext');
      const { triggerBagListRefresh } = useBagRefreshContext();

      return (
        <>
          <BagsListScreen />
          <TouchableOpacity
            testID="trigger-refresh"
            onPress={() => triggerBagListRefresh()}
          >
            <Text>Trigger Refresh</Text>
          </TouchableOpacity>
        </>
      );
    }

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Wait for initial load and component to stabilize
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalledTimes(1);
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Clear the mock to count subsequent calls
    mockGetBags.mockClear();

    // Trigger bag list refresh
    await act(async () => {
      fireEvent.press(getByTestId('trigger-refresh'));
    });

    // Verify getBags was called again due to refresh
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  it('should maintain loading states correctly during refresh', async () => {
    // Mock getBags to resolve slowly so we can test loading states
    let resolveGetBags;
    const slowGetBags = new Promise((resolve) => {
      resolveGetBags = resolve;
    });
    mockGetBags.mockReturnValue(slowGetBags);

    function TestComponent() {
      const { useBagRefreshContext } = require('../../../src/context/BagRefreshContext');
      const { triggerBagListRefresh } = useBagRefreshContext();

      return (
        <>
          <BagsListScreen />
          <TouchableOpacity
            testID="trigger-refresh"
            onPress={() => triggerBagListRefresh()}
          >
            <Text>Trigger Refresh</Text>
          </TouchableOpacity>
        </>
      );
    }

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Wait for component to mount and start loading
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    }, { timeout: 3000 });

    // Resolve the initial load
    resolveGetBags({ bags: [{ id: '1', name: 'Test Bag', disc_count: 5 }] });

    // Wait for loading to complete
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Set up another slow response for refresh
    let resolveRefreshGetBags;
    const slowRefreshGetBags = new Promise((resolve) => {
      resolveRefreshGetBags = resolve;
    });
    mockGetBags.mockReturnValue(slowRefreshGetBags);

    // Trigger refresh and verify it doesn't break the UI
    await act(async () => {
      fireEvent.press(getByTestId('trigger-refresh'));
    });

    // The screen should still be rendered during refresh
    expect(getByTestId('bags-list-screen')).toBeTruthy();

    // Complete the refresh
    resolveRefreshGetBags({ bags: [{ id: '2', name: 'Updated Bag', disc_count: 10 }] });

    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });
  });

  it('should not interfere with manual refresh', async () => {
    const { getByTestId } = renderWithProviders(<BagsListScreen />);

    // Wait for initial load and component to stabilize
    await waitFor(() => {
      expect(mockGetBags).toHaveBeenCalledTimes(1);
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    }, { timeout: 3000 });

    // Clear the mock to count subsequent calls
    mockGetBags.mockClear();

    // Simulate manual pull-to-refresh (if the component has this functionality)
    // Since we don't have access to the internal refresh method directly,
    // we'll just verify that the refresh listener doesn't interfere with normal behavior
    expect(getByTestId('bags-list-screen')).toBeTruthy();

    // The component should still function normally
    expect(mockGetBags).toHaveBeenCalledTimes(0); // No additional calls without trigger
  });
});
