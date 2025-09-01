/**
 * BagsListScreen Delete/Edit Functionality Tests
 */

import {
  render, waitFor, fireEvent, act,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import BagsListScreen from '../../../src/screens/bags/BagsListScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import { BagRefreshProvider } from '../../../src/context/BagRefreshContext';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock AuthContext
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock token storage service
jest.mock('../../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

// Mock bag service
jest.mock('../../../src/services/bagService', () => ({
  getBags: jest.fn(),
  deleteBag: jest.fn(),
}));

const mockBags = [
  {
    id: '1',
    name: 'Tournament Bag',
    description: 'My favorite tournament discs',
    disc_count: 15,
    is_public: false,
    is_friends_visible: true,
  },
  {
    id: '2',
    name: 'Practice Bag',
    description: 'Discs for practice rounds',
    disc_count: 8,
    is_public: true,
    is_friends_visible: false,
  },
];

describe('BagsListScreen Delete/Edit Functionality', () => {
  let mockUseAuth;
  let mockGetBags;
  let mockDeleteBag;
  let mockNavigation;

  beforeEach(() => {
    mockUseAuth = require('../../../src/context/AuthContext').useAuth;
    const mockTokenStorage = require('../../../src/services/tokenStorage');
    const bagService = require('../../../src/services/bagService');
    mockGetBags = bagService.getBags;
    mockDeleteBag = bagService.deleteBag;

    // Mock navigation
    mockNavigation = {
      navigate: jest.fn(),
    };

    // Default auth state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1, username: 'testuser', email: 'test@example.com', isAdmin: false,
      },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
    });

    mockTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'token123',
      refreshToken: 'refresh123',
    });

    // Mock getBags to return sample bags
    mockGetBags.mockResolvedValue({ bags: mockBags });
    mockDeleteBag.mockResolvedValue({ success: true });

    // Clear Alert mock
    Alert.alert.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component) => render(
    <ThemeProvider>
      <BagRefreshProvider>
        {component}
      </BagRefreshProvider>
    </ThemeProvider>,
  );

  it('should show bag actions menu when menu button is pressed', async () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button on first bag
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    // Menu should be visible
    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });
  });

  it('should navigate to edit screen when edit option is pressed', async () => {
    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button on first bag
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    // Wait for menu to appear
    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    // Press edit option
    fireEvent.press(getByText('Edit Bag'));

    // Should navigate to EditBag screen with bag data
    expect(mockNavigation.navigate).toHaveBeenCalledWith('EditBag', {
      bag: mockBags[0],
    });
  });

  it('should show delete confirmation when delete option is pressed', async () => {
    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button on first bag
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    // Wait for menu to appear
    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    // Press delete option
    fireEvent.press(getByText('Delete Bag'));

    // Should show delete confirmation alert
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Bag',
      "Are you sure you want to delete 'Tournament Bag'? This action cannot be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: expect.any(Function),
        },
      ],
    );
  });

  it('should delete bag and update list when deletion is confirmed', async () => {
    // Mock Alert to simulate user pressing Delete and handle error alerts
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (buttons) {
        const deleteButton = buttons.find((btn) => btn.text === 'Delete');
        if (deleteButton) {
          deleteButton.onPress();
        }
      }
    });

    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button on first bag
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    // Wait for menu to appear
    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    // Press delete option
    await act(async () => {
      fireEvent.press(getByText('Delete Bag'));
    });

    // Should call deleteBag service
    expect(mockDeleteBag).toHaveBeenCalledWith('1');

    // Should reload bags after successful deletion
    expect(mockGetBags).toHaveBeenCalledTimes(2); // Initial load + reload after delete
  });

  it('should handle 409 conflict error with specific message', async () => {
    const conflictError = new Error('Cannot delete bag that contains discs');
    conflictError.status = 409;
    mockDeleteBag.mockRejectedValue(conflictError);

    // Mock Alert to simulate user pressing Delete and handle error alerts
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (buttons) {
        const deleteButton = buttons.find((btn) => btn.text === 'Delete');
        if (deleteButton) {
          deleteButton.onPress();
        }
      }
    });

    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button and delete
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Delete Bag'));
    });

    // Should show specific error message for bags with discs
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Cannot Delete Bag',
        "Cannot delete 'Tournament Bag' because it contains discs. Please move or remove all discs first.",
      );
    });
  });

  it('should handle network errors with appropriate message', async () => {
    const networkError = new Error('Unable to connect. Please check your internet.');
    mockDeleteBag.mockRejectedValue(networkError);

    // Mock Alert to simulate user pressing Delete and handle error alerts
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (buttons) {
        const deleteButton = buttons.find((btn) => btn.text === 'Delete');
        if (deleteButton) {
          deleteButton.onPress();
        }
      }
    });

    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button and delete
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Delete Bag'));
    });

    // Should show network error message
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Delete Failed',
        'Unable to delete bag. Please check your connection and try again.',
      );
    });
  });

  it('should handle 404 error silently by removing bag from list', async () => {
    const notFoundError = new Error('Bag not found');
    notFoundError.status = 404;
    mockDeleteBag.mockRejectedValue(notFoundError);

    // Mock Alert to simulate user pressing Delete and handle error alerts
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (buttons) {
        const deleteButton = buttons.find((btn) => btn.text === 'Delete');
        if (deleteButton) {
          deleteButton.onPress();
        }
      }
    });

    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button and delete
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Delete Bag'));
    });

    // Should reload bags without showing error for 404
    expect(mockGetBags).toHaveBeenCalledTimes(2); // Initial load + reload after delete

    // Should not show error alert for 404
    const errorAlerts = Alert.alert.mock.calls.filter(
      (call) => call[0].includes('Error') || call[0].includes('Failed'),
    );
    expect(errorAlerts).toHaveLength(0);
  });

  it('should handle generic errors with default message', async () => {
    const genericError = new Error('Something went wrong');
    mockDeleteBag.mockRejectedValue(genericError);

    // Mock Alert to simulate user pressing Delete and handle error alerts
    Alert.alert.mockImplementation((title, message, buttons) => {
      if (buttons) {
        const deleteButton = buttons.find((btn) => btn.text === 'Delete');
        if (deleteButton) {
          deleteButton.onPress();
        }
      }
    });

    const { getByTestId, getByText, getAllByTestId } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button and delete
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Delete Bag'));
    });

    // Should show generic error message
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Delete Failed',
        'Something went wrong',
      );
    });
  });

  it('should close menu when cancel is pressed in delete confirmation', async () => {
    // Mock Alert to simulate user pressing Cancel
    Alert.alert.mockImplementation((title, message, buttons) => {
      const cancelButton = buttons.find((btn) => btn.text === 'Cancel');
      if (cancelButton?.onPress) {
        cancelButton.onPress();
      }
    });

    const {
      getByTestId, getByText, queryByTestId, getAllByTestId,
    } = renderWithProviders(
      <BagsListScreen navigation={mockNavigation} />,
    );

    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bags-list-screen')).toBeTruthy();
    });

    // Press menu button and delete
    const menuButtons = getAllByTestId('bag-menu-button');
    fireEvent.press(menuButtons[0]);

    await waitFor(() => {
      expect(getByTestId('bag-actions-modal')).toBeTruthy();
    });

    fireEvent.press(getByText('Delete Bag'));

    // Menu should be closed after cancel
    await waitFor(() => {
      expect(queryByTestId('bag-actions-modal')).toBeNull();
    });

    // Should not call deleteBag
    expect(mockDeleteBag).not.toHaveBeenCalled();
  });
});
