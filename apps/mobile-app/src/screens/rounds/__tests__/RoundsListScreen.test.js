import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RoundsListScreen from '../RoundsListScreen';

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

jest.mock('../../../design-system/components/EmptyState', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function EmptyState({ title, subtitle, actionLabel }) {
    return ReactLocal.createElement(Text, { testID: 'empty-state' }, `${title} | ${subtitle} | ${actionLabel}`);
  };
});

jest.mock('../../../components/AppContainer', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return function AppContainer({ children }) {
    return ReactLocal.createElement(View, { testID: 'app-container' }, children);
  };
});

describe('RoundsListScreen', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without rounds and show empty state', async () => {
    const { getByTestId, getByText } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Should render the main screen container
    expect(getByTestId('rounds-list-screen')).toBeTruthy();

    // Wait for loading to complete and empty state to show
    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });

    // Should show empty state with appropriate message
    expect(getByText(/No rounds yet/)).toBeTruthy();
  });

  it('should render FAB button and be tappable', async () => {
    const { getByTestId } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });

    // Should render the FAB button
    expect(getByTestId('rounds-fab-button')).toBeTruthy();

    // FAB button should be tappable
    const fabButton = getByTestId('rounds-fab-button');
    expect(fabButton).toBeTruthy();

    // Test that it can be pressed (this will test the onPress handler)
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.press(fabButton);

    // Should have called navigation to CreateRound
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateRound');
  });
});
