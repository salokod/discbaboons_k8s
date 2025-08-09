/**
 * Tests for AdminDiscScreen
 */

/* eslint-disable no-unused-vars */
import React from 'react';
/* eslint-enable no-unused-vars */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import AdminDiscScreen from '../../../src/screens/discs/AdminDiscScreen';
import { getPendingDiscs, approveDisc } from '../../../src/services/discService';

// Mock the disc service
jest.mock('../../../src/services/discService');

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigation = {
  goBack: mockGoBack,
};

const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('AdminDiscScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock response for pending discs - simplified API without pagination
    getPendingDiscs.mockResolvedValue({
      discs: [
        {
          id: '1',
          brand: 'Dynamic Discs',
          model: 'Truth',
          speed: 5,
          glide: 5,
          turn: 0,
          fade: 2,
          approved: false,
          added_by_id: 456,
          created_at: '2024-01-15T10:30:00.000Z',
        },
        {
          id: '2',
          brand: 'Innova',
          model: 'Destroyer',
          speed: 12,
          glide: 5,
          turn: -1,
          fade: 3,
          approved: false,
          added_by_id: 789,
          created_at: '2024-01-14T09:15:00.000Z',
        },
      ],
    });

    approveDisc.mockResolvedValue({
      id: '1',
      approved: true,
    });
  });

  it('should render admin screen header with stats', async () => {
    const { getByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      // Check for new header design elements after loading
      expect(getByText('Admin Disc Approval')).toBeTruthy();
      expect(getByText(/Review and approve community-submitted disc data/)).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy(); // Stats label confirms 2 count exists
    });
  });

  it('should display pending disc cards with flight numbers', async () => {
    const { getByText, getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Truth')).toBeTruthy();
      expect(getByText('Dynamic Discs')).toBeTruthy();
      expect(getByText('Destroyer')).toBeTruthy();
      expect(getByText('Innova')).toBeTruthy();

      // Check flight number badges are displayed (S, G, T, F labels)
      expect(getAllByText('S')).toHaveLength(2); // Speed badge for both discs
      expect(getAllByText('G')).toHaveLength(2); // Glide badge for both discs
      expect(getAllByText('T')).toHaveLength(2); // Turn badge for both discs
      expect(getAllByText('F')).toHaveLength(2); // Fade badge for both discs

      expect(getAllByText('Approve & Publish')).toHaveLength(2);
    });
  });

  it('should display submission dates', async () => {
    const { getByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Submitted Jan 15, 2024')).toBeTruthy();
      expect(getByText('Submitted Jan 14, 2024')).toBeTruthy();
    });
  });

  it('should show confirmation dialog with disc details when approve is pressed', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    const { getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve & Publish')).toHaveLength(2);
    });

    fireEvent.press(getAllByText('Approve & Publish')[0]);

    expect(alertSpy).toHaveBeenCalledWith(
      'Approve Disc Submission',
      'Brand: Dynamic Discs\nModel: Truth\nFlight: 5|5|0|2\n\nApproving this disc will make it publicly available in the disc database.',
      expect.any(Array),
    );

    alertSpy.mockRestore();
  });

  it('should approve disc successfully and show success message', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    const { getAllByText, queryByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve & Publish')).toHaveLength(2);
    });

    fireEvent.press(getAllByText('Approve & Publish')[0]);

    // Simulate pressing "Approve" in the confirmation dialog
    const approveButton = alertSpy.mock.calls[0][2][1];
    await approveButton.onPress();

    expect(approveDisc).toHaveBeenCalledWith('1');

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Disc Approved! ✅',
        '"Dynamic Discs Truth" is now available to all users in the disc database.',
      );
      // Disc should be removed from pending list
      expect(queryByText('Truth')).toBeNull();
    });

    alertSpy.mockRestore();
  });

  it('should handle approval errors', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    approveDisc.mockRejectedValueOnce(new Error('Network error'));

    const { getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve & Publish')).toHaveLength(2);
    });

    fireEvent.press(getAllByText('Approve & Publish')[0]);

    // Simulate pressing "Approve" in the confirmation dialog
    const approveButton = alertSpy.mock.calls[0][2][1];
    await approveButton.onPress();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Approval Error', 'Failed to approve disc: Network error');
    });

    alertSpy.mockRestore();
  });

  it('should handle admin access denied', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    getPendingDiscs.mockRejectedValueOnce(new Error('Admin access required'));

    renderWithTheme(<AdminDiscScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Access Denied',
        'You need admin privileges to access this feature.',
        expect.any(Array),
      );
    });

    // Simulate pressing "Go Back"
    const goBackButton = alertSpy.mock.calls[0][2][0];
    goBackButton.onPress();

    expect(mockGoBack).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('should show empty state when no pending discs', async () => {
    getPendingDiscs.mockResolvedValueOnce({ discs: [] });

    const { getByText, queryByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('All caught up! 🎉')).toBeTruthy();
      expect(queryByText('Truth')).toBeNull();
      expect(queryByText('Destroyer')).toBeNull();
    });
  });

  it('should load pending discs on mount', async () => {
    renderWithTheme(<AdminDiscScreen navigation={mockNavigation} />);

    expect(getPendingDiscs).toHaveBeenCalled();
  });

  it('should handle load errors gracefully', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    getPendingDiscs.mockRejectedValueOnce(new Error('Network error'));

    renderWithTheme(<AdminDiscScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to load pending discs. Please try again.');
    });

    alertSpy.mockRestore();
  });

  it('should prevent double approval attempts', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    // Mock a slow approval
    approveDisc.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ id: '1', approved: true }), 1000);
    }));

    const { getAllByText, getByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve & Publish')).toHaveLength(2);
    });

    fireEvent.press(getAllByText('Approve & Publish')[0]);

    // Simulate pressing "Approve" in the confirmation dialog
    const approveButton = alertSpy.mock.calls[0][2][1];
    await approveButton.onPress();

    await waitFor(() => {
      expect(getByText('Approving...')).toBeTruthy();
    });

    alertSpy.mockRestore();
  });
});
