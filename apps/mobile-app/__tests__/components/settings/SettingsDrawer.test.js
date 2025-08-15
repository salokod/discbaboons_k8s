/**
 * SettingsDrawer Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import SettingsDrawer from '../../../src/components/settings/SettingsDrawer';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { AuthContext } from '../../../src/context/AuthContext';

// Mock Alert

// Mock the react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigation = {
  closeDrawer: jest.fn(),
  navigate: jest.fn(),
};

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  isAdmin: false,
};

// Mock auth context value
const mockAuthContextValue = {
  isAuthenticated: true,
  user: mockUser,
  tokens: null,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshTokens: jest.fn(),
};

// Wrapper component with all necessary providers
function TestWrapper({ children }) {
  return (
    <NavigationContainer>
      <ThemeProvider>
        <AuthContext.Provider value={mockAuthContextValue}>
          {children}
        </AuthContext.Provider>
      </ThemeProvider>
    </NavigationContainer>
  );
}

describe('SettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
  });

  it('should export a component', () => {
    expect(SettingsDrawer).toBeDefined();
    expect(typeof SettingsDrawer).toBe('object'); // memo returns an object
  });

  it('should render the settings drawer component', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('settings-drawer')).toBeTruthy();
  });

  it('should display user info section', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('user-info-section')).toBeTruthy();
  });

  it('should display username in user info', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByText('testuser')).toBeTruthy();
  });

  it('should display email in user info', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('should display Settings navigation option', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('should display About navigation option', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByText('About')).toBeTruthy();
  });

  it('should have a close button', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('close-drawer-button')).toBeTruthy();
  });

  it('should call navigation.closeDrawer when close button is pressed', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    const closeButton = screen.getByTestId('close-drawer-button');
    fireEvent.press(closeButton);

    expect(mockNavigation.closeDrawer).toHaveBeenCalledTimes(1);
  });

  it('should navigate to Settings screen when Settings option is pressed', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    const settingsOption = screen.getByTestId('settings-nav-item');
    fireEvent.press(settingsOption);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('App', { screen: 'Settings' });
    expect(mockNavigation.closeDrawer).toHaveBeenCalled();
  });

  it('should display LogoutButton at bottom of drawer', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('logout-button')).toBeTruthy();
  });

  it('should close drawer when logout is initiated', async () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.press(logoutButton);

    // Verify that Alert was called (confirmation dialog shown)
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    // Get the alert buttons and simulate pressing "Logout" to confirm
    const alertCall = Alert.alert.mock.calls[0];
    const buttons = alertCall[2];
    const confirmLogoutButton = buttons.find((button) => button.text === 'Logout');

    // Trigger the logout confirmation and wait for it
    await confirmLogoutButton.onPress();

    // Now the drawer should close
    expect(mockNavigation.closeDrawer).toHaveBeenCalled();
  });

  it('should call AuthContext logout when logout button is pressed in drawer', async () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.press(logoutButton);

    // Verify that Alert was called (confirmation dialog shown)
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    // Get the alert buttons and simulate pressing "Logout" to confirm
    const alertCall = Alert.alert.mock.calls[0];
    const buttons = alertCall[2];
    const confirmLogoutButton = buttons.find((button) => button.text === 'Logout');

    // Trigger the logout confirmation
    await confirmLogoutButton.onPress();

    // Verify that AuthContext logout was called
    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
    // Verify that drawer still closes after logout
    expect(mockNavigation.closeDrawer).toHaveBeenCalled();
  });

  it('should still close drawer even if logout fails', async () => {
    // Mock logout to reject
    mockAuthContextValue.logout.mockRejectedValueOnce(new Error('Logout failed'));

    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>,
    );

    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.press(logoutButton);

    // Get the alert buttons and simulate pressing "Logout" to confirm
    const alertCall = Alert.alert.mock.calls[0];
    const buttons = alertCall[2];
    const confirmLogoutButton = buttons.find((button) => button.text === 'Logout');

    // Trigger the logout confirmation
    await confirmLogoutButton.onPress();

    // Verify that logout was attempted
    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
    // Verify that drawer still closes even when logout fails
    expect(mockNavigation.closeDrawer).toHaveBeenCalled();
    // Clean up mocks
    consoleSpy.mockRestore();
  });
});
