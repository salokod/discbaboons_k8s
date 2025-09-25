import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BagsStackNavigator from '../BagsStackNavigator';

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

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { username: 'testuser', isAdmin: false },
  })),
  AuthProvider: ({ children }) => children,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
  SafeAreaProvider: ({ children }) => children,
}));

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

jest.mock('../../screens/bags/LostDiscsScreen', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function LostDiscsScreen() {
    return ReactLocal.createElement(Text, { testID: 'lost-discs-screen' }, 'LostDiscsScreen');
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
