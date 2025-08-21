/**
 * BackButton Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import BackButton from '../../src/components/BackButton';

// Mock ThemeContext
jest.mock('../../src/context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    text: '#212121',
    textLight: '#757575',
    surface: '#FFFFFF',
    background: '#FAFBFC',
    border: '#E0E0E0',
  })),
}));

describe('BackButton', () => {
  it('should export a function', () => {
    expect(BackButton).toBeDefined();
    expect(typeof BackButton).toBe('object'); // React.memo returns an object
  });

  it('should render back button with icon', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(<BackButton onPress={mockOnPress} />);

    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(<BackButton onPress={mockOnPress} />);

    fireEvent.press(getByTestId('back-button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility properties', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(<BackButton onPress={mockOnPress} />);

    const button = getByTestId('back-button');
    expect(button.props.accessibilityLabel).toBe('Go back');
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('should support custom accessibility label', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <BackButton onPress={mockOnPress} accessibilityLabel="Return to previous screen" />,
    );

    const button = getByTestId('back-button');
    expect(button.props.accessibilityLabel).toBe('Return to previous screen');
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(<BackButton onPress={mockOnPress} disabled />);

    const button = getByTestId('back-button');
    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
