/**
 * Button Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/Button';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { themes, THEME_NAMES } from '../../src/design-system/themes';

describe('Button component', () => {
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
      color: themes[THEME_NAMES.LIGHT].textOnPrimary,
    });
  });

  it('should render destructive variant with red styling', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Button title="Delete" variant="destructive" />
      </ThemeProvider>,
    );

    const button = getByTestId('button');
    const text = getByTestId('button-text');

    // Destructive button should use error color
    expect(button.props.style).toMatchObject({
      backgroundColor: themes[THEME_NAMES.LIGHT].error,
    });

    // Text should be white on destructive
    expect(text.props.style).toMatchObject({
      color: themes[THEME_NAMES.LIGHT].textOnPrimary,
    });
  });

  it('should render outline variant with transparent background and primary border', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Button title="Test" variant="outline" />
      </ThemeProvider>,
    );

    const button = getByTestId('button');
    const text = getByTestId('button-text');

    // Outline button should have transparent background
    expect(button.props.style).toMatchObject({
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: themes[THEME_NAMES.LIGHT].primary,
    });

    // Text should be primary color
    expect(text.props.style).toMatchObject({
      color: themes[THEME_NAMES.LIGHT].primary,
    });
  });

  describe('Platform-Specific Styling', () => {
    const originalPlatform = require('react-native').Platform.OS;
    const originalSelect = require('react-native').Platform.select;

    afterEach(() => {
      require('react-native').Platform.OS = originalPlatform;
      require('react-native').Platform.select = originalSelect;
    });

    it('should apply iOS-specific border radius', () => {
      require('react-native').Platform.OS = 'ios';
      require('react-native').Platform.select = (obj) => obj.ios;

      const { getByTestId } = render(
        <ThemeProvider>
          <Button title="Test" onPress={() => {}} />
        </ThemeProvider>,
      );

      const button = getByTestId('button');
      expect(button.props.style.borderRadius).toBe(8);
    });

    it('should apply Android-specific border radius', () => {
      require('react-native').Platform.OS = 'android';
      require('react-native').Platform.select = (obj) => obj.android;

      const { getByTestId } = render(
        <ThemeProvider>
          <Button title="Test" onPress={() => {}} />
        </ThemeProvider>,
      );

      const button = getByTestId('button');
      expect(button.props.style.borderRadius).toBe(12);
    });

    it('should apply Android elevation when not disabled', () => {
      require('react-native').Platform.OS = 'android';
      require('react-native').Platform.select = (obj) => obj.android;

      const { getByTestId } = render(
        <ThemeProvider>
          <Button title="Test" onPress={() => {}} />
        </ThemeProvider>,
      );

      const button = getByTestId('button');
      expect(button.props.style.elevation).toBe(2);
    });

    it('should remove elevation when disabled on Android', () => {
      require('react-native').Platform.OS = 'android';
      require('react-native').Platform.select = (obj) => obj.android;

      const { getByTestId } = render(
        <ThemeProvider>
          <Button title="Test" onPress={() => {}} disabled />
        </ThemeProvider>,
      );

      const button = getByTestId('button');
      expect(button.props.style.elevation).toBe(0);
    });
  });

  it('should accept and apply custom style prop', () => {
    const customStyle = { width: 100, marginTop: 10 };
    const { getByTestId } = render(
      <ThemeProvider>
        <Button title="Test" style={customStyle} />
      </ThemeProvider>,
    );

    const button = getByTestId('button');
    expect(button.props.style).toMatchObject(customStyle);
  });

  it('should have minimum 48px height for mobile touch targets', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Button title="Test" />
      </ThemeProvider>,
    );

    const button = getByTestId('button');
    expect(button.props.style.minHeight).toBe(48);
  });
});
