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

// Mock React Native Platform for node environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
}));

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

jest.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: () => ({
    Navigator: 'DrawerNavigator',
    Screen: 'DrawerScreen',
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
