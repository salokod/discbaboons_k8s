import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AdminStackNavigator from '../AdminStackNavigator';

// Mock the screen components
jest.mock('../../screens/settings/AdminDashboardScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AdminDashboardScreen() {
    return ReactLocal.createElement(Text, { testID: 'admin-dashboard-screen' }, 'AdminDashboardScreen');
  };
});

jest.mock('../../screens/discs/AdminDiscScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function AdminDiscScreen() {
    return ReactLocal.createElement(Text, { testID: 'admin-disc-screen' }, 'AdminDiscScreen');
  };
});

describe('AdminStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  it('should export a component', () => {
    expect(AdminStackNavigator).toBeDefined();
    expect(typeof AdminStackNavigator).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<AdminStackNavigator />);

    // Should render the initial screen (AdminDashboard)
    expect(getByTestId('admin-dashboard-screen')).toBeTruthy();
  });
});
