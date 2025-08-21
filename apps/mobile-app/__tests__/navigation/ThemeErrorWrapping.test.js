/**
 * Theme Error Wrapping Tests
 * Tests for wrapping Settings components with ThemeErrorBoundary in BottomTabNavigator
 */

import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from '../../src/navigation/BottomTabNavigator';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../src/context/BagRefreshContext';

// Mock console.error to avoid noise in tests
// eslint-disable-next-line no-console
const originalConsoleError = console.error;
beforeEach(() => {
  // eslint-disable-next-line no-console
  console.error = jest.fn();
});

afterEach(() => {
  // eslint-disable-next-line no-console
  console.error = originalConsoleError;
});

// Mock react-navigation to control navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(),
  removeItem: jest.fn().mockResolvedValue(),
}));

// Test wrapper with providers
function TestWrapper({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BagRefreshProvider>
          <NavigationContainer>
            {children}
          </NavigationContainer>
        </BagRefreshProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('Theme Error Wrapping in Navigation', () => {
  it('should render BottomTabNavigator without error boundaries (settings moved to Profile tab)', () => {
    const { queryByTestId } = render(
      <TestWrapper>
        <BottomTabNavigator />
      </TestWrapper>,
    );

    // BottomTabNavigator should render successfully
    // Note: Settings are now handled in Profile tab stack navigators
    expect(queryByTestId('bottom-tab-navigator')).toBeTruthy();
  });

  it('should handle navigation errors gracefully with bottom tabs', () => {
    // BottomTabNavigator should not crash the app
    expect(() => {
      render(
        <TestWrapper>
          <BottomTabNavigator />
        </TestWrapper>,
      );
    }).not.toThrow();
  });

  it('should verify BottomTabNavigator structure', () => {
    const { queryByTestId } = render(
      <TestWrapper>
        <BottomTabNavigator />
      </TestWrapper>,
    );

    // Should render bottom tab navigation successfully
    // Error boundaries for settings are now handled in ProfileStackNavigator
    expect(queryByTestId('bottom-tab-navigator')).toBeTruthy();
  });
});
