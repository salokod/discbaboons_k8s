/**
 * Test Setup for React Native Unit Tests
 *
 * This setup file is loaded before all unit tests run.
 * It configures mocks and globals needed for React Native testing.
 */

// Mock React Native globals
// eslint-disable-next-line no-underscore-dangle
global.__DEV__ = false;

// Mock console to reduce noise in tests
// eslint-disable-next-line no-console
const originalError = console.error;
// eslint-disable-next-line no-console
console.error = (...args) => {
  // Suppress act() warnings which are common in React Native testing
  // These warnings don't affect test results and create noise
  if (
    typeof args[0] === 'string'
    && (args[0].includes('inside a test was not wrapped in act')
     || (args[0].includes('An update to') && args[0].includes('inside a test was not wrapped in act')))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Pure React Native color picker implementation - no external dependencies needed

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const actualReanimated = jest.requireActual('react-native-reanimated/mock');
  return {
    ...actualReanimated,
    default: {
      ...actualReanimated.default,
      // Add any additional mocks if needed
    },
    runOnJS: jest.fn((fn) => fn),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  function MockSwipeable({ children, renderRightActions }) {
    const rightActions = renderRightActions ? renderRightActions() : null;
    return React.createElement(View, null, children, rightActions);
  }

  const mockGesture = {
    Pan: jest.fn(() => mockGesture),
    Tap: jest.fn(() => mockGesture),
    onEnd: jest.fn(() => mockGesture),
    onStart: jest.fn(() => mockGesture),
    onUpdate: jest.fn(() => mockGesture),
    runOnJS: jest.fn((fn) => fn),
  };

  return {
    Swipeable: MockSwipeable,
    // Include other gesture handler components if needed
    PanGestureHandler: View,
    TapGestureHandler: View,
    GestureHandlerRootView: View,
    GestureDetector: ({ children }) => React.createElement(View, null, children),
    Gesture: mockGesture,
    State: {},
    Directions: {},
  };
});

// Mock AsyncStorage for theme persistence
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {
    selection: 'selection',
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
  canImplyAuthentication: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('TouchID')),
  SECURITY_LEVEL: {},
  ACCESS_CONTROL: {},
  AUTHENTICATION_TYPE: {},
  BIOMETRY_TYPE: {},
}));

// Mock React Navigation to prevent Consumer errors
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');

  return {
    ...actual,
    NavigationContainer: ({ children }) => children,
    useNavigation: jest.fn(() => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      canGoBack: jest.fn(() => false),
      dispatch: jest.fn(),
      reset: jest.fn(),
      isFocused: jest.fn(() => true),
      getId: jest.fn(() => 'test-screen'),
    })),
    useRoute: jest.fn(() => ({
      key: 'test-route',
      name: 'TestScreen',
      params: {},
    })),
    useFocusEffect: jest.fn((callback) => {
      // Execute callback immediately for testing
      callback();
    }),
    useIsFocused: jest.fn(() => true),
    useTheme: jest.fn(() => ({
      dark: false,
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        card: '#FFFFFF',
        text: '#000000',
        border: '#C7C7CC',
        notification: '#FF3B30',
      },
    })),
    DefaultTheme: {
      dark: false,
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        card: '#FFFFFF',
        text: '#000000',
        border: '#C7C7CC',
        notification: '#FF3B30',
      },
    },
    DarkTheme: {
      dark: true,
      colors: {
        primary: '#0A84FF',
        background: '#000000',
        card: '#1C1C1E',
        text: '#FFFFFF',
        border: '#272729',
        notification: '#FF453A',
      },
    },
    createNavigationContainerRef: jest.fn(() => ({
      current: {
        navigate: jest.fn(),
        goBack: jest.fn(),
        getCurrentRoute: jest.fn(() => ({ name: 'TestScreen' })),
        isReady: jest.fn(() => true),
      },
    })),
  };
});

// Mock Bottom Tab Navigator
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const Tab = {
    Navigator: ({ children }) => React.createElement(View, { testID: 'tab-navigator-mock' }, [
      // Render tab bar with labels
      React.createElement(
        View,
        { key: 'tab-bar', testID: 'tab-bar' },
        React.Children.map(children, (child) => {
          if (child?.props?.name) {
            const label = child.props.options?.tabBarLabel || child.props.name;
            return React.createElement(Text, {
              key: `tab-label-${child.props.name}`,
              testID: `tab-label-${child.props.name}`,
            }, label);
          }
          return null;
        }),
      ),
      // Render the screens
      React.createElement(View, { key: 'screens', testID: 'tab-screens' }, children),
    ]),
    Screen: ({
      component: Component, name, options, ...props
    }) => {
      // If there's a component, render it with mock navigation, otherwise render children
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
        removeListener: jest.fn(),
        canGoBack: jest.fn(() => false),
        dispatch: jest.fn(),
        reset: jest.fn(),
        isFocused: jest.fn(() => true),
        getId: jest.fn(() => 'test-screen'),
      };

      const content = Component
        ? React.createElement(Component, {
          ...props,
          testID: `tab-screen-${name}`,
          navigation: mockNavigation,
        })
        : React.createElement(View, { testID: `tab-screen-${name}` });
      return content;
    },
  };

  return {
    createBottomTabNavigator: jest.fn(() => Tab),
  };
});

// Mock Native Stack Navigator
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Stack = {
    Navigator: ({ children }) => React.createElement(View, { testID: 'stack-navigator' }, children),
    Screen: ({ component: Component, name, ...props }) => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
        removeListener: jest.fn(),
        canGoBack: jest.fn(() => false),
        dispatch: jest.fn(),
        reset: jest.fn(),
        isFocused: jest.fn(() => true),
        getId: jest.fn(() => 'test-screen'),
      };

      const content = Component
        ? React.createElement(Component, {
          ...props,
          testID: `stack-screen-${name}`,
          navigation: mockNavigation,
        })
        : React.createElement(View, { testID: `stack-screen-${name}` });
      return content;
    },
  };

  return {
    createNativeStackNavigator: jest.fn(() => Stack),
  };
});

// Mock StatusBarSafeView component
jest.mock('./src/components/StatusBarSafeView', () => {
  const React = require('react');
  const { View } = require('react-native');

  return function StatusBarSafeView({ children, testID, ...props }) {
    return React.createElement(View, { testID, ...props }, children);
  };
});
