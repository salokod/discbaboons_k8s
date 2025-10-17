import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RoundDetailScreen from '../RoundDetailScreen';
import { getRoundDetails, getRoundLeaderboard, getRoundSideBets } from '../../../services/roundService';

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
  const { View, Text } = require('react-native');
  return function PlayerStandingsCard({ players, loading, error }) {
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

      // Should show formatted status
      await findByText('In Progress');
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

      // Should show completed status
      await findByText('Completed');
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
});
