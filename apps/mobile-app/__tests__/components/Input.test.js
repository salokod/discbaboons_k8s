/**
 * Input Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import Input from '../../src/components/Input';

describe('Input component', () => {
  it('should export an Input component', () => {
    const Input = require('../../src/components/Input');

    expect(Input.default).toBeDefined();
    expect(typeof Input.default).toBe('function');
  });

  it('should render a TextInput', () => {
    const { getByTestId } = render(<Input />);

    expect(getByTestId('input')).toBeTruthy();
  });

  it('should accept placeholder prop', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter username" />);

    expect(getByPlaceholderText('Enter username')).toBeTruthy();
  });

  it('should accept value prop', () => {
    const { getByDisplayValue } = render(<Input value="test123" />);

    expect(getByDisplayValue('test123')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeTextMock = jest.fn();
    const { getByTestId } = render(<Input onChangeText={onChangeTextMock} />);

    fireEvent.changeText(getByTestId('input'), 'new text');
    expect(onChangeTextMock).toHaveBeenCalledWith('new text');
  });
});