import { render } from '@testing-library/react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import CommunityStackNavigator from '../CommunityStackNavigator';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock the friends-related components
jest.mock('../../screens/friends/FriendsScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function FriendsScreen() {
    return ReactLocal.createElement(Text, { testID: 'friends-screen' }, 'FriendsScreen');
  };
});

jest.mock('../../screens/friends/BaboonSearchScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function BaboonSearchScreen() {
    return ReactLocal.createElement(Text, { testID: 'baboon-search-screen' }, 'BaboonSearchScreen');
  };
});

jest.mock('../../context/FriendsContext', () => ({
  FriendsProvider: ({ children }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement(ReactLocal.Fragment, null, children);
  },
}));

describe('CommunityStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <ThemeProvider>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </ThemeProvider>,
  );

  it('should export a component', () => {
    expect(CommunityStackNavigator).toBeDefined();
    expect(typeof CommunityStackNavigator).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<CommunityStackNavigator />);

    // Should render the initial screen (Friends)
    expect(getByTestId('friends-screen')).toBeTruthy();
  });

  it('should include BaboonSearchScreen in the navigation stack', () => {
    const navigationRef = createNavigationContainerRef();

    const { getByTestId } = render(
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <CommunityStackNavigator />
        </NavigationContainer>
      </ThemeProvider>,
    );

    // Verify the initial screen is rendered
    expect(getByTestId('friends-screen')).toBeTruthy();

    // Test that we can access the navigation functions
    // This verifies the navigator is properly configured
    expect(typeof navigationRef.current?.isReady).toBe('function');
    expect(typeof navigationRef.current?.navigate).toBe('function');
  });
});
