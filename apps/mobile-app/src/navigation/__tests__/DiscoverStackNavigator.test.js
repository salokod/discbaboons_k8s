import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import DiscoverStackNavigator from '../DiscoverStackNavigator';

// Mock the screen components
jest.mock('../../screens/discs/DiscSearchScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function DiscSearchScreen() {
    return ReactLocal.createElement(Text, { testID: 'disc-search-screen' }, 'DiscSearchScreen');
  };
});

jest.mock('../../screens/discs/SubmitDiscScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function SubmitDiscScreen() {
    return ReactLocal.createElement(Text, { testID: 'submit-disc-screen' }, 'SubmitDiscScreen');
  };
});

jest.mock('../../screens/settings/DiscDatabaseScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function DiscDatabaseScreen() {
    return ReactLocal.createElement(Text, { testID: 'disc-database-screen' }, 'DiscDatabaseScreen');
  };
});

describe('DiscoverStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  it('should export a component', () => {
    expect(DiscoverStackNavigator).toBeDefined();
    expect(typeof DiscoverStackNavigator).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<DiscoverStackNavigator />);

    // Should render the initial screen (DiscSearch)
    expect(getByTestId('disc-search-screen')).toBeTruthy();
  });
});
