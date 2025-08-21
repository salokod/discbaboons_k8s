/**
 * AccountSettingsScreen Back Button Integration Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccountSettingsScreen from '../../src/screens/settings/AccountSettingsScreen';

// Mock the navigation object
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
};

// Mock profile service
jest.mock('../../src/services/profile', () => ({
  getProfile: jest.fn(() => Promise.resolve({
    success: true,
    profile: {
      name: 'Test User',
      bio: 'Test bio',
      country: 'USA',
      state_province: 'CA',
      city: 'Test City',
      isnamepublic: true,
      isbiopublic: false,
      islocationpublic: true,
    },
  })),
  updateProfile: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock ThemeContext
jest.mock('../../src/context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    text: '#212121',
    textLight: '#757575',
    surface: '#FFFFFF',
    background: '#FAFBFC',
    border: '#E0E0E0',
    primary: '#ec7032',
  })),
}));

describe('AccountSettingsScreen Back Button Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with navigation header containing back button', async () => {
    const { getByTestId } = render(
      <AccountSettingsScreen navigation={mockNavigation} />,
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(getByTestId('navigation-header')).toBeTruthy();
    });
  });

  it('should show back button in navigation header', async () => {
    const { getByTestId } = render(
      <AccountSettingsScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
  });

  it('should call navigation.goBack when back button is pressed', async () => {
    const { getByTestId } = render(
      <AccountSettingsScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);
    });

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('should display "Account Settings" as the header title', async () => {
    const { getByText } = render(
      <AccountSettingsScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Account Settings')).toBeTruthy();
    });
  });

  it('should maintain existing account settings functionality with back button', async () => {
    const { getByDisplayValue, getByTestId } = render(
      <AccountSettingsScreen navigation={mockNavigation} />,
    );

    // Wait for profile to load and verify existing functionality
    await waitFor(() => {
      expect(getByDisplayValue('Test User')).toBeTruthy();
      expect(getByTestId('navigation-header')).toBeTruthy();
    });
  });
});
