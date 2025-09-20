/**
 * FriendsScreen Tests
 * Test suite for basic friends list screen functionality
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import FriendsScreen from '../FriendsScreen';
import { FriendsProvider } from '../../../context/FriendsContext';

// Import after mocking
import { friendService } from '../../../services/friendService';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock dependencies
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    primary: '#007AFF',
    border: '#E1E1E1',
    white: '#FFFFFF',
    warning: '#FF9500',
    black: '#000000',
  }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    tokens: { accessToken: 'mock-token' },
    isAuthenticated: true,
  }),
}));

// Mock the friend service before importing
jest.mock('../../../services/friendService');

jest.mock('../../../components/AppContainer', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return function AppContainer({ children }) {
    return ReactLocal.createElement(View, { testID: 'app-container' }, children);
  };
});

jest.mock('../../../components/FriendCard', () => {
  const ReactLocal = require('react');
  const { View, Text } = require('react-native');
  return function FriendCard({ friend }) {
    return ReactLocal.createElement(
      View,
      { testID: `friend-card-${friend.id}` },
      ReactLocal.createElement(Text, null, friend.username),
    );
  };
});

describe('FriendsScreen', () => {
  const renderWithProviders = (component) => render(
    <NavigationContainer>
      <FriendsProvider>
        {component}
      </FriendsProvider>
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    friendService.getFriends.mockResolvedValue({
      friends: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });
  });

  it('should display FriendCard components when data loads', async () => {
    // Mock friends data for this test
    friendService.getFriends.mockResolvedValue({
      friends: [
        {
          id: 1,
          username: 'testfriend',
          friendship: {
            id: 1,
            status: 'accepted',
            created_at: '2023-01-01T00:00:00Z',
          },
          bag_stats: {
            total_bags: 3,
            visible_bags: 2,
            public_bags: 1,
          },
        },
      ],
      pagination: {
        total: 1, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = renderWithProviders(
      <FriendsScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('friends-screen')).toBeTruthy();

    // Wait for loading to complete and data to be displayed
    await waitFor(() => {
      expect(getByTestId('friends-list')).toBeTruthy();
    });
  });

  it('should show EmptyState component when no friends', async () => {
    const { getByTestId } = renderWithProviders(
      <FriendsScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('friends-screen')).toBeTruthy();

    // Wait for loading to complete and empty state to be displayed
    await waitFor(() => {
      expect(getByTestId('friends-empty-state')).toBeTruthy();
    });
  });

  it('should call friendService.getFriends on mount', async () => {
    renderWithProviders(<FriendsScreen navigation={mockNavigation} />);

    // Wait for useEffect to complete
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(friendService.getFriends).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it('should have a search button that navigates to BaboonSearch screen', () => {
    const { getByTestId } = renderWithProviders(
      <FriendsScreen navigation={mockNavigation} />,
    );

    // Test that a search button/FAB exists
    const searchButton = getByTestId('find-baboons-button');
    expect(searchButton).toBeTruthy();
  });

  it('should navigate to BaboonSearch screen when search button is pressed', () => {
    const { getByTestId } = renderWithProviders(
      <FriendsScreen navigation={mockNavigation} />,
    );

    // Find and press the search button
    const searchButton = getByTestId('find-baboons-button');
    fireEvent.press(searchButton);

    // Verify navigation was called correctly
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BaboonSearch');
  });
});
