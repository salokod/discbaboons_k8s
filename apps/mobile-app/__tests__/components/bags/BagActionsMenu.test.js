/**
 * BagActionsMenu Component Tests
 * Tests for the modal-based bag actions menu component
 */

import { render, fireEvent, screen } from '@testing-library/react-native';
import BagActionsMenu from '../../../src/components/bags/BagActionsMenu';
import { ThemeProvider } from '../../../src/context/ThemeContext';

const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
  </ThemeProvider>,
);

describe('BagActionsMenu', () => {
  it('should export BagActionsMenu component', () => {
    expect(BagActionsMenu).toBeDefined();
  });

  it('should not render when visible is false', () => {
    renderWithTheme(
      <BagActionsMenu
        visible={false}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('bag-actions-modal')).toBeNull();
  });

  it('should render menu when visible is true', () => {
    renderWithTheme(
      <BagActionsMenu
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        visible
      />,
    );

    expect(screen.getByTestId('bag-actions-modal')).toBeTruthy();
    expect(screen.getByText('Edit Bag')).toBeTruthy();
    expect(screen.getByText('Delete Bag')).toBeTruthy();
  });

  it('should call onEdit when edit option is pressed', () => {
    const onEdit = jest.fn();

    renderWithTheme(
      <BagActionsMenu
        onClose={jest.fn()}
        onEdit={onEdit}
        onDelete={jest.fn()}
        visible
      />,
    );

    fireEvent.press(screen.getByText('Edit Bag'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('should call onDelete when delete option is pressed', () => {
    const onDelete = jest.fn();

    renderWithTheme(
      <BagActionsMenu
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={onDelete}
        visible
      />,
    );

    fireEvent.press(screen.getByText('Delete Bag'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('should call onClose when close button is pressed', () => {
    const onClose = jest.fn();

    renderWithTheme(
      <BagActionsMenu
        onClose={onClose}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        visible
      />,
    );

    fireEvent.press(screen.getByTestId('close-button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is pressed', () => {
    const onClose = jest.fn();

    renderWithTheme(
      <BagActionsMenu
        onClose={onClose}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        visible
      />,
    );

    fireEvent.press(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should have proper accessibility labels', () => {
    renderWithTheme(
      <BagActionsMenu
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        visible
      />,
    );

    expect(screen.getByLabelText('Close bag options menu')).toBeTruthy();
    expect(screen.getByLabelText('Edit bag properties')).toBeTruthy();
    expect(screen.getByLabelText('Delete this bag')).toBeTruthy();
  });

  it('should display proper icons for menu items', () => {
    renderWithTheme(
      <BagActionsMenu
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        visible
      />,
    );

    // Check for edit icon (create-outline)
    expect(screen.getByTestId('edit-icon')).toBeTruthy();
    // Check for delete icon (trash-outline)
    expect(screen.getByTestId('delete-icon')).toBeTruthy();
  });
});
