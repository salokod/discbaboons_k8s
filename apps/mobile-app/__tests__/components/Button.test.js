/**
 * Button Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/Button';

describe('Button component', () => {
  it('should export a Button component', () => {
    const ButtonModule = require('../../src/components/Button');

    expect(ButtonModule.default).toBeDefined();
    expect(typeof ButtonModule.default).toBe('function');
  });

  it('should render a TouchableOpacity', () => {
    const { getByTestId } = render(<Button />);

    expect(getByTestId('button')).toBeTruthy();
  });

  it('should display title text', () => {
    const { getByText } = render(<Button title="Login" />);

    expect(getByText('Login')).toBeTruthy();
  });

  it('should display any title text', () => {
    const randomTitle = Math.random().toString(36).substring(7);
    const { getByText } = render(<Button title={randomTitle} />);

    expect(getByText(randomTitle)).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(<Button title="Test" onPress={onPressMock} />);

    fireEvent.press(getByTestId('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
