import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RoundDetailScreen from '../RoundDetailScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route with round data
const mockRoute = {
  params: {
    roundId: 'round-123',
    round: {
      id: 'round-123',
      name: 'Morning Round',
      course_id: 'course-456',
      created_by_id: 1,
      start_time: '2023-12-01T09:00:00Z',
      status: 'in_progress',
      players: [
        {
          id: 1,
          username: 'testuser',
          display_name: 'Test User',
        },
      ],
      course: {
        id: 'course-456',
        name: 'Test Course',
        location: 'Test City',
        holes: 18,
      },
    },
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
  });

  it('should render with basic layout structure', () => {
    const { getByTestId } = renderWithNavigation(
      <RoundDetailScreen
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );

    // Should render the main screen container
    expect(getByTestId('round-detail-screen')).toBeTruthy();

    // Should have navigation header
    expect(getByTestId('round-detail-header')).toBeTruthy();
    expect(getByTestId('header-title')).toBeTruthy();
  });

  it('should display round information', () => {
    const { getAllByText, getByText } = renderWithNavigation(
      <RoundDetailScreen
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );

    // Should display round name (might appear in header and content)
    expect(getAllByText('Morning Round').length).toBeGreaterThan(0);

    // Should display course information
    expect(getByText('Test Course')).toBeTruthy();
    // Check that the course details are rendered (all parts should be present)
    expect(getByText(/Test City/)).toBeTruthy();
    expect(getByText(/18/)).toBeTruthy();
    expect(getByText(/holes/)).toBeTruthy();

    // Should display status
    expect(getByText('In Progress')).toBeTruthy();
  });

  it('should display round creation date', () => {
    const { getByTestId } = renderWithNavigation(
      <RoundDetailScreen
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );

    // Should show created date
    expect(getByTestId('round-date')).toBeTruthy();
  });

  it('should display players section', () => {
    const { getByText, getByTestId } = renderWithNavigation(
      <RoundDetailScreen
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );

    // Should have players section
    expect(getByTestId('players-section')).toBeTruthy();
    expect(getByText('Players')).toBeTruthy();

    // Should display player information
    expect(getByText('Test User')).toBeTruthy();
  });

  it('should handle back navigation', () => {
    const { getByTestId } = renderWithNavigation(
      <RoundDetailScreen
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );

    // Test that the navigation header is rendered with proper props
    const header = getByTestId('round-detail-header');
    expect(header).toBeTruthy();

    // The back button should exist
    const backButton = getByTestId('back-button');
    expect(backButton).toBeTruthy();
  });

  it('should handle missing round data gracefully', () => {
    const emptyRoute = {
      params: {
        roundId: 'round-123',
        // No round data
      },
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
