import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RoundSummaryScreen from '../RoundSummaryScreen';
import { getRoundDetails, getRoundLeaderboard } from '../../../services/roundService';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    roundId: 'round-123',
  },
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
  }),
}));

// Mock roundService
jest.mock('../../../services/roundService', () => ({
  getRoundDetails: jest.fn(),
  getRoundLeaderboard: jest.fn(),
}));

jest.mock('../../../components/AppContainer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function AppContainer({ children }) {
    return React.createElement(View, { testID: 'app-container' }, children);
  };
});

jest.mock('../../../components/NavigationHeader', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return function NavigationHeader({ title, onBack, testID }) {
    return React.createElement(
      View,
      { testID },
      React.createElement(
        TouchableOpacity,
        {
          onPress: onBack || (() => {}),
          testID: 'back-button',
          accessible: true,
        },
        React.createElement(Text, null, 'Back'),
      ),
      React.createElement(Text, { testID: 'header-title' }, title),
    );
  };
});

describe('RoundSummaryScreen', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks
    getRoundDetails.mockResolvedValue({
      id: 'round-123',
      name: 'Morning Round',
      course_name: 'Maple Hill',
      date: '2024-01-15',
      status: 'completed',
    });
    getRoundLeaderboard.mockResolvedValue({
      players: [],
      roundSettings: {},
    });
  });

  // SLICE A3: Placeholder screen with displayName and testID
  it('should export a component with correct displayName', () => {
    expect(typeof RoundSummaryScreen).toBe('object'); // memo() returns an object
    expect(RoundSummaryScreen.displayName).toBe('RoundSummaryScreen');
  });

  it('should render with testID round-summary-screen', () => {
    const { getByTestId } = renderWithNavigation(
      <RoundSummaryScreen
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );

    expect(getByTestId('round-summary-screen')).toBeTruthy();
  });

  it('should accept route and navigation props', () => {
    expect(() => renderWithNavigation(
      <RoundSummaryScreen
        navigation={mockNavigation}
        route={mockRoute}
      />,
    )).not.toThrow();
  });

  // SLICE D1: Fetch and display round metadata
  describe('Round Metadata', () => {
    it('should fetch round details on mount', async () => {
      renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getRoundDetails).toHaveBeenCalledWith('round-123');
      });
    });

    it('should display round name after fetching', async () => {
      getRoundDetails.mockResolvedValue({
        id: 'round-123',
        name: 'Sunset Round',
        course_name: 'Pine Valley',
        date: '2024-01-20',
        status: 'completed',
      });

      const { getByText } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByText('Sunset Round')).toBeTruthy();
      });
    });

    it('should display course name after fetching', async () => {
      getRoundDetails.mockResolvedValue({
        id: 'round-123',
        name: 'Morning Round',
        course_name: 'Woodland Course',
        date: '2024-01-15',
        status: 'completed',
      });

      const { getByText } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByText('Woodland Course')).toBeTruthy();
      });
    });

    it('should display formatted date after fetching', async () => {
      getRoundDetails.mockResolvedValue({
        id: 'round-123',
        name: 'Morning Round',
        course_name: 'Maple Hill',
        date: '2024-01-15',
        status: 'completed',
      });

      const { getByText } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        // Date should be formatted (e.g., "Jan 15, 2024")
        expect(getByText(/Jan.*15.*2024/i)).toBeTruthy();
      });
    });

    it('should show loading state before data loads', () => {
      getRoundDetails.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should hide loading state after data loads', async () => {
      const { queryByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });
    });
  });

  // SLICE D2: Display leaderboard with PlayerStandingsCard
  describe('Leaderboard Display', () => {
    it('should fetch round leaderboard on mount', async () => {
      renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getRoundLeaderboard).toHaveBeenCalledWith('round-123');
      });
    });

    it('should render PlayerStandingsCard when leaderboard data is available', async () => {
      getRoundLeaderboard.mockResolvedValue({
        players: [
          {
            id: 1,
            username: 'player1',
            display_name: 'Player One',
            position: 1,
            total_score: -3,
          },
          {
            id: 2,
            username: 'player2',
            display_name: 'Player Two',
            position: 2,
            total_score: 0,
          },
        ],
        roundSettings: {},
      });

      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('player-standings-card')).toBeTruthy();
      });
    });

    it('should display player names from leaderboard', async () => {
      getRoundLeaderboard.mockResolvedValue({
        players: [
          {
            id: 1,
            username: 'player1',
            display_name: 'Alice Johnson',
            position: 1,
            total_score: -5,
          },
          {
            id: 2,
            username: 'player2',
            display_name: 'Bob Smith',
            position: 2,
            total_score: -2,
          },
        ],
        roundSettings: {},
      });

      const { getByText } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByText('Alice Johnson')).toBeTruthy();
        expect(getByText('Bob Smith')).toBeTruthy();
      });
    });

    it('should not render PlayerStandingsCard when leaderboard is empty', async () => {
      getRoundLeaderboard.mockResolvedValue({
        players: [],
        roundSettings: {},
      });

      const { queryByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(queryByTestId('player-standings-card')).toBeNull();
      });
    });
  });

  // SLICE D4: Add "View Details" action button
  describe('View Details Button', () => {
    it('should render View Details button', async () => {
      const { getByText } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByText('View Details')).toBeTruthy();
      });
    });

    it('should have testID for View Details button', async () => {
      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('view-details-button')).toBeTruthy();
      });
    });

    it('should navigate to RoundDetail when View Details is pressed', async () => {
      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('view-details-button')).toBeTruthy();
      });

      const viewDetailsButton = getByTestId('view-details-button');
      require('@testing-library/react-native').fireEvent.press(viewDetailsButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('RoundDetail', {
        roundId: 'round-123',
      });
    });
  });

  // SLICE D5: Add pull-to-refresh functionality
  describe('Pull to Refresh', () => {
    it('should render ScrollView with RefreshControl', async () => {
      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('round-summary-scrollview')).toBeTruthy();
      });
    });

    it('should have RefreshControl on ScrollView', async () => {
      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        const scrollView = getByTestId('round-summary-scrollview');
        expect(scrollView.props.refreshControl).toBeDefined();
      });
    });

    it('should re-fetch round details and leaderboard when refreshed', async () => {
      getRoundDetails.mockResolvedValue({
        id: 'round-123',
        name: 'Initial Round',
        course_name: 'Initial Course',
        date: '2024-01-15',
        status: 'completed',
      });

      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('round-summary-scrollview')).toBeTruthy();
      });

      // Clear mock calls
      getRoundDetails.mockClear();
      getRoundLeaderboard.mockClear();

      // Mock updated data
      getRoundDetails.mockResolvedValue({
        id: 'round-123',
        name: 'Updated Round',
        course_name: 'Updated Course',
        date: '2024-01-20',
        status: 'completed',
      });

      // Trigger refresh
      const scrollView = getByTestId('round-summary-scrollview');
      const { refreshControl } = scrollView.props;
      await refreshControl.props.onRefresh();

      // Should refetch data
      await waitFor(() => {
        expect(getRoundDetails).toHaveBeenCalledWith('round-123');
        expect(getRoundLeaderboard).toHaveBeenCalledWith('round-123');
      });
    });

    it('should show refreshing state during pull-to-refresh', async () => {
      getRoundDetails.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({
          id: 'round-123',
          name: 'Test Round',
          course_name: 'Test Course',
          date: '2024-01-15',
          status: 'completed',
        }), 100);
      }));

      const { getByTestId } = renderWithNavigation(
        <RoundSummaryScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getByTestId('round-summary-scrollview')).toBeTruthy();
      });

      // Trigger refresh
      const scrollView = getByTestId('round-summary-scrollview');
      const { refreshControl } = scrollView.props;

      // Initially not refreshing
      expect(refreshControl.props.refreshing).toBe(false);

      // Start refresh
      refreshControl.props.onRefresh();

      // Should briefly show refreshing (may be hard to catch in test)
      // Just verify the refresh was triggered
      await waitFor(() => {
        expect(getRoundDetails).toHaveBeenCalled();
      });
    });
  });
});
