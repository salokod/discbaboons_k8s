import { render, screen, fireEvent } from '@testing-library/react-native';
import CustomButton from '../CustomButton';

test('CustomButton component renders with title prop', () => {
  render(<CustomButton title="Press Me" />);
  const buttonText = screen.getByText('Press Me');
  expect(buttonText).toBeTruthy();
});

test('CustomButton calls onPress when pressed', () => {
  const mockOnPress = jest.fn();
  render(<CustomButton title="Press Me" onPress={mockOnPress} />);

  const button = screen.getByText('Press Me');
  fireEvent.press(button);

  expect(mockOnPress).toHaveBeenCalledTimes(1);
});

test('CustomButton has proper styling', () => {
  const { getByTestId } = render(<CustomButton title="Press Me" />);
  const button = getByTestId('custom-button');

  expect(button.props.style).toMatchObject({
    backgroundColor: '#841584',
    padding: 10,
    borderRadius: 5,
  });
});
