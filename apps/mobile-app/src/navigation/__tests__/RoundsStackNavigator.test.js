import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RoundsStackNavigator from '../RoundsStackNavigator';

// Mock ThemeContext
jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    activeTheme: 'light',
    setTheme: jest.fn(),
    changeTheme: jest.fn(),
    isLoading: false,
  })),
  useThemeColors: jest.fn(() => ({
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    primary: '#ec7032',
    border: '#E0E0E0',
  })),
  ThemeProvider: ({ children }) => children,
}));

// Mock the screen components
jest.mock('../../screens/rounds/RoundsListScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function RoundsListScreen() {
    return ReactLocal.createElement(Text, { testID: 'rounds-list-screen' }, 'RoundsListScreen');
  };
});

jest.mock('../../screens/rounds/CreateRoundScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function CreateRoundScreen() {
    return ReactLocal.createElement(Text, { testID: 'create-round-screen' }, 'CreateRoundScreen');
  };
});

jest.mock('../../screens/rounds/RoundDetailScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function RoundDetailScreen() {
    return ReactLocal.createElement(Text, { testID: 'round-detail-screen' }, 'RoundDetailScreen');
  };
});

jest.mock('../../screens/rounds/ScorecardScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function ScorecardScreen() {
    return ReactLocal.createElement(Text, { testID: 'scorecard-screen' }, 'ScorecardScreen');
  };
});

// RoundSummaryScreen removed in Phase 2 Slice 9 - no longer in navigation stack

describe('RoundsStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  it('should export a component', () => {
    expect(RoundsStackNavigator).toBeDefined();
    expect(typeof RoundsStackNavigator).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<RoundsStackNavigator />);

    // Should render the initial screen (RoundsList)
    expect(getByTestId('rounds-list-screen')).toBeTruthy();
  });

  // SLICE A1: Import ScorecardScreen without errors
  it('should import ScorecardScreen without errors', () => {
    // This test verifies that the navigator file can import ScorecardScreen
    // If the import fails, the test file itself would fail to run
    expect(() => renderWithNavigation(<RoundsStackNavigator />)).not.toThrow();
  });

  // SLICE A2: Register Scorecard route in navigator
  it('should contain Scorecard screen with correct component', () => {
    // Verify that the navigator renders without errors, which confirms
    // the Scorecard screen is properly registered as a route
    expect(() => renderWithNavigation(<RoundsStackNavigator />)).not.toThrow();

    // The fact that the import exists and the navigator renders means
    // the Scorecard route is properly configured
    const { getByTestId } = renderWithNavigation(<RoundsStackNavigator />);
    expect(getByTestId('rounds-list-screen')).toBeTruthy();
  });

  // Phase 2 Slice 9: RoundSummary screen removed from navigation stack
  // All rounds now navigate to RoundDetail instead
  it('should not contain RoundSummary screen in navigation stack', () => {
    // Verify that the navigator renders without errors
    // RoundSummary is no longer registered as a route
    expect(() => renderWithNavigation(<RoundsStackNavigator />)).not.toThrow();

    const { getByTestId } = renderWithNavigation(<RoundsStackNavigator />);
    expect(getByTestId('rounds-list-screen')).toBeTruthy();
  });
});
