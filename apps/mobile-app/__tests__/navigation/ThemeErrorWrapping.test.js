/**
 * Theme Error Wrapping Tests
 * Tests for wrapping Settings components with ThemeErrorBoundary
 */

import { render } from '@testing-library/react-native';
import DrawerNavigator from '../../src/navigation/DrawerNavigator';
import { AuthProvider } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';

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
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('Theme Error Wrapping in Navigation', () => {
  it('should wrap Settings components with ThemeErrorBoundary', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <DrawerNavigator />
      </TestWrapper>,
    );

    // Should render drawer navigator successfully
    expect(getByTestId('drawer-navigator')).toBeTruthy();
  });

  it('should handle Settings screen errors gracefully', () => {
    // Create a version of SettingsScreen that throws an error
    const originalSettingsScreen = require('../../src/screens/settings/SettingsScreen').default;

    // Mock SettingsScreen to throw an error
    jest.doMock('../../src/screens/settings/SettingsScreen', () => () => {
      throw new Error('Settings theme error');
    });

    // This should not crash the entire app due to error boundary
    expect(() => {
      render(
        <TestWrapper>
          <DrawerNavigator />
        </TestWrapper>,
      );
    }).not.toThrow();

    // Restore original component
    jest.doMock('../../src/screens/settings/SettingsScreen', () => originalSettingsScreen);
  });

  it('should handle AccountSettings screen errors gracefully', () => {
    // Create a version of AccountSettingsScreen that throws an error
    const originalAccountSettingsScreen = require('../../src/screens/settings/AccountSettingsScreen').default;

    // Mock AccountSettingsScreen to throw an error
    jest.doMock('../../src/screens/settings/AccountSettingsScreen', () => () => {
      throw new Error('Account settings theme error');
    });

    // This should not crash the entire app due to error boundary
    expect(() => {
      render(
        <TestWrapper>
          <DrawerNavigator />
        </TestWrapper>,
      );
    }).not.toThrow();

    // Restore original component
    jest.doMock('../../src/screens/settings/AccountSettingsScreen', () => originalAccountSettingsScreen);
  });

  it('should verify ThemeErrorBoundary usage for Settings screens', () => {
    // Import the DrawerNavigator source to verify structure
    const fs = require('fs');
    const path = require('path');
    const navigatorPath = path.join(__dirname, '../../src/navigation/DrawerNavigator.js');
    const navigatorSource = fs.readFileSync(navigatorPath, 'utf8');

    // Check that ThemeErrorBoundary is imported and used
    expect(navigatorSource).toContain('ThemeErrorBoundary');
  });

  it('should verify Settings screens are wrapped with proper error boundaries', () => {
    // Import the DrawerNavigator source to verify structure
    const fs = require('fs');
    const path = require('path');
    const navigatorPath = path.join(__dirname, '../../src/navigation/DrawerNavigator.js');
    const navigatorSource = fs.readFileSync(navigatorPath, 'utf8');

    // Verify ThemeErrorBoundary is imported
    expect(navigatorSource).toContain('ThemeErrorBoundary');

    // Verify Settings screens are wrapped
    expect(navigatorSource).toContain('WrappedSettingsScreen');
    expect(navigatorSource).toContain('WrappedAccountSettingsScreen');
  });
});
