/**
 * SettingsDrawer Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import SettingsDrawer from '../../../src/components/settings/SettingsDrawer';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { AuthContext } from '../../../src/context/AuthContext';

// Mock the react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

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
});
