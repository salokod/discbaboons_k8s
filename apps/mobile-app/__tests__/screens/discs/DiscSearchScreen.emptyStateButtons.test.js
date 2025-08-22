/**
 * DiscSearchScreen - Empty State Buttons Test
 * Verifies that both "Clear All" and "Add New Disc" buttons appear and work
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

describe('DiscSearchScreen - Empty State Buttons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show both Clear All and Add Disc buttons when search returns no results', async () => {
    // Initial load - some discs
    searchDiscs.mockResolvedValueOnce({
      discs: [
        {
          id: '1',
          model: 'Test',
          brand: 'Brand',
          speed: 5,
          glide: 5,
          turn: 0,
          fade: 1,
        },
      ],
      pagination: {
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    // Search - no results
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
      getByText,
    } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    // Wait for initial load
    await waitFor(() => expect(searchDiscs).toHaveBeenCalledTimes(1));

    // Perform search
    fireEvent.changeText(getByPlaceholderText('Search disc models...'), 'NonExistent');
    fireEvent.press(getByLabelText('Search discs'));

    // Wait for empty state
    await waitFor(() => {
      expect(getByText('No Discs Found')).toBeTruthy();
      expect(getByText('Clear All')).toBeTruthy();
      expect(getByText('Add New Disc')).toBeTruthy();
    });
  });

  it('should navigate to SubmitDiscScreen when Add New Disc button is pressed', async () => {
    searchDiscs.mockResolvedValue({
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
      getByText,
    } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    await waitFor(() => expect(searchDiscs).toHaveBeenCalledTimes(1));

    // Search for non-existent disc
    fireEvent.changeText(getByPlaceholderText('Search disc models...'), 'MyCustomDisc');
    fireEvent.press(getByLabelText('Search discs'));

    await waitFor(() => expect(searchDiscs).toHaveBeenCalledTimes(2));

    // Click "Add New Disc"
    const addButton = await waitFor(() => getByText('Add New Disc'));
    fireEvent.press(addButton);

    expect(mockNavigate).toHaveBeenCalledWith('SubmitDiscScreen');
  });

  it('should clear search when Clear All button is pressed', async () => {
    // Initial - discs
    searchDiscs.mockResolvedValueOnce({
      discs: [
        {
          id: '1',
          model: 'Test',
          brand: 'Brand',
          speed: 5,
          glide: 5,
          turn: 0,
          fade: 1,
        },
      ],
      pagination: {
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    // Search - no results
    searchDiscs.mockResolvedValueOnce({
      discs: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    // Clear - back to all discs
    searchDiscs.mockResolvedValueOnce({
      discs: [
        {
          id: '1',
          model: 'Test',
          brand: 'Brand',
          speed: 5,
          glide: 5,
          turn: 0,
          fade: 1,
        },
      ],
      pagination: {
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });

    const {
      getByPlaceholderText,
      getByLabelText,
      getByText,
      queryByText,
    } = renderWithTheme(
      <DiscSearchScreen navigation={mockNavigation} />,
    );

    await waitFor(() => expect(searchDiscs).toHaveBeenCalledTimes(1));

    // Search for non-existent
    fireEvent.changeText(getByPlaceholderText('Search disc models...'), 'NoResults');
    fireEvent.press(getByLabelText('Search discs'));

    // Wait for empty state
    await waitFor(() => expect(getByText('No Discs Found')).toBeTruthy());

    // Click Clear All
    fireEvent.press(getByText('Clear All'));

    // Should reload all discs
    await waitFor(() => {
      expect(searchDiscs).toHaveBeenCalledTimes(3);
      // When cleared, the search should not include model field (no search query)
      expect(searchDiscs).toHaveBeenLastCalledWith(
        expect.not.objectContaining({
          model: expect.anything(),
        }),
      );
      expect(queryByText('No Discs Found')).toBeNull();
      expect(getByText('Test')).toBeTruthy(); // Original disc is back
    });
  });
});
