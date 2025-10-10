/**
 * Integration Test Setup for Mobile App
 *
 * This setup file configures the test environment for integration tests
 * that validate mobile app communication with express-server endpoints.
 */

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-mobile-integration-tests';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-mobile-integration-tests';

// Mock React Native globals for testing
// eslint-disable-next-line no-underscore-dangle
global.__DEV__ = false;

// Mock react-native-haptic-feedback for integration tests
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    selection: 'selection',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));

// Mock react-native-keychain for integration tests
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

// Mock react-native-gesture-handler for integration tests
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  function MockSwipeable({ children, renderRightActions }) {
    const rightActions = renderRightActions ? renderRightActions() : null;
    return React.createElement(View, null, children, rightActions);
  }

  return {
    Swipeable: MockSwipeable,
    PanGestureHandler: View,
    TapGestureHandler: View,
    GestureHandlerRootView: View,
    State: {},
    Directions: {},
  };
});

// Mock AsyncStorage for integration tests
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

// Comprehensive React Native mock for integration tests
jest.mock('react-native', () => {
  const React = require('react');

  return {
    Platform: {
      OS: 'ios',
      select: (obj) => obj.ios || obj.default,
    },
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    StyleSheet: {
      create: (styles) => styles,
      absoluteFill: {
        position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      },
      hairlineWidth: 1,
      flatten: (styles) => (Array.isArray(styles) ? Object.assign({}, ...styles) : styles),
    },
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn(),
      removeChangeListener: jest.fn(),
    },
    View: ({
      children, testID, style, ...props
    }) => React.createElement('View', { testID, style, ...props }, children),
    Text: ({
      children, testID, style, ...props
    }) => React.createElement('Text', { testID, style, ...props }, children),
    TouchableOpacity: ({
      children, testID, onPress, style, ...props
    }) => React.createElement('TouchableOpacity', {
      testID, onPress, style, ...props,
    }, children),
    SafeAreaView: ({
      children, testID, style, ...props
    }) => React.createElement('SafeAreaView', { testID, style, ...props }, children),
    ScrollView: ({
      children, testID, style, ...props
    }) => React.createElement('ScrollView', { testID, style, ...props }, children),
    FlatList: ({
      testID, data, renderItem, style, ...props
    }) => {
      const items = data ? data.map((item, index) => renderItem({ item, index })) : [];
      return React.createElement('FlatList', { testID, style, ...props }, items);
    },
    SectionList: ({
      testID, sections, renderItem, renderSectionHeader, style, ...props
    }) => {
      const sectionItems = sections ? sections.flatMap((section) => [
        renderSectionHeader ? renderSectionHeader({ section }) : null,
        ...section.data.map((item, index) => renderItem({ item, index, section })),
      ]) : [];
      return React.createElement('SectionList', { testID, style, ...props }, sectionItems);
    },
    Image: ({
      testID, source, style, ...props
    }) => React.createElement('Image', {
      testID, source, style, ...props,
    }),
    TextInput: ({
      testID, value, onChangeText, style, ...props
    }) => React.createElement('TextInput', {
      testID, value, onChangeText, style, ...props,
    }),
    Alert: {
      alert: jest.fn(),
    },
    ActivityIndicator: ({ testID, style, ...props }) => React.createElement('ActivityIndicator', { testID, style, ...props }),
    RefreshControl: (props) => React.createElement('RefreshControl', props),
    Pressable: ({
      children, testID, onPress, style, ...props
    }) => React.createElement('Pressable', {
      testID, onPress, style, ...props,
    }, children),
    Modal: ({
      children, visible, testID, ...props
    }) => (visible ? React.createElement('Modal', { testID, ...props }, children) : null),
    KeyboardAvoidingView: ({
      children, testID, style, ...props
    }) => React.createElement('KeyboardAvoidingView', { testID, style, ...props }, children),
    TouchableWithoutFeedback: ({
      children, testID, onPress, ...props
    }) => React.createElement('TouchableWithoutFeedback', { testID, onPress, ...props }, children),
    Animated: {
      View: ({
        children, testID, style, ...props
      }) => React.createElement('AnimatedView', { testID, style, ...props }, children),
      Text: ({
        children, testID, style, ...props
      }) => React.createElement('AnimatedText', { testID, style, ...props }, children),
      createAnimatedComponent: (component) => component,
      timing: jest.fn(() => ({ start: jest.fn() })),
      sequence: jest.fn(() => ({ start: jest.fn() })),
      loop: jest.fn(() => ({ start: jest.fn() })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        interpolate: jest.fn(() => ({})),
      })),
    },
  };
});

// Mock React Native Vector Icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Mock React Navigation components for integration tests
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  createNavigationContainerRef: () => ({
    current: null,
  }),
  DefaultTheme: {
    dark: false,
    colors: {
      primary: 'rgb(10, 132, 255)',
      background: 'rgb(242, 242, 242)',
      card: 'rgb(255, 255, 255)',
      text: 'rgb(28, 28, 30)',
      border: 'rgb(216, 216, 216)',
      notification: 'rgb(255, 59, 48)',
    },
  },
  DarkTheme: {
    dark: true,
    colors: {
      primary: 'rgb(10, 132, 255)',
      background: 'rgb(1, 1, 1)',
      card: 'rgb(18, 18, 18)',
      text: 'rgb(229, 229, 231)',
      border: 'rgb(39, 39, 41)',
      notification: 'rgb(255, 69, 58)',
    },
  },
  useFocusEffect: jest.fn(),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'MockScreen',
    key: 'mock-key',
  }),
  useIsFocused: () => true,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'StackNavigator',
    Screen: 'StackScreen',
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: 'TabNavigator',
    Screen: 'TabScreen',
  }),
}));

// Mock database environment variables to prevent connection errors during testing
process.env.POSTGRES_USER = 'test';
process.env.POSTGRES_PASSWORD = 'test';
process.env.POSTGRES_DB = 'test';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';

// Global test setup
beforeAll(async () => {
  // Setup complete
});

afterAll(async () => {
  // Cleanup complete
});

// Add a test to satisfy Jest requirement
describe('Integration Test Setup', () => {
  it('should configure test environment correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});
