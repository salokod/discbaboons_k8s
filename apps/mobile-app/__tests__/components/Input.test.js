/**
 * Input Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import Input from '../../src/components/Input';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('Input component', () => {
  it('should export an Input component', () => {
    const InputModule = require('../../src/components/Input');

    expect(InputModule.default).toBeDefined();
    expect(typeof InputModule.default).toBe('function');
  });

  it('should render a TextInput', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Input />
      </ThemeProvider>,
    );

    expect(getByTestId('input')).toBeTruthy();
  });

  it('should accept placeholder prop', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <Input placeholder="Enter username" />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Enter username')).toBeTruthy();
  });

  it('should accept value prop', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <Input value="test123" />
      </ThemeProvider>,
    );

    expect(getByDisplayValue('test123')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeTextMock = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <Input onChangeText={onChangeTextMock} />
      </ThemeProvider>,
    );

    fireEvent.changeText(getByTestId('input'), 'new text');
    expect(onChangeTextMock).toHaveBeenCalledWith('new text');
  });
});
