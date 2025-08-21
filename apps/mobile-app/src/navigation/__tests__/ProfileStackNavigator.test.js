import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProfileStackNavigator from '../ProfileStackNavigator';

// Mock the screen components
jest.mock('../../screens/settings/SettingsScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function SettingsScreen() {
    return ReactLocal.createElement(Text, { testID: 'settings-screen' }, 'SettingsScreen');
  };
});

jest.mock('../../screens/settings/AccountSettingsScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AccountSettingsScreen() {
    return ReactLocal.createElement(Text, { testID: 'account-settings-screen' }, 'AccountSettingsScreen');
  };
});

jest.mock('../../screens/settings/AboutScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AboutScreen() {
    return ReactLocal.createElement(Text, { testID: 'about-screen' }, 'AboutScreen');
  };
});

jest.mock('../../screens/SupportScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function SupportScreen() {
    return ReactLocal.createElement(Text, { testID: 'support-screen' }, 'SupportScreen');
  };
});

describe('ProfileStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  it('should export a component', () => {
    expect(ProfileStackNavigator).toBeDefined();
    expect(typeof ProfileStackNavigator).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<ProfileStackNavigator />);

    // Should render the initial screen (Settings)
    expect(getByTestId('settings-screen')).toBeTruthy();
  });
});
