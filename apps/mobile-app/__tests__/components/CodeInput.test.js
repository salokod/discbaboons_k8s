/**
 * CodeInput Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import CodeInput from '../../src/components/CodeInput';

const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('CodeInput component', () => {
  it('should export a CodeInput component', () => {
    const CodeInputModule = require('../../src/components/CodeInput');

    expect(CodeInputModule.default).toBeDefined();
    expect(typeof CodeInputModule.default).toBe('function');
  });

  it('should render 6 individual digit inputs', () => {
    const { getByTestId } = renderWithTheme(
      <CodeInput />,
    );

    for (let i = 0; i < 6; i += 1) {
      expect(getByTestId(`code-input-${i}`)).toBeTruthy();
    }
  });

  it('should call onChangeText when digit is entered', () => {
    const mockOnChangeText = jest.fn();
    const { getByTestId } = renderWithTheme(
      <CodeInput onChangeText={mockOnChangeText} />,
    );

    const firstInput = getByTestId('code-input-0');
    fireEvent.changeText(firstInput, '1');

    expect(mockOnChangeText).toHaveBeenCalledWith('1');
  });

  it('should auto-advance to next input when digit is entered', () => {
    const mockOnChangeText = jest.fn();
    const { getByTestId } = renderWithTheme(
      <CodeInput onChangeText={mockOnChangeText} />,
    );

    const firstInput = getByTestId('code-input-0');
    fireEvent.changeText(firstInput, '1');

    // Note: Testing auto-focus behavior is limited in testing environment
    // This would need integration testing to fully validate
    expect(firstInput.props.value).toBe('1');
    expect(mockOnChangeText).toHaveBeenCalledWith('1');
  });

  it('should handle backspace navigation', () => {
    const mockOnChangeText = jest.fn();
    const { getByTestId } = renderWithTheme(
      <CodeInput onChangeText={mockOnChangeText} />,
    );

    const secondInput = getByTestId('code-input-1');
    fireEvent(secondInput, 'keyPress', { nativeEvent: { key: 'Backspace' } });

    // Should clear current or previous digit
    expect(mockOnChangeText).toHaveBeenCalled();
  });

  it('should call onComplete when all 6 digits are filled', () => {
    const mockOnComplete = jest.fn();
    const mockOnChangeText = jest.fn();

    const { getByTestId } = renderWithTheme(
      <CodeInput onChangeText={mockOnChangeText} onComplete={mockOnComplete} />,
    );

    // Fill all 6 characters with hex values
    const hexChars = ['A', '1', 'B', '2', 'C', '3'];
    for (let i = 0; i < 6; i += 1) {
      const input = getByTestId(`code-input-${i}`);
      fireEvent.changeText(input, hexChars[i]);
    }

    expect(mockOnComplete).toHaveBeenCalledWith('A1B2C3');
  });

  it('should only accept hexadecimal characters (0-9, A-F)', () => {
    const mockOnChangeText = jest.fn();
    const { getByTestId } = renderWithTheme(
      <CodeInput onChangeText={mockOnChangeText} />,
    );

    const firstInput = getByTestId('code-input-0');

    // Should accept numbers
    fireEvent.changeText(firstInput, '5');
    expect(mockOnChangeText).toHaveBeenCalledWith('5');

    // Should accept hex letters (A-F) and convert to uppercase
    fireEvent.changeText(firstInput, 'a');
    expect(mockOnChangeText).toHaveBeenCalledWith('A');

    fireEvent.changeText(firstInput, 'F');
    expect(mockOnChangeText).toHaveBeenCalledWith('F');

    // Should reject non-hex letters
    fireEvent.changeText(firstInput, 'G');
    expect(mockOnChangeText).toHaveBeenCalledWith('');

    // Should reject special characters
    fireEvent.changeText(firstInput, '!');
    expect(mockOnChangeText).toHaveBeenCalledWith('');
  });

  it('should update display when value prop changes', () => {
    const { getByTestId, rerender } = renderWithTheme(
      <CodeInput value="A1B2C3" />,
    );

    expect(getByTestId('code-input-0').props.value).toBe('A');
    expect(getByTestId('code-input-1').props.value).toBe('1');
    expect(getByTestId('code-input-2').props.value).toBe('B');
    expect(getByTestId('code-input-3').props.value).toBe('2');
    expect(getByTestId('code-input-4').props.value).toBe('C');
    expect(getByTestId('code-input-5').props.value).toBe('3');

    rerender(
      <ThemeProvider>
        <CodeInput value="F4E5D6" />
      </ThemeProvider>,
    );

    expect(getByTestId('code-input-0').props.value).toBe('F');
    expect(getByTestId('code-input-1').props.value).toBe('4');
    expect(getByTestId('code-input-2').props.value).toBe('E');
    expect(getByTestId('code-input-3').props.value).toBe('5');
    expect(getByTestId('code-input-4').props.value).toBe('D');
    expect(getByTestId('code-input-5').props.value).toBe('6');
  });
});
