/**
 * DenialConfirmationModal Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import DenialConfirmationModal from '../../../src/components/modals/DenialConfirmationModal';
import { ThemeProvider } from '../../../src/context/ThemeContext';

const mockDisc = {
  id: '123',
  model: 'Destroyer',
  brand: 'Innova',
  speed: 12,
  glide: 5,
  turn: -1,
  fade: 3,
};

describe('DenialConfirmationModal', () => {
  it('should export DenialConfirmationModal component', () => {
    expect(typeof DenialConfirmationModal).toBe('function');
  });

  it('should render modal when visible', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DenialConfirmationModal
          visible
          disc={mockDisc}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Deny Disc Submission')).toBeTruthy();
  });

  it('should display disc information', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DenialConfirmationModal
          visible
          disc={mockDisc}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Destroyer')).toBeTruthy();
    expect(getByText('by Innova')).toBeTruthy();
  });

  it('should have reason input field', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <DenialConfirmationModal
          visible
          disc={mockDisc}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Explain why this disc is being denied (optional)...')).toBeTruthy();
  });

  it('should have cancel and deny buttons', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DenialConfirmationModal
          visible
          disc={mockDisc}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Deny Disc')).toBeTruthy();
  });

  it('should call onCancel when cancel button is pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <DenialConfirmationModal
          visible
          disc={mockDisc}
          onConfirm={jest.fn()}
          onCancel={onCancel}
        />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm with reason when deny button is pressed', () => {
    const onConfirm = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <DenialConfirmationModal
          visible
          disc={mockDisc}
          onConfirm={onConfirm}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );

    const reasonInput = getByPlaceholderText('Explain why this disc is being denied (optional)...');
    fireEvent.changeText(reasonInput, 'Invalid flight numbers');
    fireEvent.press(getByText('Deny Disc'));

    expect(onConfirm).toHaveBeenCalledWith('Invalid flight numbers');
  });

  it('should call onConfirm with empty string when no reason provided', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <DenialConfirmationModal
          visible
          disc={mockDisc}
          onConfirm={onConfirm}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Deny Disc'));
    expect(onConfirm).toHaveBeenCalledWith('');
  });
});
