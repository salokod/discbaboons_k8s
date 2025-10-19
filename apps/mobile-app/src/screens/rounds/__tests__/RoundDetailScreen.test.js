import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import RoundDetailScreen from '../RoundDetailScreen';
import { getRoundDetails, getRoundLeaderboard, getRoundSideBets } from '../../../services/roundService';
import { useAuth } from '../../../context/AuthContext';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route with only roundId (new behavior)
const mockRoute = {
  params: {
    roundId: 'round-123',
  },
};

// Mock round data that would be fetched from API (for future slices)
// const mockRoundData = {
//   id: 'round-123',
//   name: 'Morning Round',
//   course_id: 'course-456',
//   created_by_id: 1,
//   start_time: '2023-12-01T09:00:00Z',
//   status: 'in_progress',
//   players: [
//     {
//       id: 1,
//       username: 'testuser',
//       display_name: 'Test User',
//     },
//   ],
//   course: {
//     id: 'course-456',
//     name: 'Test Course',
//     location: 'Test City',
//     holes: 18,
//   },
// };

// Mock roundService
jest.mock('../../../services/roundService', () => ({
  getRoundDetails: jest.fn(),
  getRoundLeaderboard: jest.fn(),
  getRoundSideBets: jest.fn(),
}));

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
    success: '#28A745',
  }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
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

jest.mock('../../../components/rounds/PlayerStandingsCard', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return function PlayerStandingsCard({
    players, loading, error, onEmptyAction, emptyStateMessage,
  }) {
    if (loading) {
      return React.createElement(
        View,
        { testID: 'player-standings-card-loading' },
        React.createElement(Text, null, 'Loading leaderboard...'),
      );
    }
    if (error) {
      return React.createElement(
        View,
        { testID: 'player-standings-card-error' },
        React.createElement(Text, null, error),
      );
    }
    if (players.length === 0) {
      return React.createElement(
        View,
        { testID: 'player-standings-card' },
        React.createElement(
          View,
          { testID: 'empty-state' },
          emptyStateMessage && React.createElement(
            Text,
            { testID: 'empty-state-message' },
            emptyStateMessage,
          ),
          React.createElement(
            TouchableOpacity,
            {
              testID: 'empty-state-action-button',
              onPress: onEmptyAction,
            },
            React.createElement(Text, null, 'Start Scoring'),
          ),
        ),
      );
    }
    return React.createElement(
      View,
      { testID: 'player-standings-card' },
      players.map((player) => React.createElement(
        Text,
        { key: player.id, testID: `player-${player.id}` },
        player.display_name || player.username,
      )),
    );
  };
});

jest.mock('../../../components/rounds/ScoreSummaryCard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function ScoreSummaryCard({ leaderboard }) {
    return React.createElement(
      View,
      { testID: 'score-summary-card' },
      React.createElement(Text, null, `Score Summary: ${leaderboard.length} players`),
    );
  };
});

jest.mock('../../../components/rounds/RoundActionsMenu', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function RoundActionsMenu() {
    return React.createElement(View, { testID: 'round-actions-menu' });
  };
});

jest.mock('../../../components/rounds/SideBetsCard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function SideBetsCard({ sideBets, loading }) {
    if (loading) {
      return React.createElement(
        View,
        { testID: 'side-bets-card-loading' },
        React.createElement(Text, null, 'Loading side bets...'),
      );
    }
    return React.createElement(
      View,
      { testID: 'side-bets-card' },
      sideBets.map((bet) => React.createElement(
        Text,
        { key: bet.id, testID: `bet-${bet.id}` },
        bet.name,
      )),
    );
  };
});

// Mock hapticService for FixedBottomActionBar
jest.mock('../../../services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
}));

describe('RoundDetailScreen', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    getRoundDetails.mockClear();
    getRoundLeaderboard.mockClear();
    getRoundSideBets.mockClear();
    // Provide default resolved values to prevent hanging tests
    getRoundDetails.mockResolvedValue({ id: 'round-123', name: 'Test Round', status: 'in_progress' });
    getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
    getRoundSideBets.mockResolvedValue([]);
    // Provide default mock for useAuth
    useAuth.mockReturnValue({
      user: { id: 999 },
      isAuthenticated: true,
    });
  });

  // SLICE 1: Screen Foundation & Navigation Tests
  describe('Slice 1: Screen Foundation & Navigation', () => {
    it('should export a memoized component with correct displayName', () => {
      expect(typeof RoundDetailScreen).toBe('object'); // memo() returns an object
      expect(RoundDetailScreen.displayName).toBe('RoundDetailScreen');
    });

    it('should extract roundId from route params', () => {
      const { getByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should render the main screen container
      expect(getByTestId('round-detail-screen')).toBeTruthy();
    });

    it('should render NavigationHeader with correct title and back handler', () => {
      const { getByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should have navigation header
      expect(getByTestId('round-detail-header')).toBeTruthy();
      expect(getByTestId('header-title')).toBeTruthy();

      // The back button should exist
      const backButton = getByTestId('back-button');
      expect(backButton).toBeTruthy();
    });

    it('should show loading state when no round data is loaded', () => {
      // Mock loading state
      getRoundDetails.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show loading indicator
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should handle missing roundId gracefully', () => {
      const emptyRoute = {
        params: {},
      };

      const { getByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={emptyRoute}
        />,
      );

      // Should still render the screen
      expect(getByTestId('round-detail-screen')).toBeTruthy();
    });
  });

  // SLICE 2: Round Data Fetching Tests
  describe('Slice 2: Round Data Fetching', () => {
    beforeEach(() => {
      // Mock leaderboard to prevent hanging tests
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
    });

    it('should call getRoundDetails with correct roundId on mount', async () => {
      getRoundDetails.mockResolvedValue({
        id: 'round-123',
        name: 'Test Round',
        status: 'in_progress',
      });

      renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      expect(getRoundDetails).toHaveBeenCalledWith('round-123');
    });

    it('should update round state when API call succeeds', async () => {
      const mockRoundData = {
        id: 'round-123',
        name: 'Test Round',
        status: 'in_progress',
        course: {
          name: 'Test Course',
          location: 'Test City',
          holes: 18,
        },
      };

      getRoundDetails.mockResolvedValue(mockRoundData);

      const { getAllByText, getByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should eventually show round data
      await waitFor(() => {
        const roundNames = getAllByText('Test Round');
        expect(roundNames.length).toBeGreaterThan(0);
        expect(getByText('Test Course')).toBeTruthy();
      });
    });

    it('should handle API errors and show error state', async () => {
      getRoundDetails.mockRejectedValue(new Error('Round not found'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show error state
      await findByTestId('error-state');
    });

    it('should show retry button on error', async () => {
      getRoundDetails.mockRejectedValue(new Error('Network error'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show retry button
      await findByTestId('retry-button');
    });

    it('should retry API call when retry button is pressed', async () => {
      getRoundDetails
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          id: 'round-123',
          name: 'Test Round',
          status: 'in_progress',
        });

      const { findByTestId, getAllByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for error state and retry
      const retryButton = await findByTestId('retry-button');
      fireEvent.press(retryButton);

      // Should call API again
      expect(getRoundDetails).toHaveBeenCalledTimes(2);

      // Should eventually show round data
      await waitFor(() => {
        const roundNames = getAllByText('Test Round');
        expect(roundNames.length).toBeGreaterThan(0);
      });
    });

    it('should not call API when roundId is missing', () => {
      const emptyRoute = {
        params: {},
      };

      renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={emptyRoute}
        />,
      );

      expect(getRoundDetails).not.toHaveBeenCalled();
    });

    it('should show loading state while fetching data', () => {
      getRoundDetails.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should clear loading state after successful API call', async () => {
      getRoundDetails.mockResolvedValue({
        id: 'round-123',
        name: 'Test Round',
        status: 'in_progress',
      });

      const { getAllByText, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for data to load
      await waitFor(() => {
        const roundNames = getAllByText('Test Round');
        expect(roundNames.length).toBeGreaterThan(0);
      });

      // Loading indicator should be gone
      expect(queryByTestId('loading-indicator')).toBeNull();
    });
  });

  // SLICE 3: Round Overview Card Tests
  describe('Slice 3: Round Overview Card', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Championship',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      course: {
        id: 'course-456',
        name: 'Pine Valley Golf Course',
        location: 'Pine Valley, NJ',
        holes: 18,
      },
      players: [
        {
          id: 1,
          username: 'testuser',
          display_name: 'Test User',
        },
      ],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
    });

    it('should render RoundOverviewCard component', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show round overview card
      await findByTestId('round-overview-card');
    });

    it('should display course name in the overview card', async () => {
      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display the course name
      await findByText('Pine Valley Golf Course');
    });

    it('should display course location and hole count', async () => {
      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display location and holes
      await findByText(/Pine Valley, NJ/);
      await findByText(/18.*holes/);
    });

    it('should format and display start date correctly', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show formatted date
      const dateElement = await findByTestId('round-date');
      expect(dateElement).toBeTruthy();
      // The date should be formatted as a readable string
      expect(dateElement.props.children).toContain('Started');
    });

    it('should display status badge with correct formatting', async () => {
      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show formatted status per UX spec
      await findByText('ROUND IN PROGRESS');
    });

    it('should handle different round statuses', async () => {
      const completedRound = {
        ...mockRoundWithDetails,
        status: 'completed',
      };
      getRoundDetails.mockResolvedValue(completedRound);

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show completed status per UX spec
      await findByText('ROUND COMPLETE');
    });

    it('should handle missing course information gracefully', async () => {
      const roundWithoutCourse = {
        ...mockRoundWithDetails,
        course: null,
      };
      getRoundDetails.mockResolvedValue(roundWithoutCourse);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should still render the overview card
      await findByTestId('round-overview-card');
    });

    it('should handle invalid date gracefully', async () => {
      const roundWithBadDate = {
        ...mockRoundWithDetails,
        start_time: 'invalid-date',
      };
      getRoundDetails.mockResolvedValue(roundWithBadDate);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should still show date section but with fallback text
      const dateElement = await findByTestId('round-date');
      expect(dateElement).toBeTruthy();
    });
  });

  // SLICE 4: Leaderboard Integration Tests
  describe('Slice 4: Leaderboard Integration', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Championship',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      course: {
        id: 'course-456',
        name: 'Pine Valley Golf Course',
        location: 'Pine Valley, NJ',
        holes: 18,
      },
      players: [],
    };

    const mockLeaderboard = [
      {
        id: 1,
        username: 'player1',
        display_name: 'Alice',
        position: 1,
        total_score: -3,
      },
      {
        id: 2,
        username: 'player2',
        display_name: 'Bob',
        position: 2,
        total_score: 1,
      },
    ];

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });
    });

    it('should call getRoundLeaderboard with roundId on mount', async () => {
      renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await waitFor(() => {
        expect(getRoundLeaderboard).toHaveBeenCalledWith('round-123');
      });
    });

    it('should render PlayerStandingsCard with leaderboard data', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show player standings card
      await findByTestId('player-standings-card');
    });

    it('should display all players in leaderboard', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show both players
      await findByTestId('player-1');
      await findByTestId('player-2');
    });

    it('should show loading state while fetching leaderboard', async () => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load, then check leaderboard loading state
      await findByTestId('round-overview-card');

      // Should show loading state in standings card
      await findByTestId('player-standings-card-loading');
    });

    it('should handle leaderboard fetch errors', async () => {
      getRoundLeaderboard.mockRejectedValue(new Error('Failed to load leaderboard'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should show error state
      await findByTestId('player-standings-card-error');
    });

    it('should handle empty leaderboard', async () => {
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should still render the standings card
      await findByTestId('player-standings-card');
    });

    it('should not call leaderboard API when roundId is missing', () => {
      const emptyRoute = {
        params: {},
      };

      renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={emptyRoute}
        />,
      );

      expect(getRoundLeaderboard).not.toHaveBeenCalled();
    });
  });

  // SLICE B1: Remove "Enter Scores" button
  describe('Slice B1: Enter Scores Button Removal', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
    });

    it('should NOT render Enter Scores button for in_progress rounds', async () => {
      const { queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await waitFor(() => {
        expect(getRoundDetails).toHaveBeenCalled();
      });

      // Button should NOT exist
      expect(queryByTestId('enter-scores-button')).toBeNull();
    });

    it('should NOT render Enter Scores button for completed rounds', async () => {
      const completedRound = {
        ...mockRoundWithDetails,
        status: 'completed',
      };
      getRoundDetails.mockResolvedValue(completedRound);

      const { queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await waitFor(() => {
        expect(getRoundDetails).toHaveBeenCalled();
      });

      // Button should NOT exist
      expect(queryByTestId('enter-scores-button')).toBeNull();
    });
  });

  // SLICE B2: Conditionally hide ScoreSummaryCard
  describe('Slice B2: ScoreSummaryCard Conditional Rendering', () => {
    const mockLeaderboard = [
      {
        id: 1,
        username: 'player1',
        display_name: 'Alice',
        position: 1,
        total_score: -3,
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should NOT render ScoreSummaryCard for in_progress rounds', async () => {
      const inProgressRound = {
        id: 'round-123',
        name: 'Morning Round',
        status: 'in_progress',
        start_time: '2023-12-01T09:00:00Z',
        course: {
          id: 'course-456',
          name: 'Test Course',
          location: 'Test City',
          holes: 18,
        },
        players: [],
      };

      getRoundDetails.mockResolvedValue(inProgressRound);
      getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });

      const { queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for data to load
      await waitFor(() => {
        expect(getRoundDetails).toHaveBeenCalled();
      });

      // ScoreSummaryCard should NOT render
      expect(queryByTestId('score-summary-card')).toBeNull();
    });

    it('should render ScoreSummaryCard for completed rounds', async () => {
      const completedRound = {
        id: 'round-123',
        name: 'Morning Round',
        status: 'completed',
        start_time: '2023-12-01T09:00:00Z',
        course: {
          id: 'course-456',
          name: 'Test Course',
          location: 'Test City',
          holes: 18,
        },
        players: [],
      };

      getRoundDetails.mockResolvedValue(completedRound);
      getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // ScoreSummaryCard should render
      await findByTestId('score-summary-card');
    });

    it('should render ScoreSummaryCard for cancelled rounds', async () => {
      const cancelledRound = {
        id: 'round-123',
        name: 'Morning Round',
        status: 'cancelled',
        start_time: '2023-12-01T09:00:00Z',
        course: {
          id: 'course-456',
          name: 'Test Course',
          location: 'Test City',
          holes: 18,
        },
        players: [],
      };

      getRoundDetails.mockResolvedValue(cancelledRound);
      getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // ScoreSummaryCard should render
      await findByTestId('score-summary-card');
    });
  });

  // SLICE C: Side Bets Integration Tests
  describe('Slice C: Side Bets Integration', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    };

    const mockSideBets = [
      {
        id: 'bet-1',
        name: 'Closest to Pin Hole 7',
        description: 'Closest to the pin on hole 7',
        amount: '10.00',
        bet_type: 'hole',
        hole_number: 7,
        winner_id: null,
        participants: [
          { id: 'p1', username: 'player1' },
          { id: 'p2', username: 'player2' },
        ],
      },
      {
        id: 'bet-2',
        name: 'Most Birdies',
        description: 'Most birdies in the round',
        amount: '20.00',
        bet_type: 'round',
        hole_number: null,
        winner_id: 'p1',
        participants: [
          { id: 'p1', username: 'player1' },
          { id: 'p2', username: 'player2' },
        ],
      },
    ];

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
    });

    describe('C1: Side Bets Fetching', () => {
      it('should call getRoundSideBets with roundId on mount', async () => {
        getRoundSideBets.mockResolvedValue([]);

        renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await waitFor(() => {
          expect(getRoundSideBets).toHaveBeenCalledWith('round-123');
        });
      });

      it('should not call getRoundSideBets when roundId is missing', () => {
        const emptyRoute = {
          params: {},
        };

        renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={emptyRoute}
          />,
        );

        expect(getRoundSideBets).not.toHaveBeenCalled();
      });

      it('should handle side bets API errors gracefully', async () => {
        getRoundSideBets.mockRejectedValue(new Error('Failed to load side bets'));

        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // Should still render the screen
        await findByTestId('round-overview-card');
      });
    });

    describe('C2: SideBetsCard Rendering', () => {
      it('should render SideBetsCard component', async () => {
        getRoundSideBets.mockResolvedValue(mockSideBets);

        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('side-bets-card');
      });

      it('should pass side bets data to SideBetsCard', async () => {
        getRoundSideBets.mockResolvedValue(mockSideBets);

        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // Should display both bets
        await findByTestId('bet-bet-1');
        await findByTestId('bet-bet-2');
      });

      it('should show loading state while fetching side bets', async () => {
        getRoundSideBets.mockImplementation(() => new Promise(() => {})); // Never resolves

        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // Wait for round to load first
        await findByTestId('round-overview-card');

        // Should show loading state in side bets card
        await findByTestId('side-bets-card-loading');
      });

      it('should render SideBetsCard with empty array when no bets exist', async () => {
        getRoundSideBets.mockResolvedValue([]);

        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // Should still render the card
        await findByTestId('side-bets-card');
      });
    });

    describe('C3: Pull to Refresh with Side Bets', () => {
      it('should include side bets in refresh operations', async () => {
        getRoundSideBets.mockResolvedValue(mockSideBets);

        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // Wait for initial load
        await findByTestId('side-bets-card');

        // Verify all three APIs are called on mount
        await waitFor(() => {
          expect(getRoundDetails).toHaveBeenCalledTimes(1);
          expect(getRoundLeaderboard).toHaveBeenCalledTimes(1);
          expect(getRoundSideBets).toHaveBeenCalledTimes(1);
        });

        // This verifies that side bets are integrated into the data fetching flow
        // The actual pull-to-refresh testing requires E2E testing framework
      });
    });
  });

  // SLICE 13.4: RoundStatusBadge Integration
  describe('Slice 13.4: RoundStatusBadge Integration', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
      useAuth.mockReturnValue({
        user: { id: 999 },
        isAuthenticated: true,
      });
    });

    it('should render RoundStatusBadge with round status', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display status badge
      await findByTestId('round-status-badge');
    });

    it('should NOT render old status display (Icon + Text in View)', async () => {
      // eslint-disable-next-line camelcase
      const { findByTestId, UNSAFE_queryAllByType } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await findByTestId('round-overview-card');

      // Should render RoundStatusBadge (new component)
      const statusBadge = await findByTestId('round-status-badge');
      expect(statusBadge).toBeTruthy();

      // Old status container with Icon should NOT exist
      // (The old implementation used Icon from ionicons with name="checkmark-circle-outline")

      const icons = UNSAFE_queryAllByType(Icon);
      // Icons should only be in player rows, not in status display
      // Check that no Icon has the checkmark-circle-outline name
      const statusIcons = icons.filter((icon) => icon.props.name === 'checkmark-circle-outline');
      expect(statusIcons.length).toBe(0);
    });

    it('should render RoundStatusBadge for different statuses', async () => {
      const completedRound = {
        ...mockRoundWithDetails,
        status: 'completed',
      };
      getRoundDetails.mockResolvedValue(completedRound);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display status badge
      await findByTestId('round-status-badge');
    });
  });

  // SLICE 13.5: Remove Duplicate Players Section
  describe('Slice 13.5: Remove Duplicate Players Section', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [
        {
          id: 1,
          username: 'player1',
          display_name: 'Player One',
        },
        {
          id: 2,
          username: 'player2',
          display_name: 'Player Two',
        },
      ],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });
    });

    it('should NOT render standalone players section (testID="players-section")', async () => {
      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await findByTestId('round-overview-card');

      // The old standalone "Players" section should NOT exist
      expect(queryByTestId('players-section')).toBeNull();
    });

    it('should still render PlayerStandingsCard (leaderboard)', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // PlayerStandingsCard should still be present
      await findByTestId('player-standings-card');
    });

    it('should not render duplicate player information in separate sections', async () => {
      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await findByTestId('round-overview-card');

      // Standalone players section should not exist
      expect(queryByTestId('players-section')).toBeNull();

      // PlayerStandingsCard should be the only place showing player info
      await findByTestId('player-standings-card');
    });
  });

  // SLICE 13.3: Owner Badge in Round Overview Card
  describe('Slice 13.3: Owner Badge', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
    });

    it('should display Creator badge when user is the round owner', async () => {
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display creator badge
      await findByTestId('creator-badge');
    });

    it('should NOT display Creator badge when user is not the round owner', async () => {
      useAuth.mockReturnValue({
        user: { id: 456 },
        isAuthenticated: true,
      });

      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await findByTestId('round-overview-card');

      // Should NOT display creator badge
      expect(queryByTestId('creator-badge')).toBeNull();
    });

    it('should display Creator badge text correctly', async () => {
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display "Creator" text
      await findByText('CREATOR');
    });

    it('should NOT display Creator badge when user is null', async () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await findByTestId('round-overview-card');

      // Should NOT display creator badge
      expect(queryByTestId('creator-badge')).toBeNull();
    });

    it('should NOT display Creator badge when round.created_by_id is missing', async () => {
      const roundWithoutCreator = {
        ...mockRoundWithDetails,
        created_by_id: null,
      };
      getRoundDetails.mockResolvedValue(roundWithoutCreator);

      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for round to load
      await findByTestId('round-overview-card');

      // Should NOT display creator badge
      expect(queryByTestId('creator-badge')).toBeNull();
    });
  });

  // SLICE 13.7: FixedBottomActionBar Integration
  describe('Slice 13.7: FixedBottomActionBar Integration', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });
    });

    it('should render FixedBottomActionBar component', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display action bar
      await findByTestId('fixed-bottom-action-bar');
    });

    it('should display "Open Scorecard" as primary button label', async () => {
      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display "Open Scorecard" text
      await findByText('Open Scorecard');
    });

    it('should navigate to ScorecardRedesign when primary button is pressed', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for action bar and press it
      const primaryButton = await findByTestId('primary-action-button');
      fireEvent.press(primaryButton);

      // Should navigate to ScorecardRedesign with roundId
      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ScorecardRedesign', {
          roundId: 'round-123',
        });
      });
    });

    it('should enable button for in_progress rounds', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const primaryButton = await findByTestId('primary-action-button');

      // Button should not be disabled
      expect(primaryButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('should disable button when round status is cancelled', async () => {
      const cancelledRound = {
        ...mockRoundWithDetails,
        status: 'cancelled',
      };
      getRoundDetails.mockResolvedValue(cancelledRound);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const primaryButton = await findByTestId('primary-action-button');

      // Button should be disabled
      expect(primaryButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should disable button when round status is null', async () => {
      const roundWithNullStatus = {
        ...mockRoundWithDetails,
        status: null,
      };
      getRoundDetails.mockResolvedValue(roundWithNullStatus);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const primaryButton = await findByTestId('primary-action-button');

      // Button should be disabled
      expect(primaryButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should enable button for completed rounds', async () => {
      const completedRound = {
        ...mockRoundWithDetails,
        status: 'completed',
      };
      getRoundDetails.mockResolvedValue(completedRound);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const primaryButton = await findByTestId('primary-action-button');

      // Button should not be disabled (can view scorecard for completed rounds)
      expect(primaryButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('should not call navigate when button is disabled and pressed', async () => {
      const cancelledRound = {
        ...mockRoundWithDetails,
        status: 'cancelled',
      };
      getRoundDetails.mockResolvedValue(cancelledRound);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const primaryButton = await findByTestId('primary-action-button');
      fireEvent.press(primaryButton);

      // Should not navigate when disabled
      await waitFor(() => {
        expect(mockNavigation.navigate).not.toHaveBeenCalled();
      });
    });
  });

  // SLICE 13.8: Owner-Only Settings Button
  describe('Slice 13.8: Owner-Only Settings Button', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
    });

    it('should display Settings button when user is the round owner', async () => {
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display secondary action button (Settings)
      await findByTestId('secondary-action-button');
    });

    it('should NOT display Settings button when user is not the round owner', async () => {
      useAuth.mockReturnValue({
        user: { id: 456 },
        isAuthenticated: true,
      });

      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for action bar to load
      await findByTestId('fixed-bottom-action-bar');

      // Should NOT display secondary action button
      expect(queryByTestId('secondary-action-button')).toBeNull();
    });

    it('should display "Settings" label on secondary button', async () => {
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Should display "Settings" text
      await findByText('Settings');
    });

    it('should navigate to RoundSettings when Settings button is pressed', async () => {
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for settings button and press it
      const settingsButton = await findByTestId('secondary-action-button');
      fireEvent.press(settingsButton);

      // Should navigate to RoundSettings with roundId
      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('RoundSettings', {
          roundId: 'round-123',
        });
      });
    });

    it('should NOT display Settings button when user is null', async () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for action bar to load
      await findByTestId('fixed-bottom-action-bar');

      // Should NOT display secondary action button
      expect(queryByTestId('secondary-action-button')).toBeNull();
    });

    it('should NOT display Settings button when round.created_by_id is missing', async () => {
      const roundWithoutCreator = {
        ...mockRoundWithDetails,
        created_by_id: null,
      };
      getRoundDetails.mockResolvedValue(roundWithoutCreator);

      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for action bar to load
      await findByTestId('fixed-bottom-action-bar');

      // Should NOT display secondary action button
      expect(queryByTestId('secondary-action-button')).toBeNull();
    });
  });

  // SLICE 13.9: Wire Empty State CTA to Navigation
  describe('Slice 13.9: Empty State CTA Navigation', () => {
    const mockRoundWithDetails = {
      id: 'round-123',
      name: 'Morning Round',
      status: 'in_progress',
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    };

    beforeEach(() => {
      getRoundDetails.mockResolvedValue(mockRoundWithDetails);
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });
    });

    it('should pass onEmptyAction prop to PlayerStandingsCard', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for player standings card with empty state
      await findByTestId('player-standings-card');

      // The empty state button should exist (from mock)
      const emptyStateButton = await findByTestId('empty-state-action-button');
      expect(emptyStateButton).toBeTruthy();
    });

    it('should navigate to ScorecardRedesign when empty state button is pressed', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for empty state button
      const emptyStateButton = await findByTestId('empty-state-action-button');

      // Press the button
      fireEvent.press(emptyStateButton);

      // Should navigate to ScorecardRedesign with roundId
      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ScorecardRedesign', {
          roundId: 'round-123',
        });
      });
    });

    it('should not render empty state button when leaderboard has players', async () => {
      const mockLeaderboard = [
        {
          id: 1,
          username: 'player1',
          display_name: 'Alice',
          position: 1,
          total_score: -3,
        },
      ];
      getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });

      const { findByTestId, queryByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for player standings card
      await findByTestId('player-standings-card');

      // Empty state button should NOT exist
      expect(queryByTestId('empty-state-action-button')).toBeNull();
    });

    it('should use existing handleOpenScorecard function for navigation', async () => {
      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      // Wait for empty state button
      const emptyStateButton = await findByTestId('empty-state-action-button');

      // Press the button
      fireEvent.press(emptyStateButton);

      // Should call navigation.navigate with correct screen and params
      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ScorecardRedesign', {
          roundId: 'round-123',
        });
      });

      // Verify it was called exactly once
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
    });
  });

  // SLICE 3: Adaptive Button Labels
  describe('SLICE 3: Adaptive Button Labels', () => {
    const createMockRound = (status) => ({
      id: 'round-123',
      name: 'Test Round',
      status,
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    });

    beforeEach(() => {
      jest.clearAllMocks();
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });
    });

    it('should display "View Details" button for pending rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('pending'));

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await findByText('View Details');
    });

    it('should display "View Details" button for confirmed rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('confirmed'));

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await findByText('View Details');
    });

    it('should display "Open Scorecard" button for in_progress rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('in_progress'));

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await findByText('Open Scorecard');
    });

    it('should display "View Summary" button for completed rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('completed'));

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await findByText('View Summary');
    });

    it('should display "View Details" button for cancelled rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('cancelled'));

      const { findByText } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await findByText('View Details');
    });

    it('should display same button label for owner and non-owner (pending)', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('pending'));

      // Test as owner
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByText: findByTextOwner } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await findByTextOwner('View Details');

      // Test as non-owner
      jest.clearAllMocks();
      getRoundDetails.mockResolvedValue(createMockRound('pending'));
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);

      useAuth.mockReturnValue({
        user: { id: 999 },
        isAuthenticated: true,
      });

      const { findByText: findByTextNonOwner } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={{ params: { roundId: 'round-123' } }}
        />,
      );

      await findByTextNonOwner('View Details');
    });

    it('should display same button label for owner and non-owner (in_progress)', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('in_progress'));

      // Test as owner
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });

      const { findByText: findByTextOwner } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      await findByTextOwner('Open Scorecard');

      // Test as non-owner
      jest.clearAllMocks();
      getRoundDetails.mockResolvedValue(createMockRound('in_progress'));
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);

      useAuth.mockReturnValue({
        user: { id: 999 },
        isAuthenticated: true,
      });

      const { findByText: findByTextNonOwner } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={{ params: { roundId: 'round-123' } }}
        />,
      );

      await findByTextNonOwner('Open Scorecard');
    });
  });

  // SLICE 4: Adaptive Date Labels
  describe('SLICE 4: Adaptive Date Labels', () => {
    const createMockRound = (status) => ({
      id: 'round-123',
      name: 'Test Round',
      status,
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    });

    beforeEach(() => {
      jest.clearAllMocks();
      getRoundLeaderboard.mockResolvedValue({ players: [], roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });
    });

    it('should display "Created" label for pending rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('pending'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const dateElement = await findByTestId('round-date');
      expect(dateElement.props.children).toContain('Created');
    });

    it('should display "Starts" label for confirmed rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('confirmed'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const dateElement = await findByTestId('round-date');
      expect(dateElement.props.children).toContain('Starts');
    });

    it('should display "Started" label for in_progress rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('in_progress'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const dateElement = await findByTestId('round-date');
      expect(dateElement.props.children).toContain('Started');
    });

    it('should display "Completed" label for completed rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('completed'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const dateElement = await findByTestId('round-date');
      expect(dateElement.props.children).toContain('Completed');
    });

    it('should display "Cancelled" label for cancelled rounds', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('cancelled'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const dateElement = await findByTestId('round-date');
      expect(dateElement.props.children).toContain('Cancelled');
    });

    it('should display "Created" label for unknown/null status', async () => {
      const roundWithNullStatus = createMockRound(null);
      getRoundDetails.mockResolvedValue(roundWithNullStatus);

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const dateElement = await findByTestId('round-date');
      expect(dateElement.props.children).toContain('Created');
    });

    it('should still format date correctly with adaptive label', async () => {
      getRoundDetails.mockResolvedValue(createMockRound('in_progress'));

      const { findByTestId } = renderWithNavigation(
        <RoundDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />,
      );

      const dateElement = await findByTestId('round-date');
      // Should have both the label and a formatted date
      const childrenArray = dateElement.props.children;
      expect(childrenArray).toContain('Started');
      // The formatted date should be in the children
      expect(childrenArray.some((child) => typeof child === 'string' && child.includes('2023'))).toBe(true);
    });
  });

  // SLICE 2: Audit RoundDetailScreen Current Status Handling
  describe('SLICE 2: Audit - Current Status Handling Baseline Tests', () => {
    const createMockRound = (status) => ({
      id: 'round-123',
      name: 'Test Round',
      status,
      start_time: '2023-12-01T09:00:00Z',
      created_by_id: 123,
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
      players: [],
    });

    const mockLeaderboard = [
      {
        id: 1,
        username: 'player1',
        display_name: 'Player One',
        position: 1,
        total_score: -2,
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });
      getRoundSideBets.mockResolvedValue([]);
      useAuth.mockReturnValue({
        user: { id: 123 },
        isAuthenticated: true,
      });
    });

    describe('Status: pending', () => {
      beforeEach(() => {
        getRoundDetails.mockResolvedValue(createMockRound('pending'));
      });

      it('should render screen with pending status', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
      });

      it('should display RoundStatusBadge with pending status', async () => {
        const { findByTestId, findByText } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-status-badge');
        // StatusBadge should show "PENDING CONFIRMATION" for pending status
        await findByText('PENDING CONFIRMATION');
      });

      it('should render FixedBottomActionBar for pending rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('fixed-bottom-action-bar');
      });

      it('should enable scorecard button for pending rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        const primaryButton = await findByTestId('primary-action-button');
        expect(primaryButton.props.accessibilityState?.disabled).toBe(false);
      });

      it('should NOT render RoundActionsMenu for pending rounds', async () => {
        const { findByTestId, queryByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
        expect(queryByTestId('round-actions-menu')).toBeNull();
      });

      it('should NOT render ScoreSummaryCard for pending rounds', async () => {
        const { findByTestId, queryByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
        expect(queryByTestId('score-summary-card')).toBeNull();
      });

      it('should render PlayerStandingsCard for pending rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('player-standings-card');
      });

      it('should display owner Settings button for pending rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('secondary-action-button');
      });
    });

    describe('Status: confirmed', () => {
      beforeEach(() => {
        getRoundDetails.mockResolvedValue(createMockRound('confirmed'));
      });

      it('should render screen with confirmed status', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
      });

      it('should display RoundStatusBadge with confirmed status', async () => {
        const { findByTestId, findByText } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-status-badge');
        // StatusBadge should show "READY TO PLAY" for confirmed status
        await findByText('READY TO PLAY');
      });

      it('should render FixedBottomActionBar for confirmed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('fixed-bottom-action-bar');
      });

      it('should enable scorecard button for confirmed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        const primaryButton = await findByTestId('primary-action-button');
        expect(primaryButton.props.accessibilityState?.disabled).toBe(false);
      });

      it('should NOT render RoundActionsMenu for confirmed rounds', async () => {
        const { findByTestId, queryByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
        expect(queryByTestId('round-actions-menu')).toBeNull();
      });

      it('should NOT render ScoreSummaryCard for confirmed rounds', async () => {
        const { findByTestId, queryByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
        expect(queryByTestId('score-summary-card')).toBeNull();
      });

      it('should render PlayerStandingsCard for confirmed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('player-standings-card');
      });

      it('should display owner Settings button for confirmed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('secondary-action-button');
      });
    });

    describe('Status: in_progress (BASELINE)', () => {
      beforeEach(() => {
        getRoundDetails.mockResolvedValue(createMockRound('in_progress'));
      });

      it('should render screen with in_progress status', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
      });

      it('should display RoundStatusBadge with in_progress status', async () => {
        const { findByTestId, findByText } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-status-badge');
        await findByText('ROUND IN PROGRESS');
      });

      it('should render FixedBottomActionBar for in_progress rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('fixed-bottom-action-bar');
      });

      it('should enable scorecard button for in_progress rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        const primaryButton = await findByTestId('primary-action-button');
        expect(primaryButton.props.accessibilityState?.disabled).toBe(false);
      });

      it('should render RoundActionsMenu for in_progress rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // RoundActionsMenu only shows for in_progress status (line 387-392)
        await findByTestId('round-actions-menu');
      });

      it('should NOT render ScoreSummaryCard for in_progress rounds', async () => {
        const { findByTestId, queryByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
        // ScoreSummaryCard only renders for completed/cancelled (line 456-459)
        expect(queryByTestId('score-summary-card')).toBeNull();
      });

      it('should render PlayerStandingsCard for in_progress rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('player-standings-card');
      });

      it('should display owner Settings button for in_progress rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('secondary-action-button');
      });
    });

    describe('Status: completed (BASELINE)', () => {
      beforeEach(() => {
        getRoundDetails.mockResolvedValue(createMockRound('completed'));
      });

      it('should render screen with completed status', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
      });

      it('should display RoundStatusBadge with completed status', async () => {
        const { findByTestId, findByText } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-status-badge');
        await findByText('ROUND COMPLETE');
      });

      it('should render FixedBottomActionBar for completed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('fixed-bottom-action-bar');
      });

      it('should enable scorecard button for completed rounds (view-only)', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        const primaryButton = await findByTestId('primary-action-button');
        // Button is enabled but scorecard should be read-only
        expect(primaryButton.props.accessibilityState?.disabled).toBe(false);
      });

      it('should NOT render RoundActionsMenu for completed rounds', async () => {
        const { findByTestId, queryByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
        // RoundActionsMenu only shows for in_progress (line 387)
        expect(queryByTestId('round-actions-menu')).toBeNull();
      });

      it('should render ScoreSummaryCard for completed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // ScoreSummaryCard renders for completed status (line 457)
        await findByTestId('score-summary-card');
      });

      it('should render PlayerStandingsCard for completed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('player-standings-card');
      });

      it('should display owner Settings button for completed rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('secondary-action-button');
      });
    });

    describe('Status: cancelled (BASELINE)', () => {
      beforeEach(() => {
        getRoundDetails.mockResolvedValue(createMockRound('cancelled'));
      });

      it('should render screen with cancelled status', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
      });

      it('should display RoundStatusBadge with cancelled status', async () => {
        const { findByTestId, findByText } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-status-badge');
        await findByText('CANCELLED');
      });

      it('should render FixedBottomActionBar for cancelled rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('fixed-bottom-action-bar');
      });

      it('should disable scorecard button for cancelled rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        const primaryButton = await findByTestId('primary-action-button');
        // Button is disabled for cancelled rounds (line 334)
        expect(primaryButton.props.accessibilityState?.disabled).toBe(true);
      });

      it('should NOT render RoundActionsMenu for cancelled rounds', async () => {
        const { findByTestId, queryByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('round-overview-card');
        // RoundActionsMenu only shows for in_progress (line 387)
        expect(queryByTestId('round-actions-menu')).toBeNull();
      });

      it('should render ScoreSummaryCard for cancelled rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        // ScoreSummaryCard renders for cancelled status (line 457)
        await findByTestId('score-summary-card');
      });

      it('should render PlayerStandingsCard for cancelled rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('player-standings-card');
      });

      it('should display owner Settings button for cancelled rounds', async () => {
        const { findByTestId } = renderWithNavigation(
          <RoundDetailScreen
            navigation={mockNavigation}
            route={mockRoute}
          />,
        );

        await findByTestId('secondary-action-button');
      });
    });

    describe('Status-Dependent UI Elements Summary', () => {
      it('should only show RoundActionsMenu for in_progress status', async () => {
        // Test each status individually to check RoundActionsMenu visibility
        const testStatus = async (status, shouldHaveMenu) => {
          jest.clearAllMocks();
          getRoundDetails.mockResolvedValue(createMockRound(status));
          getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });
          getRoundSideBets.mockResolvedValue([]);

          const { findByTestId, queryByTestId } = renderWithNavigation(
            <RoundDetailScreen
              navigation={mockNavigation}
              route={mockRoute}
            />,
          );

          await findByTestId('round-overview-card');
          const hasMenu = queryByTestId('round-actions-menu') !== null;
          expect(hasMenu).toBe(shouldHaveMenu);
        };

        // Only in_progress should have the menu (line 387)
        await testStatus('pending', false);
        await testStatus('confirmed', false);
        await testStatus('in_progress', true);
        await testStatus('completed', false);
        await testStatus('cancelled', false);
      });

      it('should only show ScoreSummaryCard for completed and cancelled statuses', async () => {
        // Test each status individually to check ScoreSummaryCard visibility
        const testStatus = async (status, shouldHaveSummary) => {
          jest.clearAllMocks();
          getRoundDetails.mockResolvedValue(createMockRound(status));
          getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });
          getRoundSideBets.mockResolvedValue([]);

          const { findByTestId, queryByTestId } = renderWithNavigation(
            <RoundDetailScreen
              navigation={mockNavigation}
              route={mockRoute}
            />,
          );

          await findByTestId('round-overview-card');
          const hasSummary = queryByTestId('score-summary-card') !== null;
          expect(hasSummary).toBe(shouldHaveSummary);
        };

        // Only completed and cancelled should have the summary card (line 457)
        await testStatus('pending', false);
        await testStatus('confirmed', false);
        await testStatus('in_progress', false);
        await testStatus('completed', true);
        await testStatus('cancelled', true);
      });

      it('should only disable scorecard button for cancelled status', async () => {
        // Test each status individually to check button disabled state
        const testStatus = async (status, shouldBeDisabled) => {
          jest.clearAllMocks();
          getRoundDetails.mockResolvedValue(createMockRound(status));
          getRoundLeaderboard.mockResolvedValue({ players: mockLeaderboard, roundSettings: {} });
          getRoundSideBets.mockResolvedValue([]);

          const { findByTestId } = renderWithNavigation(
            <RoundDetailScreen
              navigation={mockNavigation}
              route={mockRoute}
            />,
          );

          const primaryButton = await findByTestId('primary-action-button');
          const isDisabled = primaryButton.props.accessibilityState?.disabled;
          expect(isDisabled).toBe(shouldBeDisabled);
        };

        // Only cancelled should have disabled button (line 334)
        await testStatus('pending', false);
        await testStatus('confirmed', false);
        await testStatus('in_progress', false);
        await testStatus('completed', false);
        await testStatus('cancelled', true);
      });
    });
  });
});
