import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BagsStackNavigator from '../BagsStackNavigator';

// Mock the screen components
jest.mock('../../screens/bags/BagsListScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function BagsListScreen() {
    return ReactLocal.createElement(Text, { testID: 'bags-list-screen' }, 'BagsListScreen');
  };
});

jest.mock('../../screens/bags/CreateBagScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function CreateBagScreen() {
    return ReactLocal.createElement(Text, { testID: 'create-bag-screen' }, 'CreateBagScreen');
  };
});

jest.mock('../../screens/bags/BagDetailScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function BagDetailScreen() {
    return ReactLocal.createElement(Text, { testID: 'bag-detail-screen' }, 'BagDetailScreen');
  };
});

jest.mock('../../screens/bags/EditBagScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function EditBagScreen() {
    return ReactLocal.createElement(Text, { testID: 'edit-bag-screen' }, 'EditBagScreen');
  };
});

describe('BagsStackNavigator', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  it('should export a component', () => {
    expect(BagsStackNavigator).toBeDefined();
    expect(typeof BagsStackNavigator).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = renderWithNavigation(<BagsStackNavigator />);

    // Should render the initial screen (BagsList)
    expect(getByTestId('bags-list-screen')).toBeTruthy();
  });
});
