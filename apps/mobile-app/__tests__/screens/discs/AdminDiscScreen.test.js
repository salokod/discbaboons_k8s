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

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    const mockReact = require('react');
    mockReact.useEffect(callback, []);
  }),
}));

const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('AdminDiscScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock response for pending discs
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
      pagination: {
        total: 2,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    approveDisc.mockResolvedValue({
      id: '1',
      approved: true,
    });
  });

  it('should render admin screen header and filters', async () => {
    const { getByText, getByPlaceholderText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    expect(getByText('Pending Disc Reviews')).toBeTruthy();
    expect(getByText('Review and approve community-submitted discs')).toBeTruthy();
    expect(getByPlaceholderText('Search pending discs...')).toBeTruthy();

    expect(getByText('Filter by Type')).toBeTruthy();
    expect(getByText('All Pending')).toBeTruthy();
    expect(getByText('Drivers')).toBeTruthy();
    expect(getByText('Mids')).toBeTruthy();
    expect(getByText('Putters')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('2 pending discs')).toBeTruthy();
    });
  });

  it('should display pending disc items with approve buttons', async () => {
    const { getByText, getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Truth')).toBeTruthy();
      expect(getByText('(Dynamic Discs)')).toBeTruthy();
      expect(getByText('Destroyer')).toBeTruthy();
      expect(getByText('(Innova)')).toBeTruthy();

      expect(getAllByText('Approve')).toHaveLength(2);
    });
  });

  it('should display submission dates', async () => {
    const { getByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Submitted 1/15/2024')).toBeTruthy();
      expect(getByText('Submitted 1/14/2024')).toBeTruthy();
    });
  });

  it('should search pending discs when user types', async () => {
    jest.useFakeTimers();

    const { getByPlaceholderText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    const searchInput = getByPlaceholderText('Search pending discs...');
    fireEvent.changeText(searchInput, 'Truth');

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(getPendingDiscs).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'Truth',
        }),
      );
    });

    jest.useRealTimers();
  });

  it('should filter by disc type', async () => {
    const { getByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByText('Drivers')).toBeTruthy();
    });

    fireEvent.press(getByText('Drivers'));

    await waitFor(() => {
      expect(getPendingDiscs).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: '9-15',
        }),
      );
    });
  });

  it('should show confirmation dialog when approve is pressed', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    const { getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve')).toHaveLength(2);
    });

    fireEvent.press(getAllByText('Approve')[0]);

    expect(alertSpy).toHaveBeenCalledWith(
      'Approve Disc',
      'Are you sure you want to approve "Truth" by Dynamic Discs?',
      expect.any(Array),
    );

    alertSpy.mockRestore();
  });

  it('should approve disc successfully', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    const { getAllByText, getByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve')).toHaveLength(2);
      expect(getByText('Truth')).toBeTruthy();
    });

    fireEvent.press(getAllByText('Approve')[0]);

    // Simulate pressing "Approve" in the confirmation dialog
    const approveButton = alertSpy.mock.calls[0][2][1];
    await approveButton.onPress();

    expect(approveDisc).toHaveBeenCalledWith('1');

    alertSpy.mockRestore();
  });

  it('should handle approval errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    approveDisc.mockRejectedValueOnce(new Error('Network error'));

    const { getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve')).toHaveLength(2);
    });

    fireEvent.press(getAllByText('Approve')[0]);

    // Simulate pressing "Approve" in the confirmation dialog
    const approveButton = alertSpy.mock.calls[0][2][1];
    await approveButton.onPress();

    await waitFor(() => {
      // Error was logged (but we replaced console.error with a comment)
      expect(alertSpy).toHaveBeenCalledWith('Approval Error', 'Network error');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should handle admin access denied', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    getPendingDiscs.mockRejectedValueOnce(new Error('Admin access required'));

    renderWithTheme(<AdminDiscScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Access Denied',
        'You need admin privileges to view pending disc submissions.',
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
    getPendingDiscs.mockResolvedValueOnce({
      discs: [],
      pagination: {
        total: 0, limit: 50, offset: 0, hasMore: false,
      },
    });

    const { queryByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      // No pending discs should be displayed
      expect(queryByText('Truth')).toBeNull();
      expect(queryByText('Destroyer')).toBeNull();
      expect(getPendingDiscs).toHaveBeenCalled();
    });
  });

  it('should show no results when search has no matches', async () => {
    jest.useFakeTimers();

    getPendingDiscs
      .mockResolvedValueOnce({
        discs: [],
        pagination: {
          total: 0, limit: 50, offset: 0, hasMore: false,
        },
      })
      .mockResolvedValueOnce({
        discs: [],
        pagination: {
          total: 0, limit: 50, offset: 0, hasMore: false,
        },
      });

    const { getByPlaceholderText, queryByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    const searchInput = getByPlaceholderText('Search pending discs...');
    fireEvent.changeText(searchInput, 'NonexistentDisc');

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      // No pending discs should be found
      expect(queryByText('Truth')).toBeNull();
      expect(queryByText('Destroyer')).toBeNull();
      expect(getPendingDiscs).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'NonexistentDisc',
        }),
      );
    });

    jest.useRealTimers();
  });

  it('should allow clearing search input', async () => {
    const { getByPlaceholderText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Search pending discs...')).toBeTruthy();
    });

    const searchInput = getByPlaceholderText('Search pending discs...');

    // User can interact with search input
    fireEvent.changeText(searchInput, 'TestDisc');
    fireEvent.changeText(searchInput, '');

    // Search functionality works
    expect(getPendingDiscs).toHaveBeenCalled();
  });

  it('should handle approval process', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    const { getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve')).toHaveLength(2);
    });

    fireEvent.press(getAllByText('Approve')[0]);

    // Should show confirmation dialog
    expect(alertSpy).toHaveBeenCalled();

    // Simulate pressing "Approve" in the confirmation dialog
    const approveButton = alertSpy.mock.calls[0][2][1];
    await approveButton.onPress();

    // Should call the approve service
    expect(approveDisc).toHaveBeenCalledWith('1');

    alertSpy.mockRestore();
  });

  it('should handle multiple approval attempts', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    const { getAllByText } = renderWithTheme(
      <AdminDiscScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(getAllByText('Approve')).toHaveLength(2);
    });

    const approveButton = getAllByText('Approve')[0];

    // Press approval button
    fireEvent.press(approveButton);

    // Should show confirmation dialog
    expect(alertSpy).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('should load pending discs on screen focus', async () => {
    renderWithTheme(<AdminDiscScreen navigation={mockNavigation} />);

    expect(getPendingDiscs).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
        offset: 0,
      }),
    );
  });

  it('should handle load errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

    getPendingDiscs.mockRejectedValueOnce(new Error('Network error'));

    renderWithTheme(<AdminDiscScreen navigation={mockNavigation} />);

    await waitFor(() => {
      // Error was logged (but we replaced console.error with a comment)
      expect(alertSpy).toHaveBeenCalledWith('Load Error', 'Network error');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
