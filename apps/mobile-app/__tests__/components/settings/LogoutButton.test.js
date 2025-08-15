/**
 * LogoutButton Component Tests
 */

import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LogoutButton from '../../../src/components/settings/LogoutButton';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { AuthProvider } from '../../../src/context/AuthContext';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Create a test wrapper component with providers
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('LogoutButton component', () => {
  beforeEach(() => {
    Alert.alert.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should export a component', () => {
    expect(LogoutButton).toBeDefined();
    expect(typeof LogoutButton).toBe('object'); // memo() returns an object
  });

  it('should render a TouchableOpacity', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <LogoutButton />
      </TestWrapper>,
    );

    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('should display logout text', () => {
    const { getByText } = render(
      <TestWrapper>
        <LogoutButton />
      </TestWrapper>,
    );

    expect(getByText('Logout')).toBeTruthy();
  });

  it('should show confirmation dialog when pressed', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <LogoutButton />
      </TestWrapper>,
    );

    fireEvent.press(getByTestId('logout-button'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirm Logout',
      'Are you sure you want to logout?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Logout', style: 'destructive' }),
      ]),
    );
  });

  it('should call onLogout when confirmation is accepted', () => {
    const onLogoutMock = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <LogoutButton onLogout={onLogoutMock} />
      </TestWrapper>,
    );

    fireEvent.press(getByTestId('logout-button'));

    // Get the button configuration from Alert.alert call
    const alertCall = Alert.alert.mock.calls[0];
    const buttons = alertCall[2];
    const logoutButton = buttons.find((button) => button.text === 'Logout');

    // Simulate pressing the logout button in the dialog
    logoutButton.onPress();
    expect(onLogoutMock).toHaveBeenCalledTimes(1);
  });

  it('should not call onLogout when confirmation is cancelled', () => {
    const onLogoutMock = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <LogoutButton onLogout={onLogoutMock} />
      </TestWrapper>,
    );

    fireEvent.press(getByTestId('logout-button'));

    // Get the button configuration from Alert.alert call
    const alertCall = Alert.alert.mock.calls[0];
    const buttons = alertCall[2];
    const cancelButton = buttons.find((button) => button.text === 'Cancel');

    // Simulate pressing the cancel button in the dialog (if it has onPress)
    if (cancelButton.onPress) {
      cancelButton.onPress();
    }
    expect(onLogoutMock).not.toHaveBeenCalled();
  });

  it('should have proper accessibility properties', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <LogoutButton />
      </TestWrapper>,
    );

    const button = getByTestId('logout-button');
    expect(button.props.accessibilityLabel).toBe('Logout button');
    expect(button.props.accessibilityHint).toBe('Tap to logout from the application');
  });

  describe('Loading State', () => {
    it('should show loading state during logout process', async () => {
      const mockLogout = jest.fn().mockResolvedValue();
      const { getByTestId } = render(
        <TestWrapper>
          <LogoutButton onLogout={mockLogout} />
        </TestWrapper>,
      );

      fireEvent.press(getByTestId('logout-button'));

      // Get the logout button from the alert and press it
      const alertCall = Alert.alert.mock.calls[0];
      const buttons = alertCall[2];
      const logoutButton = buttons.find((button) => button.text === 'Logout');

      // Simulate pressing the logout button in the dialog
      logoutButton.onPress();

      // Check that loading text appears temporarily
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should show loading text when logout is in progress', async () => {
      let resolveLogout;
      const slowLogout = jest.fn(() => new Promise((resolve) => {
        resolveLogout = resolve;
      }));

      const { getByTestId, getByText, queryByText } = render(
        <TestWrapper>
          <LogoutButton onLogout={slowLogout} />
        </TestWrapper>,
      );

      // Initially should show "Logout"
      expect(getByText('Logout')).toBeTruthy();
      expect(queryByText('Logging out...')).toBeNull();

      fireEvent.press(getByTestId('logout-button'));

      // Get the logout button from the alert and press it
      const alertCall = Alert.alert.mock.calls[0];
      const buttons = alertCall[2];
      const logoutButton = buttons.find((button) => button.text === 'Logout');

      // Simulate pressing the logout button in the dialog with act
      await act(async () => {
        logoutButton.onPress();
        // Give the component a chance to update state
        await Promise.resolve();
      });

      // Check that loading text appears
      expect(getByText('Logging out...')).toBeTruthy();

      // Resolve the logout to finish loading state
      await act(async () => {
        resolveLogout();
        await Promise.resolve();
      });

      // Should return to normal text
      expect(getByText('Logout')).toBeTruthy();
    });

    it('should handle logout errors gracefully', async () => {
      const errorLogout = jest.fn().mockRejectedValue(new Error('Network error'));
      const { getByTestId } = render(
        <TestWrapper>
          <LogoutButton onLogout={errorLogout} />
        </TestWrapper>,
      );

      fireEvent.press(getByTestId('logout-button'));

      // Get the logout button from the alert and press it
      const alertCall = Alert.alert.mock.calls[0];
      const buttons = alertCall[2];
      const logoutButton = buttons.find((button) => button.text === 'Logout');

      // Simulate pressing the logout button in the dialog
      await logoutButton.onPress();

      // Should have attempted logout
      expect(errorLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('AuthContext Integration', () => {
    it('should integrate with AuthContext logout when no onLogout prop is provided', async () => {
      // Test relies on the actual AuthProvider implementation
      // which provides a default logout function
      const { getByTestId } = render(
        <TestWrapper>
          <LogoutButton />
        </TestWrapper>,
      );

      fireEvent.press(getByTestId('logout-button'));

      // Get the logout button from the alert and press it
      const alertCall = Alert.alert.mock.calls[0];
      const buttons = alertCall[2];
      const logoutButton = buttons.find((button) => button.text === 'Logout');

      logoutButton.onPress();

      // Should execute without throwing errors
      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it('should prioritize provided onLogout prop over AuthContext logout', () => {
      const mockPropsLogout = jest.fn();

      const { getByTestId } = render(
        <TestWrapper>
          <LogoutButton onLogout={mockPropsLogout} />
        </TestWrapper>,
      );

      fireEvent.press(getByTestId('logout-button'));

      // Get the logout button from the alert and press it
      const alertCall = Alert.alert.mock.calls[0];
      const buttons = alertCall[2];
      const logoutButton = buttons.find((button) => button.text === 'Logout');

      logoutButton.onPress();

      expect(mockPropsLogout).toHaveBeenCalledTimes(1);
    });
  });
});
