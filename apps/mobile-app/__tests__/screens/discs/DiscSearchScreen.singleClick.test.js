/**
 * Critical Test: Verify single-click Apply buttons work correctly
 * This test specifically addresses the double-click bug
 */

/* eslint-disable no-unused-vars */
import React from 'react';
/* eslint-enable no-unused-vars */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import DiscSearchScreen from '../../../src/screens/discs/DiscSearchScreen';
import { searchDiscs } from '../../../src/services/discService';

// Mock the disc service
jest.mock('../../../src/services/discService');

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
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

const mockDiscs = [
  {
    id: '1',
    brand: 'Innova',
    model: 'Destroyer',
    speed: 12,
    glide: 5,
    turn: -1,
    fade: 3,
  },
  {
    id: '2',
    brand: 'Discraft',
    model: 'Zone',
    speed: 4,
    glide: 3,
    turn: 0,
    fade: 3,
  },
];

describe('DiscSearchScreen Single-Click Apply Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock response
    searchDiscs.mockResolvedValue({
      discs: mockDiscs,
      pagination: {
        total: mockDiscs.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });
  });

  it('CRITICAL: Filter Apply button should work on FIRST click', async () => {
    const { getByLabelText, getByText, getAllByText } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalled();
    });

    // Clear all previous calls
    jest.clearAllMocks();

    // Step 1: Open filter panel
    fireEvent.press(getByLabelText('Open filter panel'));

    await waitFor(() => {
      expect(getByText('Filter Discs')).toBeTruthy();
    });

    // Step 2: Select a brand (get all elements and press the one in the filter panel)
    const innovaElements = getAllByText('Innova');
    // The filter panel Innova should be pressable (not the disc list item)
    fireEvent.press(innovaElements[innovaElements.length - 1]);

    // Step 3: Press Apply button ONCE
    fireEvent.press(getByText(/Apply/));

    // CRITICAL: Should call searchDiscs immediately with brand filter
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Innova',
        }),
      );
    });

    // Should be called exactly ONCE, not zero times
    expect(searchDiscs).toHaveBeenCalledTimes(1);
  });

  it('CRITICAL: Sort Apply button should work on FIRST click', async () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalled();
    });

    // Clear all previous calls
    jest.clearAllMocks();

    // Step 1: Open sort panel
    fireEvent.press(getByLabelText('Open sort panel'));

    await waitFor(() => {
      expect(getByText('Sort Discs')).toBeTruthy();
    });

    // Step 2: Select Speed sort
    fireEvent.press(getByText('Speed'));

    // Step 3: Press Apply button ONCE
    fireEvent.press(getByText(/Apply/));

    // CRITICAL: Should call searchDiscs immediately
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalled();
    });

    // Should be called exactly ONCE, not zero times
    expect(searchDiscs).toHaveBeenCalledTimes(1);
  });

  it('CRITICAL: Both filter and sort should work together on first clicks', async () => {
    const { getByLabelText, getByText, getAllByText } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    // Apply filter first
    fireEvent.press(getByLabelText('Open filter panel'));

    await waitFor(() => {
      expect(getByText('Filter Discs')).toBeTruthy();
    });

    const innovaElements = getAllByText('Innova');
    fireEvent.press(innovaElements[innovaElements.length - 1]);
    fireEvent.press(getByText(/Apply/));

    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Innova',
        }),
      );
    });

    const firstCallCount = searchDiscs.mock.calls.length;
    expect(firstCallCount).toBe(1);

    // Then apply sort
    fireEvent.press(getByLabelText('Open sort panel'));

    await waitFor(() => {
      expect(getByText('Sort Discs')).toBeTruthy();
    });

    fireEvent.press(getByText('Speed'));
    fireEvent.press(getByText(/Apply/));

    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledTimes(2);
    });

    // Verify the sort call maintains the filter
    const lastCall = searchDiscs.mock.calls[searchDiscs.mock.calls.length - 1][0];
    expect(lastCall).toEqual(
      expect.objectContaining({
        brand: 'Innova',
      }),
    );
  });

  it('should verify the state override mechanism works', async () => {
    const { getByLabelText, getByText, getAllByText } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    // Test rapid filter changes
    fireEvent.press(getByLabelText('Open filter panel'));

    await waitFor(() => {
      expect(getByText('Filter Discs')).toBeTruthy();
    });

    // Select Innova
    const innovaElements = getAllByText('Innova');
    fireEvent.press(innovaElements[innovaElements.length - 1]);

    // Select Discraft too (multiple selection)
    const discraftElements = getAllByText('Discraft');
    fireEvent.press(discraftElements[discraftElements.length - 1]);

    // Apply immediately
    fireEvent.press(getByText(/Apply/));

    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Innova,Discraft',
        }),
      );
    });

    expect(searchDiscs).toHaveBeenCalledTimes(1);
  });
});
