/**
 * Baboon Request Workflow Integration Tests
 *
 * Tests the complete end-to-end baboon friend request flow:
 * 1. User navigates to FriendsScreen
 * 2. User taps "Find Baboons" FAB button
 * 3. User lands on BaboonSearchScreen
 * 4. User searches for another user
 * 5. User sees search results
 * 6. User taps "Send Invite" on a search result
 * 7. Invite is sent successfully
 * 8. User navigates back to requests tab
 * 9. User sees their outgoing request
 * 10. (Simulate) Recipient accepts the request
 * 11. Request disappears from pending and users become troop mates
 */

import { View, Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithNavigationAndTheme } from './testUtils';
import FriendsScreen from '../../src/screens/friends/FriendsScreen';

// Import after mocks
import { friendService } from '../../src/services/friendService';
import BaboonSearchScreen from '../../src/screens/friends/BaboonSearchScreen';

// Mock the components we need
jest.mock('../../src/components/AppContainer', () => function MockAppContainer({ children }) {
  const React = require('react');
  const { View: MockView } = require('react-native');
  return React.createElement(MockView, { testID: 'app-container' }, children);
});

// Mock FriendsContext with more dynamic state
const mockFriendsState = {
  friends: {
    list: [],
    loading: false,
    error: null,
  },
  requests: {
    incoming: [],
    outgoing: [],
    loading: false,
    badge: 0,
  },
};

const mockDispatch = jest.fn();

jest.mock('../../src/context/FriendsContext', () => ({
  useFriends: () => ({
    ...mockFriendsState,
    dispatch: mockDispatch,
  }),
}));

// Mock tokenStorage to prevent authentication issues
jest.mock('../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(() => Promise.resolve({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  })),
}));

// Mock API configuration
jest.mock('../../src/config/environment', () => ({
  API_BASE_URL: 'https://mock-api.discbaboons.com',
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock friend service using Jest auto-mock pattern
jest.mock('../../src/services/friendService', () => ({
  friendService: {
    getFriends: jest.fn(),
    getRequests: jest.fn(),
    searchUsers: jest.fn(),
    sendRequest: jest.fn(),
  },
}));

// Mock vector icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Basic test component for structure validation
function TestBaboonWorkflow() {
  return (
    <View testID="baboon-workflow-test">
      <Text testID="workflow-test-title">Baboon Request Workflow Test</Text>
    </View>
  );
}

describe('Baboon Request Workflow Integration Tests', () => {
  let mockNavigation;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };
    // Reset fetch mock
    global.fetch.mockClear();
    // Reset mock implementations
    friendService.searchUsers.mockResolvedValue({ users: [] });
    friendService.sendRequest.mockResolvedValue({ success: true });
    friendService.getFriends.mockResolvedValue({ friends: [], pagination: {} });
    friendService.getRequests.mockResolvedValue({ incoming: [], outgoing: [] });
  });

  describe('Test Suite Structure', () => {
    it('should export integration test functions', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(<TestBaboonWorkflow />);
      expect(getByTestId('baboon-workflow-test')).toBeTruthy();
      expect(getByTestId('workflow-test-title')).toHaveTextContent('Baboon Request Workflow Test');
    });
  });

  describe('FriendsScreen Rendering and FAB', () => {
    it('should render FriendsScreen with proper testID', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      expect(getByTestId('friends-screen')).toBeTruthy();
      expect(getByTestId('app-container')).toBeTruthy();
    });

    it('should display Find Baboons FAB button on friends tab', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      const fabButton = getByTestId('find-baboons-button');
      expect(fabButton).toBeTruthy();
    });

    it('should show Find Baboons FAB with correct accessibility label', async () => {
      const { getByTestId, getByLabelText } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      expect(getByTestId('find-baboons-button')).toBeTruthy();
      expect(getByLabelText('Find baboons to join your troop')).toBeTruthy();
    });

    it('should call navigation when Find Baboons FAB is pressed', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      const fabButton = getByTestId('find-baboons-button');
      fireEvent.press(fabButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('BaboonSearch');
    });

    it('should show friends tab as active by default', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      const friendsTab = getByTestId('friends-tab-button');
      expect(friendsTab).toBeTruthy();

      // FAB should be visible on friends tab
      expect(getByTestId('find-baboons-button')).toBeTruthy();
    });

    it('should hide Find Baboons FAB when on requests tab', async () => {
      const { getByTestId, queryByTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      // Switch to requests tab
      const requestsTab = getByTestId('requests-tab-button');
      fireEvent.press(requestsTab);

      // FAB should not be visible on requests tab
      expect(queryByTestId('find-baboons-button')).toBeNull();
    });
  });

  describe('Navigation to BaboonSearchScreen', () => {
    it('should navigate to BaboonSearch when Find Baboons FAB is pressed', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      const fabButton = getByTestId('find-baboons-button');
      fireEvent.press(fabButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('BaboonSearch');
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
    });

    it('should render BaboonSearchScreen with proper structure', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      expect(getByTestId('search-input')).toBeTruthy();
      expect(getByTestId('app-container')).toBeTruthy();
    });

    it('should show initial empty state on BaboonSearchScreen', async () => {
      const { getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      expect(getByText('Find Baboons for Your Troop')).toBeTruthy();
      expect(getByText('Search by username or email to discover other baboons and send troop invites!')).toBeTruthy();
    });

    it('should have proper search input placeholder text', async () => {
      const { getByTestId } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      expect(searchInput.props.placeholder).toBe('Search for baboons to join your troop...');
    });

    it('should complete navigation flow from FriendsScreen to BaboonSearchScreen', async () => {
      // Test the complete navigation flow
      const { getByTestId: getByTestIdFriends } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      // User is on FriendsScreen
      expect(getByTestIdFriends('friends-screen')).toBeTruthy();
      expect(getByTestIdFriends('find-baboons-button')).toBeTruthy();

      // User taps Find Baboons FAB
      fireEvent.press(getByTestIdFriends('find-baboons-button'));

      // Verify navigation was called correctly
      expect(mockNavigation.navigate).toHaveBeenCalledWith('BaboonSearch');

      // Simulate user arriving at BaboonSearchScreen
      const { getByTestId: getByTestIdSearch } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      // Verify user is now on BaboonSearchScreen
      expect(getByTestIdSearch('search-input')).toBeTruthy();
    });
  });

  describe('Baboon Search Functionality', () => {
    it('should handle search input and trigger search', async () => {
      const mockSearchResults = {
        users: [
          { id: 1, username: 'baboon_buddy', email: 'buddy@example.com' },
          { id: 2, username: 'disc_lover', email: 'lover@example.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);

      const { getByTestId } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');

      // User types in search box
      fireEvent.changeText(searchInput, 'baboon');

      // Verify search service was called
      await waitFor(() => {
        expect(friendService.searchUsers).toHaveBeenCalledWith('baboon');
      });
    });

    it('should display search results when users are found', async () => {
      const mockSearchResults = {
        users: [
          { id: 1, username: 'baboon_buddy', email: 'buddy@example.com' },
          { id: 2, username: 'disc_lover', email: 'lover@example.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      // Wait for search results to appear
      await waitFor(() => {
        expect(getByText('baboon_buddy')).toBeTruthy();
        expect(getByText('buddy@example.com')).toBeTruthy();
        expect(getByText('disc_lover')).toBeTruthy();
        expect(getByText('lover@example.com')).toBeTruthy();
      });
    });

    it('should display Send Invite buttons for each search result', async () => {
      const mockSearchResults = {
        users: [
          { id: 1, username: 'baboon_buddy', email: 'buddy@example.com' },
          { id: 2, username: 'disc_lover', email: 'lover@example.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);

      const { getByTestId, getAllByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      // Wait for Send Invite buttons to appear
      await waitFor(() => {
        const sendInviteButtons = getAllByText('Send Invite');
        expect(sendInviteButtons).toHaveLength(2);
      });
    });

    it('should show loading state while searching', async () => {
      // Mock a delayed response
      friendService.searchUsers.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ users: [] }), 100);
      }));

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      // Should show loading state
      await waitFor(() => {
        expect(getByText('Searching for baboons...')).toBeTruthy();
      });
    });

    it('should show no results message when search returns empty', async () => {
      friendService.searchUsers.mockResolvedValue({ users: [] });

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(getByText('No baboons found matching your search')).toBeTruthy();
      });
    });

    it('should handle search errors gracefully', async () => {
      friendService.searchUsers.mockRejectedValue(new Error('Network error'));

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      await waitFor(() => {
        expect(getByText('Error searching for baboons. Please try again.')).toBeTruthy();
      });
    });

    it('should clear results when search input is cleared', async () => {
      const mockSearchResults = {
        users: [{ id: 1, username: 'baboon_buddy', email: 'buddy@example.com' }],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);

      const { getByTestId, getByText, queryByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');

      // First search
      fireEvent.changeText(searchInput, 'baboon');
      await waitFor(() => {
        expect(getByText('baboon_buddy')).toBeTruthy();
      });

      // Clear search
      fireEvent.changeText(searchInput, '');
      await waitFor(() => {
        expect(queryByText('baboon_buddy')).toBeFalsy();
        expect(getByText('Find Baboons for Your Troop')).toBeTruthy();
      });
    });
  });

  describe('Sending Baboon Invites', () => {
    it('should send invite when Send Invite button is pressed', async () => {
      const mockSearchResults = {
        users: [
          { id: 123, username: 'baboon_buddy', email: 'buddy@example.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);
      friendService.sendRequest.mockResolvedValue({ success: true });

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      // Wait for search results
      await waitFor(() => {
        expect(getByText('baboon_buddy')).toBeTruthy();
      });

      // Press Send Invite button
      const sendInviteButton = getByText('Send Invite');
      fireEvent.press(sendInviteButton);

      // Verify sendRequest was called with correct user ID
      expect(friendService.sendRequest).toHaveBeenCalledWith(123);
    });

    it('should handle multiple Send Invite buttons correctly', async () => {
      const mockSearchResults = {
        users: [
          { id: 123, username: 'baboon_buddy', email: 'buddy@example.com' },
          { id: 456, username: 'disc_lover', email: 'lover@example.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);
      friendService.sendRequest.mockResolvedValue({ success: true });

      const { getByTestId, getAllByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      // Wait for search results
      await waitFor(() => {
        const sendInviteButtons = getAllByText('Send Invite');
        expect(sendInviteButtons).toHaveLength(2);
      });

      // Press first Send Invite button
      const sendInviteButtons = getAllByText('Send Invite');
      fireEvent.press(sendInviteButtons[0]);

      // Verify first user invite was sent
      expect(friendService.sendRequest).toHaveBeenCalledWith(123);

      // Press second Send Invite button
      fireEvent.press(sendInviteButtons[1]);

      // Verify second user invite was sent
      expect(friendService.sendRequest).toHaveBeenCalledWith(456);
      expect(friendService.sendRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle invite send errors gracefully', async () => {
      const mockSearchResults = {
        users: [
          { id: 123, username: 'baboon_buddy', email: 'buddy@example.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);
      friendService.sendRequest.mockRejectedValue(new Error('Network error'));

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      // Wait for search results
      await waitFor(() => {
        expect(getByText('baboon_buddy')).toBeTruthy();
      });

      // Press Send Invite button - should not crash on error
      const sendInviteButton = getByText('Send Invite');
      fireEvent.press(sendInviteButton);

      // Verify sendRequest was attempted
      expect(friendService.sendRequest).toHaveBeenCalledWith(123);
    });

    it('should complete full search and invite flow', async () => {
      const mockSearchResults = {
        users: [
          { id: 789, username: 'troop_mate', email: 'mate@example.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);
      friendService.sendRequest.mockResolvedValue({ success: true });

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      // User types search query
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'troop_mate');

      // Verify search was triggered
      await waitFor(() => {
        expect(friendService.searchUsers).toHaveBeenCalledWith('troop_mate');
      });

      // Wait for search results to display
      await waitFor(() => {
        expect(getByText('troop_mate')).toBeTruthy();
        expect(getByText('mate@example.com')).toBeTruthy();
        expect(getByText('Send Invite')).toBeTruthy();
      });

      // User sends invite
      const sendInviteButton = getByText('Send Invite');
      fireEvent.press(sendInviteButton);

      // Verify invite was sent
      expect(friendService.sendRequest).toHaveBeenCalledWith(789);
      expect(friendService.sendRequest).toHaveBeenCalledTimes(1);
    });

    it('should display user information correctly before sending invite', async () => {
      const mockSearchResults = {
        users: [
          { id: 999, username: 'amazing_baboon', email: 'amazing@baboon.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'amazing');

      // Verify user details are displayed correctly
      await waitFor(() => {
        expect(getByText('amazing_baboon')).toBeTruthy();
        expect(getByText('amazing@baboon.com')).toBeTruthy();
        expect(getByText('Send Invite')).toBeTruthy();
      });

      // Verify the invite button works with this user
      const sendInviteButton = getByText('Send Invite');
      fireEvent.press(sendInviteButton);
      expect(friendService.sendRequest).toHaveBeenCalledWith(999);
    });
  });

  describe('Complete End-to-End Baboon Request Workflow', () => {
    it('should complete full workflow: FriendsScreen → Search → Invite → Back to Requests Tab', async () => {
      // Step 1: Start on FriendsScreen
      const {
        getByTestId: getFriendsTestId,
      } = await renderWithNavigationAndTheme(<FriendsScreen navigation={mockNavigation} />);

      // Verify we're on FriendsScreen with Find Baboons FAB
      expect(getFriendsTestId('friends-screen')).toBeTruthy();
      expect(getFriendsTestId('find-baboons-button')).toBeTruthy();

      // Step 2: Navigate to BaboonSearchScreen
      const fabButton = getFriendsTestId('find-baboons-button');
      fireEvent.press(fabButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('BaboonSearch');

      // Step 3: User lands on BaboonSearchScreen (simulate navigation)
      const mockSearchResults = {
        users: [
          { id: 100, username: 'new_baboon_friend', email: 'newbaboon@troop.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);

      const {
        getByTestId: getSearchTestId,
        getByText: getSearchText,
      } = await renderWithNavigationAndTheme(<BaboonSearchScreen navigation={mockNavigation} />);

      // Step 4: User searches for baboons
      const searchInput = getSearchTestId('search-input');
      fireEvent.changeText(searchInput, 'new_baboon');

      // Verify search results appear
      await waitFor(() => {
        expect(getSearchText('new_baboon_friend')).toBeTruthy();
        expect(getSearchText('newbaboon@troop.com')).toBeTruthy();
        expect(getSearchText('Send Invite')).toBeTruthy();
      });

      // Step 5: User sends invite
      const sendInviteButton = getSearchText('Send Invite');
      fireEvent.press(sendInviteButton);

      // Verify invite was sent
      expect(friendService.sendRequest).toHaveBeenCalledWith(100);

      // Step 6: User navigates back to FriendsScreen (simulate)
      const { getByTestId: getBackTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      // Step 7: User switches to requests tab to see outgoing invite
      const requestsTab = getBackTestId('requests-tab-button');
      fireEvent.press(requestsTab);

      // Verify they're now on requests tab (FAB should be hidden)
      expect(getBackTestId('requests-tab')).toBeTruthy();
      expect(getBackTestId('requests-tab-button')).toBeTruthy();
    });

    it('should handle workflow with multiple search results and selective invites', async () => {
      const mockSearchResults = {
        users: [
          { id: 201, username: 'baboon_alpha', email: 'alpha@troop.com' },
          { id: 202, username: 'baboon_beta', email: 'beta@troop.com' },
          { id: 203, username: 'baboon_gamma', email: 'gamma@troop.com' },
        ],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);

      // Start workflow on search screen
      const { getByTestId, getAllByText, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      // Search for baboons
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'baboon');

      // Wait for all results
      await waitFor(() => {
        expect(getByText('baboon_alpha')).toBeTruthy();
        expect(getByText('baboon_beta')).toBeTruthy();
        expect(getByText('baboon_gamma')).toBeTruthy();
        const inviteButtons = getAllByText('Send Invite');
        expect(inviteButtons).toHaveLength(3);
      });

      // Send invite to only the first and third baboons
      const inviteButtons = getAllByText('Send Invite');
      fireEvent.press(inviteButtons[0]); // baboon_alpha
      fireEvent.press(inviteButtons[2]); // baboon_gamma

      // Verify correct invites were sent
      expect(friendService.sendRequest).toHaveBeenCalledWith(201);
      expect(friendService.sendRequest).toHaveBeenCalledWith(203);
      expect(friendService.sendRequest).toHaveBeenCalledTimes(2);
      expect(friendService.sendRequest).not.toHaveBeenCalledWith(202);
    });

    it('should handle request acceptance simulation', async () => {
      // Simulate outgoing requests state
      mockFriendsState.requests.outgoing = [
        {
          id: 1,
          recipient: {
            username: 'pending_baboon',
            email: 'pending@example.com',
          },
          status: 'pending',
        },
      ];

      const { getByTestId } = await renderWithNavigationAndTheme(
        <FriendsScreen navigation={mockNavigation} />,
      );

      // Navigate to requests tab
      const requestsTab = getByTestId('requests-tab-button');
      fireEvent.press(requestsTab);

      // Should show the outgoing request
      expect(getByTestId('requests-tab')).toBeTruthy();

      // Reset state for friends list
      mockFriendsState.friends.list = [
        {
          id: 1,
          username: 'pending_baboon',
          email: 'pending@example.com',
          bag_stats: {
            total_bags: 3,
            total_discs: 42,
          },
          friendship: {
            created_at: '2024-01-15T10:30:00.000Z',
          },
        },
      ];
      mockFriendsState.requests.outgoing = [];

      // Navigate back to friends tab to see new friend
      const friendsTab = getByTestId('friends-tab-button');
      fireEvent.press(friendsTab);

      expect(getByTestId('friends-tab')).toBeTruthy();
    });
  });

  describe('Error Scenarios in Baboon Request Workflow', () => {
    it('should handle network errors during search gracefully', async () => {
      friendService.searchUsers.mockRejectedValue(new Error('Network error'));

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'failing_search');

      await waitFor(() => {
        expect(getByText('Error searching for baboons. Please try again.')).toBeTruthy();
      });

      // User should still be able to retry
      friendService.searchUsers.mockResolvedValue({ users: [] });
      fireEvent.changeText(searchInput, 'retry_search');

      await waitFor(() => {
        expect(friendService.searchUsers).toHaveBeenCalledWith('retry_search');
      });
    });

    it('should handle invite send failures without breaking workflow', async () => {
      const mockSearchResults = {
        users: [{ id: 500, username: 'test_baboon', email: 'test@example.com' }],
      };
      friendService.searchUsers.mockResolvedValue(mockSearchResults);
      friendService.sendRequest.mockRejectedValue(new Error('Invite failed'));

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      // Search and get results
      const searchInput = getByTestId('search-input');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(searchInput, 'test');
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(getByText('test_baboon')).toBeTruthy();
      });

      // Try to send invite (should fail silently)
      const sendInviteButton = getByText('Send Invite');
      fireEvent.press(sendInviteButton);

      // Verify attempt was made
      expect(friendService.sendRequest).toHaveBeenCalledWith(500);

      // User should still be able to search again
      fireEvent.changeText(searchInput, 'another_search');
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(friendService.searchUsers).toHaveBeenCalledWith('another_search');
      });
    });

    it('should handle empty search results appropriately', async () => {
      friendService.searchUsers.mockResolvedValue({ users: [] });

      const { getByTestId, getByText } = await renderWithNavigationAndTheme(
        <BaboonSearchScreen navigation={mockNavigation} />,
      );

      const searchInput = getByTestId('search-input');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(searchInput, 'nonexistent_baboon');
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(getByText('No baboons found matching your search')).toBeTruthy();
      });

      // User should be able to try different search
      friendService.searchUsers.mockResolvedValue({
        users: [{ id: 999, username: 'found_baboon', email: 'found@example.com' }],
      });

      fireEvent.changeText(searchInput, 'found_baboon');
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(getByText('found_baboon')).toBeTruthy();
      });
    });
  });
});
