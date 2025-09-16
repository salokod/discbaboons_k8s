import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import CommunityStackNavigator from '../CommunityStackNavigator';

// Mock the friends-related components
jest.mock('../../screens/friends/FriendsScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function FriendsScreen() {
    return ReactLocal.createElement(Text, { testID: 'friends-screen' }, 'FriendsScreen');
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
    <NavigationContainer>
      {component}
    </NavigationContainer>,
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
});
