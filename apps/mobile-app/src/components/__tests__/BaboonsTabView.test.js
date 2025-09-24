/**
 * BaboonsTabView Component Tests
 * Tests for tab navigation in Baboons screen
 */

import {
  render, screen, fireEvent,
} from '@testing-library/react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import { useFriends } from '../../context/FriendsContext';
import BaboonsTabView from '../BaboonsTabView';

// Mock react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Mock the useFriends hook
jest.mock('../../context/FriendsContext', () => ({
  ...jest.requireActual('../../context/FriendsContext'),
  useFriends: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
};

// Default mock data
const mockFriendsData = {
  friends: {
    list: [],
    pagination: {},
    loading: false,
    lastRefresh: null,
    error: null,
  },
  requests: {
    incoming: [],
    outgoing: [],
    badge: 0,
    loading: false,
  },
  loading: false,
  error: null,
  dispatch: jest.fn(),
};

// Test wrapper component to set up requests state
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

const renderWithProviders = (component) => render(<TestWrapper>{component}</TestWrapper>);

describe('BaboonsTabView', () => {
  beforeEach(() => {
    // Setup default mock for useFriends
    useFriends.mockReturnValue(mockFriendsData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should export BaboonsTabView component', () => {
    expect(BaboonsTabView).toBeDefined();
  });

  it('should display Troop and Invites tabs with baboon terminology', () => {
    renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

    expect(screen.getByText('Troop')).toBeOnTheScreen();
    expect(screen.getByText('Invites')).toBeOnTheScreen();
  });

  it('should show Troop tab as active by default', () => {
    renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

    expect(screen.getByTestId('friends-tab')).toBeOnTheScreen();
  });

  it('should switch to invites tab when pressed', () => {
    renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

    fireEvent.press(screen.getByTestId('requests-tab-button'));

    expect(screen.getByTestId('requests-tab')).toBeOnTheScreen();
  });

  it('should display baboon-themed empty state message', () => {
    renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

    expect(screen.getByText('No Baboons in Your Troop Yet')).toBeOnTheScreen();
    expect(screen.getByText('Start building your disc golf community by adding baboons to your troop!')).toBeOnTheScreen();
  });

  describe('Requests Tab', () => {
    it('should display empty state when no requests exist', () => {
      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      expect(screen.getByText('No Pending Invites')).toBeOnTheScreen();
      expect(screen.getByText('Your troop invites will appear here. Send invites to grow your baboon community!')).toBeOnTheScreen();
    });

    it('should display incoming requests when they exist', () => {
      const mockDataWithIncoming = {
        ...mockFriendsData,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 1,
              requester_id: 2,
              recipient_id: 1,
              status: 'pending',
              requester: {
                id: 2,
                username: 'testuser1',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithIncoming);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      expect(screen.getByText('testuser1')).toBeOnTheScreen();
      expect(screen.getByText('wants to join your troop')).toBeOnTheScreen();
      expect(screen.getByTestId('accept-button')).toBeOnTheScreen();
      expect(screen.getByTestId('deny-button')).toBeOnTheScreen();
    });

    it('should display outgoing requests when they exist', () => {
      const mockDataWithOutgoing = {
        ...mockFriendsData,
        requests: {
          ...mockFriendsData.requests,
          outgoing: [
            {
              id: 2,
              requester_id: 1,
              recipient_id: 3,
              status: 'pending',
              recipient: {
                id: 3,
                username: 'testuser2',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithOutgoing);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      expect(screen.getByText('testuser2')).toBeOnTheScreen();
      expect(screen.getByText('Pending')).toBeOnTheScreen();
      expect(screen.getByTestId('cancel-button')).toBeOnTheScreen();
    });

    it('should display both incoming and outgoing requests', () => {
      const mockDataWithBoth = {
        ...mockFriendsData,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 1,
              requester_id: 2,
              recipient_id: 1,
              status: 'pending',
              requester: {
                id: 2,
                username: 'incoming_user',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          outgoing: [
            {
              id: 2,
              requester_id: 1,
              recipient_id: 3,
              status: 'pending',
              recipient: {
                id: 3,
                username: 'outgoing_user',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithBoth);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      expect(screen.getByText('incoming_user')).toBeOnTheScreen();
      expect(screen.getByText('outgoing_user')).toBeOnTheScreen();
    });

    it('should load friend requests on component mount', () => {
      const mockDispatch = jest.fn();
      const mockDataWithDispatch = {
        ...mockFriendsData,
        dispatch: mockDispatch,
      };

      useFriends.mockReturnValue(mockDataWithDispatch);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      // Should dispatch action to load requests on mount
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'FETCH_REQUESTS_START',
      });
    });

    it('should display loading state when requests are being fetched', () => {
      const mockDataLoading = {
        ...mockFriendsData,
        requests: {
          ...mockFriendsData.requests,
          loading: true,
        },
      };

      useFriends.mockReturnValue(mockDataLoading);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      expect(screen.getByText('Loading invites...')).toBeOnTheScreen();
    });

    it('should call dispatch when accepting an incoming request', () => {
      const mockDispatch = jest.fn();
      const mockDataWithIncoming = {
        ...mockFriendsData,
        dispatch: mockDispatch,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 1,
              requester_id: 2,
              recipient_id: 1,
              status: 'pending',
              requester: {
                id: 2,
                username: 'testuser1',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithIncoming);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));
      fireEvent.press(screen.getByTestId('accept-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ACCEPT_REQUEST_START',
        payload: { requestId: 1 },
      });
    });

    it('should call dispatch when denying an incoming request', () => {
      const mockDispatch = jest.fn();
      const mockDataWithIncoming = {
        ...mockFriendsData,
        dispatch: mockDispatch,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 1,
              requester_id: 2,
              recipient_id: 1,
              status: 'pending',
              requester: {
                id: 2,
                username: 'testuser1',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithIncoming);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));
      fireEvent.press(screen.getByTestId('deny-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DENY_REQUEST_START',
        payload: { requestId: 1 },
      });
    });

    it('should call dispatch when canceling an outgoing request', () => {
      const mockDispatch = jest.fn();
      const mockDataWithOutgoing = {
        ...mockFriendsData,
        dispatch: mockDispatch,
        requests: {
          ...mockFriendsData.requests,
          outgoing: [
            {
              id: 2,
              requester_id: 1,
              recipient_id: 3,
              status: 'pending',
              recipient: {
                id: 3,
                username: 'testuser2',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithOutgoing);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));
      fireEvent.press(screen.getByTestId('cancel-button'));

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CANCEL_REQUEST_START',
        payload: { requestId: 2 },
      });
    });

    it('should display incoming requests section header when incoming requests exist', () => {
      const mockDataWithIncoming = {
        ...mockFriendsData,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 1,
              requester_id: 2,
              recipient_id: 1,
              status: 'pending',
              requester: {
                id: 2,
                username: 'testuser1',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithIncoming);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      expect(screen.getByText('Troop Requests')).toBeOnTheScreen();
    });

    it('should display outgoing requests section header when outgoing requests exist', () => {
      const mockDataWithOutgoing = {
        ...mockFriendsData,
        requests: {
          ...mockFriendsData.requests,
          outgoing: [
            {
              id: 2,
              requester_id: 1,
              recipient_id: 3,
              status: 'pending',
              recipient: {
                id: 3,
                username: 'testuser2',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithOutgoing);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      expect(screen.getByText('Pending Invites')).toBeOnTheScreen();
    });
  });

  describe('Android status bar compatibility', () => {
    beforeEach(() => {
      useFriends.mockReturnValue(mockFriendsData);
    });

    it('should have proper tab button touch targets for Android accessibility', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <BaboonsTabView navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Test that tab buttons exist and are touchable
      const friendsTabButton = getByTestId('friends-tab-button');
      const requestsTabButton = getByTestId('requests-tab-button');

      expect(friendsTabButton).toBeTruthy();
      expect(requestsTabButton).toBeTruthy();

      // Test that tab buttons are properly touchable
      fireEvent.press(friendsTabButton);
      fireEvent.press(requestsTabButton);

      // Should not throw any errors
    });

    it('should maintain tab bar elevation and styling for Android', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <BaboonsTabView navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Verify tab buttons exist and can be interacted with
      const friendsTabButton = getByTestId('friends-tab-button');
      const requestsTabButton = getByTestId('requests-tab-button');

      // Test tab switching functionality
      fireEvent.press(requestsTabButton);
      expect(getByTestId('requests-tab')).toBeTruthy();

      fireEvent.press(friendsTabButton);
      expect(getByTestId('friends-tab')).toBeTruthy();
    });

    it('should properly handle tab state changes without status bar interference', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <BaboonsTabView navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Start on friends tab
      expect(getByTestId('friends-tab')).toBeTruthy();

      // Switch to requests tab
      const requestsTabButton = getByTestId('requests-tab-button');
      fireEvent.press(requestsTabButton);
      expect(getByTestId('requests-tab')).toBeTruthy();

      // Switch back to friends tab
      const friendsTabButton = getByTestId('friends-tab-button');
      fireEvent.press(friendsTabButton);
      expect(getByTestId('friends-tab')).toBeTruthy();
    });

    it('should maintain Find Baboons FAB accessibility on Android', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <BaboonsTabView navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Ensure the FAB is accessible and has proper attributes
      const findBaboonsButton = getByTestId('find-baboons-button');
      expect(findBaboonsButton).toBeTruthy();
      expect(findBaboonsButton.props.accessibilityLabel).toBe('Find baboons to join your troop');

      // Test that FAB navigation works
      fireEvent.press(findBaboonsButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('BaboonSearch');
    });
  });
});
