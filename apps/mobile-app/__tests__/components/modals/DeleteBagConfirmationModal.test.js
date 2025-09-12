/**
 * DeleteBagConfirmationModal Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import DeleteBagConfirmationModal from '../../../src/components/modals/DeleteBagConfirmationModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';

const mockBag = {
  id: '1',
  name: 'Course Bag',
  description: 'My favorite discs for the local course',
  disc_count: 12,
};

describe('DeleteBagConfirmationModal', () => {
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

  it('should have confirm button that calls onConfirm', () => {
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

    // Get the button (second instance of "Delete Bag" text)
    const deleteBagElements = getAllByText('Delete Bag');
    const deleteButton = deleteBagElements[1]; // Button is the second instance

    fireEvent.press(deleteButton);
    expect(mockOnConfirm).toHaveBeenCalledWith(mockBag);
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
});
