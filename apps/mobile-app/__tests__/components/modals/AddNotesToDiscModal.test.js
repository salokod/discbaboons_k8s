/**
 * AddNotesToDiscModal Test
 * Tests for the modal component that allows adding notes to discs
 */

import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import AddNotesToDiscModal from '../../../src/components/modals/AddNotesToDiscModal';

const mockDisc = {
  id: 'test-disc-1',
  brand: 'Innova',
  model: 'Champion Teebird',
  speed: 7,
  glide: 5,
  turn: 0,
  fade: 2,
};

describe('AddNotesToDiscModal - Slice 2: Modal UI Structure', () => {
  it('should export AddNotesToDiscModal component', () => {
    expect(typeof AddNotesToDiscModal).toBe('function');
  });

  it('should accept basic props without crashing', () => {
    expect(() => {
      render(
        <ThemeProvider>
          <AddNotesToDiscModal
            visible={false}
            disc={mockDisc}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );
    }).not.toThrow();
  });

  it('should render modal when visible is true', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AddNotesToDiscModal
          visible
          disc={mockDisc}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('add-notes-modal')).toBeTruthy();
  });

  it('should not render modal when visible is false', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <AddNotesToDiscModal
          visible={false}
          disc={mockDisc}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(queryByTestId('add-notes-modal')).toBeFalsy();
  });

  it('should call onClose when close button is pressed', () => {
    const onClose = jest.fn();

    const { getByTestId } = render(
      <ThemeProvider>
        <AddNotesToDiscModal
          visible
          disc={mockDisc}
          onClose={onClose}
          onSuccess={jest.fn()}
        />
      </ThemeProvider>,
    );

    fireEvent.press(getByTestId('close-button'));
    expect(onClose).toHaveBeenCalled();
  });

  describe('Slice 3: Notes Input Field', () => {
    it('should render notes input field', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AddNotesToDiscModal
            visible
            disc={mockDisc}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('notes-input')).toBeTruthy();
    });

    it('should handle text input changes', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AddNotesToDiscModal
            visible
            disc={mockDisc}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const notesInput = getByTestId('notes-input');
      fireEvent.changeText(notesInput, 'Test notes');

      expect(notesInput.props.value).toBe('Test notes');
    });

    it('should have proper placeholder text', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AddNotesToDiscModal
            visible
            disc={mockDisc}
            onClose={jest.fn()}
            onSuccess={jest.fn()}
          />
        </ThemeProvider>,
      );

      const notesInput = getByTestId('notes-input');
      expect(notesInput.props.placeholder).toContain('notes');
    });
  });
});
