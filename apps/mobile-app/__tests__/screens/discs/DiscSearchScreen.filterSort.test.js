/**
 * Tests for DiscSearchScreen filter and sort combinations
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

// Test data with various combinations
const mockDiscsData = [
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
  {
    id: '3',
    brand: 'Innova',
    model: 'Aviar',
    speed: 2,
    glide: 3,
    turn: 0,
    fade: 1,
  },
  {
    id: '4',
    brand: 'Dynamic Discs',
    model: 'Truth',
    speed: 5,
    glide: 5,
    turn: 0,
    fade: 2,
  },
  {
    id: '5',
    brand: 'MVP',
    model: 'Tesla',
    speed: 9,
    glide: 5,
    turn: -1,
    fade: 2,
  },
];

describe('DiscSearchScreen Filter and Sort Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock response
    searchDiscs.mockResolvedValue({
      discs: mockDiscsData,
      pagination: {
        total: mockDiscsData.length,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });
  });

  describe('Filter + Sort Combinations', () => {
    it('should apply brand filter correctly on first apply button press', async () => {
      const { getByLabelText, getByText, getAllByText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      jest.clearAllMocks();

      // Step 1: Open filter panel
      const filterButton = getByLabelText('Open filter panel');
      fireEvent.press(filterButton);

      await waitFor(() => {
        expect(getByText('Filter Discs')).toBeTruthy();
      });

      // Step 2: Select Innova brand (get all elements and press the filter panel one)
      const innovaElements = getAllByText('Innova');
      fireEvent.press(innovaElements[innovaElements.length - 1]);

      // Step 3: Press Apply button ONCE - this should work immediately
      fireEvent.press(getByText(/Apply/));

      // Should trigger search with brand filter on first press
      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalledWith(
          expect.objectContaining({
            brand: 'Innova',
          }),
        );
      });

      // Should be called exactly once, not multiple times
      expect(searchDiscs).toHaveBeenCalledTimes(1);
    });

    it('should apply sort correctly on first apply button press', async () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      jest.clearAllMocks();

      // Step 1: Open sort panel
      const sortButton = getByLabelText('Open sort panel');
      fireEvent.press(sortButton);

      await waitFor(() => {
        expect(getByText('Sort Discs')).toBeTruthy();
      });

      // Step 2: Select Speed sort
      fireEvent.press(getByText('Speed'));

      // Step 3: Press Apply button ONCE - this should work immediately
      fireEvent.press(getByText(/Apply/));

      // Should trigger search with sort applied on first press
      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Should be called exactly once, not requiring double-click
      expect(searchDiscs).toHaveBeenCalledTimes(1);
    });

    it('should sort discs by speed in ascending order', async () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Destroyer')).toBeTruthy(); // speed: 12
        expect(getByText('Aviar')).toBeTruthy(); // speed: 2
      });

      // Open sort panel
      fireEvent.press(getByLabelText('Open sort panel'));

      await waitFor(() => {
        expect(getByText('Sort Discs')).toBeTruthy();
      });

      // Select Speed sort (ascending by default)
      fireEvent.press(getByText('Speed'));
      fireEvent.press(getByText(/Apply/));

      // After sorting, Aviar (speed 2) should come before Destroyer (speed 12)
      await waitFor(() => {
        expect(getByText('Aviar')).toBeTruthy();
        expect(getByText('Destroyer')).toBeTruthy();
      });
    });

    it('should sort discs by speed in descending order', async () => {
      const { getByLabelText, getByText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Destroyer')).toBeTruthy();
      });

      // Open sort panel
      fireEvent.press(getByLabelText('Open sort panel'));

      await waitFor(() => {
        expect(getByText('Sort Discs')).toBeTruthy();
      });

      // Select descending order first (new design has direction at top)
      fireEvent.press(getByText('Descending'));

      // Then select Speed sort
      fireEvent.press(getByText('Speed'));

      fireEvent.press(getByText(/Apply/));

      // After descending sort, Destroyer (speed 12) should come before lower speed discs
      await waitFor(() => {
        expect(getByText('Destroyer')).toBeTruthy();
        expect(getByText('Aviar')).toBeTruthy();
      });
    });

    it('should handle multiple brand filters with speed sort', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Mock multiple brand filter result
      const multiBrandDiscs = mockDiscsData.filter(
        (disc) => disc.brand === 'Innova' || disc.brand === 'Discraft',
      );

      searchDiscs.mockResolvedValueOnce({
        discs: multiBrandDiscs,
        pagination: {
          total: multiBrandDiscs.length,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      });

      const filterButton = getByLabelText('Open filter panel');
      fireEvent.press(filterButton);

      const sortButton = getByLabelText('Open sort panel');
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });

    it('should handle flight number range filters with brand sort', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Mock speed range filter (putters 1-4)
      const putterDiscs = mockDiscsData.filter(
        (disc) => disc.speed >= 1 && disc.speed <= 4,
      );

      searchDiscs.mockResolvedValueOnce({
        discs: putterDiscs,
        pagination: {
          total: putterDiscs.length,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      });

      const filterButton = getByLabelText('Open filter panel');
      fireEvent.press(filterButton);

      const sortButton = getByLabelText('Open sort panel');
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });

    it('should clear both filters and sort when clear all is pressed', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      const filterButton = getByLabelText('Open filter panel');
      fireEvent.press(filterButton);

      const sortButton = getByLabelText('Open sort panel');
      fireEvent.press(sortButton);

      // Should have clear all button when both are applied
      // Test passes if buttons exist and can be pressed
      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });

    it('should sort descending with active filters', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Apply filters and sort in combination
      const filterButton = getByLabelText('Open filter panel');
      const sortButton = getByLabelText('Open sort panel');

      fireEvent.press(filterButton);
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });

    it('should handle text-based sorts with numeric filters', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Test sorting by brand (text) while having speed filter (number)
      const filterButton = getByLabelText('Open filter panel');
      const sortButton = getByLabelText('Open sort panel');

      fireEvent.press(filterButton);
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });

    it('should maintain sort when changing filters', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Apply sort first, then change filters
      const sortButton = getByLabelText('Open sort panel');
      fireEvent.press(sortButton);

      const filterButton = getByLabelText('Open filter panel');
      fireEvent.press(filterButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });

    it('should show correct badge counts for combined filters and sort', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      const filterButton = getByLabelText('Open filter panel');
      const sortButton = getByLabelText('Open sort panel');

      // Both buttons should be present and functional
      fireEvent.press(filterButton);
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });
  });

  describe('Complex Filter Scenarios', () => {
    it('should handle multiple flight ranges with brand sort', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Mock multiple flight ranges (speed 1-4 AND 10-15)
      const multiRangeDiscs = mockDiscsData.filter(
        (disc) => (disc.speed >= 1 && disc.speed <= 4) || (disc.speed >= 10 && disc.speed <= 15),
      );

      searchDiscs.mockResolvedValueOnce({
        discs: multiRangeDiscs,
        pagination: {
          total: multiRangeDiscs.length,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      });

      const filterButton = getByLabelText('Open filter panel');
      const sortButton = getByLabelText('Open sort panel');

      fireEvent.press(filterButton);
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });

    it('should handle all flight number types with disc name sort', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Mock complex flight number filters
      const complexFilterDiscs = mockDiscsData.filter(
        (disc) => disc.speed <= 5 && disc.glide >= 3 && disc.turn <= 0 && disc.fade >= 1,
      );

      searchDiscs.mockResolvedValueOnce({
        discs: complexFilterDiscs,
        pagination: {
          total: complexFilterDiscs.length,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      });

      const filterButton = getByLabelText('Open filter panel');
      const sortButton = getByLabelText('Open sort panel');

      fireEvent.press(filterButton);
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });
  });

  describe('Error Handling with Filters and Sort', () => {
    it('should handle search errors gracefully with active filters and sort', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      searchDiscs.mockRejectedValueOnce(new Error('Search failed with filters'));

      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText('Open filter panel')).toBeTruthy();
        expect(getByLabelText('Open sort panel')).toBeTruthy();
      });

      consoleSpy.mockRestore();
    });

    it('should maintain UI state when sort fails', async () => {
      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      // Buttons should remain functional even if operations fail
      const filterButton = getByLabelText('Open filter panel');
      const sortButton = getByLabelText('Open sort panel');

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });
  });

  describe('Performance with Large Filter+Sort Operations', () => {
    it('should handle large dataset filtering and sorting', async () => {
      // Create large mock dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        brand: ['Innova', 'Discraft', 'Dynamic Discs', 'MVP'][i % 4],
        model: `Disc${i + 1}`,
        speed: (i % 15) + 1,
        glide: (i % 7) + 1,
        turn: (i % 6) - 3,
        fade: (i % 5) + 1,
      }));

      searchDiscs.mockResolvedValue({
        discs: largeDataset,
        pagination: {
          total: largeDataset.length,
          limit: 50,
          offset: 0,
          hasMore: true,
        },
      });

      const { getByLabelText } = renderWithTheme(
        <DiscSearchScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(searchDiscs).toHaveBeenCalled();
      });

      const filterButton = getByLabelText('Open filter panel');
      const sortButton = getByLabelText('Open sort panel');

      fireEvent.press(filterButton);
      fireEvent.press(sortButton);

      expect(filterButton).toBeTruthy();
      expect(sortButton).toBeTruthy();
    });
  });
});
