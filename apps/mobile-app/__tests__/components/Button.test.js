/**
 * Button Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/Button';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { themes, THEME_NAMES } from '../../src/design-system/themes';

describe('Button component', () => {
  it('should export a Button component', () => {
    const ButtonModule = require('../../src/components/Button');

    expect(ButtonModule.default).toBeDefined();
    expect(typeof ButtonModule.default).toBe('function');
  });

  it('should render a TouchableOpacity', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Button />
      </ThemeProvider>,
    );

    expect(getByTestId('button')).toBeTruthy();
  });

  it('should display title text', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Button title="Login" />
      </ThemeProvider>,
    );

    expect(getByText('Login')).toBeTruthy();
  });

  it('should display any title text', () => {
    const randomTitle = Math.random().toString(36).substring(7);
    const { getByText } = render(
      <ThemeProvider>
        <Button title={randomTitle} />
      </ThemeProvider>,
    );

    expect(getByText(randomTitle)).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <Button title="Test" onPress={onPressMock} />
      </ThemeProvider>,
    );

    fireEvent.press(getByTestId('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should apply theme colors for primary variant', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Button title="Test" variant="primary" />
      </ThemeProvider>,
    );

    const button = getByTestId('button');
    const text = getByTestId('button-text');

    // Primary button should use primary color
    expect(button.props.style).toMatchObject({
      backgroundColor: themes[THEME_NAMES.LIGHT].primary,
    });
    
    // Text should be white on primary
    expect(text.props.style).toMatchObject({
      color: '#FFFFFF',
    });
  });
});
