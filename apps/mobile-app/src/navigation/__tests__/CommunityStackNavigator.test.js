import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import CommunityStackNavigator from '../CommunityStackNavigator';

// Mock the screen components
jest.mock('../../screens/community/CommunityScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function CommunityScreen() {
    return ReactLocal.createElement(Text, { testID: 'community-screen' }, 'CommunityScreen');
  };
});

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

    // Should render the initial screen (Community)
    expect(getByTestId('community-screen')).toBeTruthy();
  });
});
