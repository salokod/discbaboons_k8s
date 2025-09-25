/**
 * BaboonsTabView Component Tests
 * Tests for tab navigation in Baboons screen
 */

import {
  render, screen, fireEvent, act,
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

// Mock the friend service
jest.mock('../../services/friendService', () => ({
  friendService: {
    getFriends: jest.fn(),
    getRequests: jest.fn(),
    respondToRequest: jest.fn(),
    cancelRequest: jest.fn(),
  },
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
        type: 'ACCEPT_REQUEST_OPTIMISTIC',
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

  describe('Friends list refresh after actions', () => {
    it('should reload friends list after successful accept', async () => {
      // Mock the friend service
      const mockFriendService = require('../../services/friendService');
      mockFriendService.friendService.respondToRequest = jest.fn().mockResolvedValue({
        friendship: { id: 123, status: 'accepted' },
      });
      mockFriendService.friendService.getFriends = jest.fn().mockResolvedValue({
        friends: [
          {
            id: 789,
            username: 'johndoe',
            friendship: {
              id: 123,
              status: 'accepted',
              created_at: '2024-01-15T10:30:00.000Z',
            },
            bag_stats: {
              total_bags: 0,
              visible_bags: 0,
              public_bags: 0,
            },
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const mockDispatch = jest.fn();
      const mockDataWithIncoming = {
        ...mockFriendsData,
        dispatch: mockDispatch,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 456,
              requester_id: 789,
              recipient_id: 123,
              status: 'pending',
              requester: {
                id: 789,
                username: 'johndoe',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithIncoming);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      // Clear the initial calls from useEffect
      mockDispatch.mockClear();
      mockFriendService.friendService.getFriends.mockClear();

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      // Accept the request
      const acceptButton = screen.getByTestId('accept-button');

      // Use act to handle async operation
      await act(async () => {
        fireEvent.press(acceptButton);
        // Wait a bit for promises to resolve
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      // Should dispatch ACCEPT_REQUEST_OPTIMISTIC
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ACCEPT_REQUEST_OPTIMISTIC',
        payload: { requestId: 456 },
      });

      // Should dispatch FETCH_FRIENDS_START to reload friends after the accept
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'FETCH_FRIENDS_START',
      });

      // Should call the API to respond to request
      expect(mockFriendService.friendService.respondToRequest).toHaveBeenCalledWith(456, 'accept');

      // Should call the API to reload friends after the accept
      expect(mockFriendService.friendService.getFriends).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
    });

    it('should refresh badge count after deny', async () => {
      // Mock the friend service
      const mockFriendService = require('../../services/friendService');
      mockFriendService.friendService.respondToRequest = jest.fn().mockResolvedValue({
        success: true,
        action: 'deny',
      });

      const mockDispatch = jest.fn();
      const mockDataWithIncoming = {
        ...mockFriendsData,
        dispatch: mockDispatch,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 456,
              requester_id: 789,
              recipient_id: 123,
              status: 'pending',
              requester: {
                id: 789,
                username: 'johndoe',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          badge: 1,
        },
      };

      useFriends.mockReturnValue(mockDataWithIncoming);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      // Clear the initial calls from useEffect
      mockDispatch.mockClear();

      fireEvent.press(screen.getByTestId('requests-tab-button'));

      // Deny the request
      const denyButton = screen.getByTestId('deny-button');

      // Use act to handle async operation
      await act(async () => {
        fireEvent.press(denyButton);
        // Wait a bit for promises to resolve
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      // Should dispatch DENY_REQUEST_START
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DENY_REQUEST_START',
        payload: { requestId: 456 },
      });

      // Should dispatch DENY_REQUEST_SUCCESS with the updated badge count
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DENY_REQUEST_SUCCESS',
        payload: { requestId: 456 },
      });

      // Should call the API to deny request
      expect(mockFriendService.friendService.respondToRequest).toHaveBeenCalledWith(456, 'deny');
    });
  });

  describe('Pull-to-Refresh functionality', () => {
    it('should have RefreshControl on friends list', () => {
      const mockDataWithFriends = {
        ...mockFriendsData,
        friends: {
          ...mockFriendsData.friends,
          list: [
            {
              id: 789,
              username: 'testfriend',
              friendship: {
                id: 123,
                status: 'accepted',
                created_at: '2024-01-15T10:30:00.000Z',
              },
              bag_stats: {
                total_bags: 5,
                visible_bags: 3,
                public_bags: 1,
              },
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithFriends);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      // Should be on friends tab by default
      const friendsList = screen.getByTestId('friends-list');
      expect(friendsList).toBeOnTheScreen();

      // The FlatList should have a RefreshControl
      expect(friendsList.props.refreshControl).toBeDefined();
    });

    it('should trigger refresh on pull-to-refresh for friends list', async () => {
      // Mock the friend service
      const mockFriendService = require('../../services/friendService');
      mockFriendService.friendService.getFriends = jest.fn().mockResolvedValue({
        friends: [
          {
            id: 789,
            username: 'testfriend',
            friendship: {
              id: 123,
              status: 'accepted',
              created_at: '2024-01-15T10:30:00.000Z',
            },
            bag_stats: {
              total_bags: 5,
              visible_bags: 3,
              public_bags: 1,
            },
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const mockDispatch = jest.fn();
      const mockDataWithFriends = {
        ...mockFriendsData,
        dispatch: mockDispatch,
        friends: {
          ...mockFriendsData.friends,
          list: [
            {
              id: 789,
              username: 'testfriend',
              friendship: {
                id: 123,
                status: 'accepted',
                created_at: '2024-01-15T10:30:00.000Z',
              },
              bag_stats: {
                total_bags: 5,
                visible_bags: 3,
                public_bags: 1,
              },
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithFriends);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      // Clear initial calls
      mockDispatch.mockClear();
      mockFriendService.friendService.getFriends.mockClear();

      const friendsList = screen.getByTestId('friends-list');

      // Simulate pull-to-refresh
      await act(async () => {
        friendsList.props.refreshControl.props.onRefresh();
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      // Should dispatch refresh action
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REFRESH_FRIENDS',
      });

      // Should call the API to get friends
      expect(mockFriendService.friendService.getFriends).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
    });

    it('should have RefreshControl on requests tab', () => {
      const mockDataWithRequests = {
        ...mockFriendsData,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 456,
              requester_id: 789,
              recipient_id: 123,
              status: 'pending',
              requester: {
                id: 789,
                username: 'johndoe',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          outgoing: [
            {
              id: 789,
              requester_id: 123,
              recipient_id: 456,
              status: 'pending',
              recipient: {
                id: 456,
                username: 'janedoe',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithRequests);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      // Switch to requests tab
      fireEvent.press(screen.getByTestId('requests-tab-button'));

      // Should be on requests tab
      const requestsScrollView = screen.getByTestId('requests-scroll-view');
      expect(requestsScrollView).toBeOnTheScreen();

      // The ScrollView should have a RefreshControl
      expect(requestsScrollView.props.refreshControl).toBeDefined();
    });

    it('should trigger refresh on pull-to-refresh for requests tab', async () => {
      // Mock the friend service
      const mockFriendService = require('../../services/friendService');
      mockFriendService.friendService.getRequests = jest.fn()
        .mockResolvedValueOnce({ requests: [] }) // For incoming
        .mockResolvedValueOnce({ requests: [] }); // For outgoing

      const mockDispatch = jest.fn();
      const mockDataWithRequests = {
        ...mockFriendsData,
        dispatch: mockDispatch,
        requests: {
          ...mockFriendsData.requests,
          incoming: [
            {
              id: 456,
              requester_id: 789,
              recipient_id: 123,
              status: 'pending',
              requester: {
                id: 789,
                username: 'johndoe',
                profile_image: null,
              },
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      useFriends.mockReturnValue(mockDataWithRequests);

      renderWithProviders(<BaboonsTabView navigation={mockNavigation} />);

      // Clear initial calls
      mockDispatch.mockClear();
      mockFriendService.friendService.getRequests.mockClear();

      // Switch to requests tab
      fireEvent.press(screen.getByTestId('requests-tab-button'));

      const requestsScrollView = screen.getByTestId('requests-scroll-view');

      // Simulate pull-to-refresh
      await act(async () => {
        requestsScrollView.props.refreshControl.props.onRefresh();
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      });

      // Should dispatch refresh action
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'FETCH_REQUESTS_START',
      });

      // Should call the API to get incoming and outgoing requests
      expect(mockFriendService.friendService.getRequests).toHaveBeenCalledWith('incoming');
      expect(mockFriendService.friendService.getRequests).toHaveBeenCalledWith('outgoing');
    });
  });
});
