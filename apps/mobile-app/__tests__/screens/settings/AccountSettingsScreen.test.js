/**
 * AccountSettingsScreen Component Tests
 */

import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import AccountSettingsScreen from '../../../src/screens/settings/AccountSettingsScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import * as profileService from '../../../src/services/profile';

// Mock the profile service
jest.mock('../../../src/services/profile');

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simulate user pressing "Continue" button for password change
  if (title === 'Change Password' && buttons && buttons[1]) {
    buttons[1].onPress();
  }
});

// Wrapper component with all necessary providers
function TestWrapper({ children }) {
  return (
    <NavigationContainer>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </NavigationContainer>
  );
}

// Mock navigation object
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('AccountSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
    // Mock successful profile load
    profileService.getProfile.mockResolvedValue({
      success: true,
      profile: {
        user_id: 123,
        name: 'John Doe',
        bio: 'Test bio',
        country: 'United States',
        state_province: 'Texas',
        city: 'Austin',
        isnamepublic: true,
        isbiopublic: false,
        islocationpublic: true,
      },
    });
  });

  it('should export a component', () => {
    expect(AccountSettingsScreen).toBeDefined();
    expect(typeof AccountSettingsScreen).toBe('object'); // memo returns an object
  });

  it('should render loading state initially', async () => {
    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    expect(screen.getByText('Loading profile...')).toBeTruthy();
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('should load and display profile data', async () => {
    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });

    expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
    expect(screen.getByDisplayValue('Test bio')).toBeTruthy();
    expect(screen.getByDisplayValue('Austin')).toBeTruthy();
    expect(screen.getByDisplayValue('Texas')).toBeTruthy();
    expect(screen.getByDisplayValue('United States')).toBeTruthy();
  });

  it('should handle profile update successfully', async () => {
    profileService.updateProfile.mockResolvedValue({
      success: true,
      profile: { name: 'Updated Name' },
    });

    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });

    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.changeText(nameInput, 'Updated Name');

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
        }),
      );
    });
  });

  it('should toggle privacy settings', async () => {
    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });

    // Find and press the first privacy toggle (name visibility)
    const publicToggles = screen.getAllByText('Public');
    fireEvent.press(publicToggles[0]); // Press the first "Public" toggle (name visibility)

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          isnamepublic: false, // Should be toggled
        }),
      );
    });
  });

  it('should handle change password button press', async () => {
    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });

    const changePasswordButton = screen.getByText('Change Password');
    fireEvent.press(changePasswordButton);

    // Should show alert and navigate to forgot password
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('should handle profile load error', async () => {
    profileService.getProfile.mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });

    // Should show default empty profile form when load fails
    expect(screen.getByText('Account Settings')).toBeTruthy();
  });

  it('should handle profile update error', async () => {
    profileService.updateProfile.mockRejectedValue(new Error('Update failed'));

    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalled();
    });

    // Should still show the button (not in loading state)
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('should show saving state when updating profile', async () => {
    let resolveUpdate;
    profileService.updateProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    render(
      <TestWrapper>
        <AccountSettingsScreen navigation={mockNavigation} />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    // Should show saving state
    expect(screen.getByText('Saving...')).toBeTruthy();

    // Resolve the update
    resolveUpdate({ success: true });

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeTruthy();
    });
  });
});
