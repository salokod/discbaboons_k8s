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
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

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

    // Should show skeleton loading screen instead of spinner
    expect(screen.getByTestId('skeleton-header')).toBeTruthy();
    expect(screen.getByTestId('skeleton-profile-section')).toBeTruthy();
    expect(screen.getByTestId('skeleton-privacy-section')).toBeTruthy();
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

  describe('Skeleton Loading Screen', () => {
    it('should show skeleton placeholders instead of spinner when loading', async () => {
      // Set up delayed profile load to keep loading state active
      profileService.getProfile.mockReturnValue(
        new Promise(() => {
          // Keep loading state active
        }),
      );

      render(
        <TestWrapper>
          <AccountSettingsScreen navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Should show skeleton placeholders instead of basic loading
      expect(screen.getByTestId('skeleton-header')).toBeTruthy();
      expect(screen.getByTestId('skeleton-profile-section')).toBeTruthy();
      expect(screen.getByTestId('skeleton-privacy-section')).toBeTruthy();
      expect(screen.getByTestId('skeleton-save-button')).toBeTruthy();

      // Should not show the old loading spinner
      expect(screen.queryByTestId('activity-indicator')).toBeNull();
      expect(screen.queryByText('Loading profile...')).toBeNull();
    });

    it('should show correct number of skeleton input fields', async () => {
      // Set up delayed profile load to keep loading state active
      profileService.getProfile.mockReturnValue(
        new Promise(() => {
          // Keep loading state active
        }),
      );

      render(
        <TestWrapper>
          <AccountSettingsScreen navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Should show skeleton for each input field (name, bio, city, state, country)
      const skeletonInputs = screen.getAllByTestId('skeleton-input');
      expect(skeletonInputs).toHaveLength(5);
    });

    it('should show correct number of skeleton privacy toggles', async () => {
      // Set up delayed profile load to keep loading state active
      profileService.getProfile.mockReturnValue(
        new Promise(() => {
          // Keep loading state active
        }),
      );

      render(
        <TestWrapper>
          <AccountSettingsScreen navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Should show skeleton for each privacy toggle (name, bio, location)
      const skeletonToggles = screen.getAllByTestId('skeleton-toggle');
      expect(skeletonToggles).toHaveLength(3);
    });

    it('should transition from skeleton to actual content when data loads', async () => {
      // Set up delayed profile load to keep loading state active
      let resolveProfile;
      profileService.getProfile.mockReturnValue(
        new Promise((resolve) => {
          resolveProfile = resolve;
        }),
      );

      render(
        <TestWrapper>
          <AccountSettingsScreen navigation={mockNavigation} />
        </TestWrapper>,
      );

      // Initially should show skeleton
      expect(screen.getByTestId('skeleton-header')).toBeTruthy();

      // Resolve the profile load
      resolveProfile({
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

      // Should transition to actual content
      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeTruthy();
      });

      // Skeleton should be gone
      expect(screen.queryByTestId('skeleton-header')).toBeNull();
      expect(screen.queryByTestId('skeleton-profile-section')).toBeNull();

      // Real content should be present
      expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
    });
  });
});
