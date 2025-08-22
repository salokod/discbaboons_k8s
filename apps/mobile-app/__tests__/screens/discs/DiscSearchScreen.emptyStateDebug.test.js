/**
 * DiscSearchScreen - Empty State Debug Test
 * Debugging why empty state doesn't show buttons
 */

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

const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('DiscSearchScreen - Empty State Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty state and search action bar when search returns no results', async () => {
    // First mock - initial load with discs
    searchDiscs.mockResolvedValueOnce({
      discs: [
        {
          id: '1',
          brand: 'Innova',
          model: 'Destroyer',
          speed: 12,
          glide: 5,
          turn: -1,
          fade: 3,
        },
      ],
      pagination: {
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    // Second mock - search with no results
    searchDiscs.mockResolvedValueOnce({
      discs: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    const {
      getByPlaceholderText,
      getByLabelText,
      getByTestId,
      getByText,
      queryByText,
      debug,
    } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    // Wait for initial load
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledTimes(1);
      expect(getByText('Destroyer')).toBeTruthy();
    });

    // Type search query
    const searchInput = getByPlaceholderText('Search disc models...');
    fireEvent.changeText(searchInput, 'NonExistentDisc');

    // Click search button
    const searchButton = getByLabelText('Search discs');
    fireEvent.press(searchButton);

    // Wait for search to complete
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledTimes(2);
      expect(searchDiscs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          model: 'NonExistentDisc',
        }),
      );
    });

    // Debug the current state
    debug();

    // Check if empty state is rendered
    await waitFor(() => {
      // The disc should no longer be visible
      expect(queryByText('Destroyer')).toBeNull();

      // Check for empty state elements
      const emptyState = getByTestId('empty-state');
      expect(emptyState).toBeTruthy();

      // Check for the title
      const title = getByTestId('empty-state-title');
      expect(title).toBeTruthy();
      expect(getByText('No Discs Found')).toBeTruthy();

      // Check for the subtitle with search query
      const subtitle = getByTestId('empty-state-subtitle');
      expect(subtitle).toBeTruthy();
      expect(getByText(/No discs match "NonExistentDisc"/)).toBeTruthy();

      // Check for the SearchActionBar with buttons
      const searchActionBar = getByTestId('search-action-bar');
      expect(searchActionBar).toBeTruthy();

      // Check for the Clear All button in SearchActionBar
      const clearButton = getByTestId('clear-button');
      expect(clearButton).toBeTruthy();
      expect(getByText('Clear All')).toBeTruthy();

      // Check for the Add Disc button in SearchActionBar
      const addDiscButton = getByTestId('add-disc-button');
      expect(addDiscButton).toBeTruthy();
      expect(getByText('Add New Disc')).toBeTruthy();
    });
  });

  it('should navigate to SubmitDiscScreen when secondary action is pressed', async () => {
    // Mock empty search results
    searchDiscs.mockResolvedValue({
      discs: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    const { getByPlaceholderText, getByLabelText, getByText } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    // Wait for initial load (empty)
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledTimes(1);
    });

    // Type search query
    const searchInput = getByPlaceholderText('Search disc models...');
    fireEvent.changeText(searchInput, 'TestDisc');

    // Click search button
    const searchButton = getByLabelText('Search discs');
    fireEvent.press(searchButton);

    // Wait for search to complete
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledTimes(2);
    });

    // Find and click the "Add New Disc" button
    await waitFor(() => {
      const addDiscButton = getByText('Add New Disc');
      expect(addDiscButton).toBeTruthy();
      fireEvent.press(addDiscButton);
    });

    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('SubmitDiscScreen');
  });
});
