/**
 * DeleteBagConfirmationModal Tests
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DeleteBagConfirmationModal from '../../../src/components/modals/DeleteBagConfirmationModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import * as bagService from '../../../src/services/bagService';

// Mock the bagService
jest.mock('../../../src/services/bagService');

const mockBag = {
  id: '1',
  name: 'Course Bag',
  description: 'My favorite discs for the local course',
  disc_count: 12,
};

const mockBags = [
  { id: '1', name: 'Course Bag', disc_count: 12 },
  { id: '2', name: 'Practice Bag', disc_count: 8 },
  { id: '3', name: 'Tournament Bag', disc_count: 15 },
];

describe('DeleteBagConfirmationModal', () => {
  beforeEach(() => {
    // Mock getBags to return available bags
    jest.mocked(bagService.getBags).mockResolvedValue(mockBags);
  });
  it('should export a DeleteBagConfirmationModal component', () => {
    expect(DeleteBagConfirmationModal).toBeTruthy();
  });

  it('should display bag name when visible', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    expect(getByText('Course Bag')).toBeTruthy();
  });

  it('should show disc count warning for bags with discs', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    expect(getByText('12 discs')).toBeTruthy();
  });

  it('should have Delete Bag button disabled for bags with discs', () => {
    const mockOnConfirm = jest.fn();
    const { getAllByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={mockOnConfirm}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // For bags with discs, the Delete Bag button should be disabled (get the button, not header)
    const deleteElements = getAllByText('Delete Bag');
    expect(deleteElements).toHaveLength(2); // Header + Button
    const deleteButton = deleteElements[1]; // The button is the second element
    expect(deleteButton.parent?.parent?.props?.accessibilityState?.disabled).toBe(true);
  });

  it('should have cancel button that calls onCancel', () => {
    const mockOnCancel = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={mockOnCancel}
        />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should accept navigation prop without error', () => {
    const mockNavigation = { navigate: jest.fn() };
    const { getByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
          navigation={mockNavigation}
        />
      </ThemeProvider>,
    );

    expect(getByText('Course Bag')).toBeTruthy();
  });

  it('should accept onMoveComplete prop without error', () => {
    const mockOnMoveComplete = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
          onMoveComplete={mockOnMoveComplete}
        />
      </ThemeProvider>,
    );

    expect(getByText('Course Bag')).toBeTruthy();
  });

  it('should show different content for bags with discs vs empty bags', () => {
    const emptyBag = { ...mockBag, disc_count: 0 };

    // Test bag with discs - should show disc-specific warning
    const { getByText, queryByText, rerender } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // Should show disc-specific warning for bags with discs
    expect(getByText(/You must move all discs to another bag before deleting/)).toBeTruthy();

    // Test empty bag - should show different content
    rerender(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={emptyBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // For empty bags, should show different warning (no disc-related text)
    expect(queryByText(/You must move all discs to another bag before deleting/)).toBeFalsy();
    expect(getByText(/This action cannot be undone/)).toBeTruthy();
  });

  it('should initialize with correct default modal states', () => {
    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // Should be in INITIAL state by default - showing Delete Bag header + button
    expect(getAllByText('Delete Bag')).toHaveLength(2); // Header + Button
    // Should not show any bag selection UI (which would indicate CHOOSING_BAG state)
    expect(() => getByText('Select a bag')).toThrow();
  });

  it('should show appropriate buttons based on disc count', () => {
    const emptyBag = { ...mockBag, disc_count: 0 };

    // Test bag with discs - should show "🔄 Move Discs First" in separate section
    // and disabled "Delete Bag" in bottom
    const {
      getByText, queryByText, getAllByText, rerender,
    } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // Should show Move Discs First button with emoji (primary action in separate section)
    expect(getByText('🔄 Move Discs First')).toBeTruthy();
    // Should show Delete Bag button in bottom actions (but disabled)
    expect(getAllByText('Delete Bag')).toHaveLength(2); // Header + disabled button
    // Should NOT show Delete Anyway button anymore
    expect(queryByText('Delete Anyway')).toBeFalsy();

    // Test empty bag - should show enabled Delete Bag button and no Move Discs First
    rerender(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={emptyBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // Should show standard Delete Bag button (header + button = 2)
    expect(getAllByText('Delete Bag')).toHaveLength(2);
    // Should not show move discs option for empty bags
    expect(queryByText('🔄 Move Discs First')).toBeFalsy();
  });

  it('should transition to CHOOSING_BAG state when Move Discs First is pressed', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={mockBag}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // Initial state - should show Move Discs First button with emoji
    expect(getByText('🔄 Move Discs First')).toBeTruthy();

    // Click Move Discs First button
    fireEvent.press(getByText('🔄 Move Discs First'));

    // Should call getBags service to load available bags
    await waitFor(() => {
      expect(bagService.getBags).toHaveBeenCalled();
    });
  });

  it('should have enabled Delete Bag button for empty bags', () => {
    const emptyBag = { ...mockBag, disc_count: 0 };
    const mockOnConfirm = jest.fn();
    const { getAllByText } = render(
      <ThemeProvider>
        <DeleteBagConfirmationModal
          visible
          bag={emptyBag}
          onConfirm={mockOnConfirm}
          onCancel={() => {}}
        />
      </ThemeProvider>,
    );

    // For empty bags, the Delete Bag button should be enabled and functional
    const deleteElements = getAllByText('Delete Bag');
    expect(deleteElements).toHaveLength(2); // Header + Button
    const deleteButton = deleteElements[1]; // The button is the second element
    expect(deleteButton.parent?.parent?.props?.accessibilityState?.disabled).toBeFalsy();

    // Should be able to press the button and call onConfirm
    fireEvent.press(deleteButton);
    expect(mockOnConfirm).toHaveBeenCalledWith(emptyBag);
  });
});
