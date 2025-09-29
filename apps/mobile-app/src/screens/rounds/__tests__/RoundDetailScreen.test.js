import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RoundDetailScreen from '../RoundDetailScreen';
import { getRoundDetails } from '../../../services/roundService';

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

describe('RoundDetailScreen', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    getRoundDetails.mockClear();
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
});
