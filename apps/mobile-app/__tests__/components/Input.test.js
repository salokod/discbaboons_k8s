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
        <Input onChangeText={() => {}} />
      </ThemeProvider>,
    );

    expect(getByTestId('input')).toBeTruthy();
  });

  it('should accept placeholder prop', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <Input placeholder="Enter username" onChangeText={() => {}} />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Enter username')).toBeTruthy();
  });

  it('should accept value prop', () => {
    const { getByDisplayValue } = render(
      <ThemeProvider>
        <Input value="test123" onChangeText={() => {}} />
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

  describe('Platform-Specific Styling', () => {
    const originalPlatform = require('react-native').Platform.OS;
    const originalSelect = require('react-native').Platform.select;

    afterEach(() => {
      require('react-native').Platform.OS = originalPlatform;
      require('react-native').Platform.select = originalSelect;
    });

    it('should apply iOS-specific border styling', () => {
      require('react-native').Platform.OS = 'ios';
      require('react-native').Platform.select = (obj) => obj.ios;

      const { getByTestId } = render(
        <ThemeProvider>
          <Input onChangeText={() => {}} />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.style.borderWidth).toBe(1);
      expect(input.props.style.borderRadius).toBe(8);
    });

    it('should apply Android-specific styling', () => {
      require('react-native').Platform.OS = 'android';
      require('react-native').Platform.select = (obj) => obj.android;

      const { getByTestId } = render(
        <ThemeProvider>
          <Input onChangeText={() => {}} />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.style.borderWidth).toBe(0);
      expect(input.props.style.borderRadius).toBe(12);
      expect(input.props.style.elevation).toBe(1);
    });

    it('should render consistently across platforms', () => {
      // Test iOS
      require('react-native').Platform.OS = 'ios';
      require('react-native').Platform.select = (obj) => obj.ios;
      const { getByTestId: getByTestIdIOS } = render(
        <ThemeProvider>
          <Input placeholder="Test iOS" onChangeText={() => {}} />
        </ThemeProvider>,
      );

      // Test Android
      require('react-native').Platform.OS = 'android';
      require('react-native').Platform.select = (obj) => obj.android;
      const { getByTestId: getByTestIdAndroid } = render(
        <ThemeProvider>
          <Input placeholder="Test Android" onChangeText={() => {}} />
        </ThemeProvider>,
      );

      // Both should have the same functional behavior
      expect(getByTestIdIOS('input').props.placeholder).toBe('Test iOS');
      expect(getByTestIdAndroid('input').props.placeholder).toBe('Test Android');
    });
  });

  describe('Accessibility', () => {
    it('should use placeholder as default accessibilityLabel', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input placeholder="Username" onChangeText={() => {}} />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.accessibilityLabel).toBe('Username');
    });

    it('should accept custom accessibilityLabel', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Username"
            accessibilityLabel="Enter your username"
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.accessibilityLabel).toBe('Enter your username');
    });

    it('should have default accessibilityHint for text fields', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input placeholder="Username" onChangeText={() => {}} />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.accessibilityHint).toBe('Text input field');
    });

    it('should have default accessibilityHint for password fields', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.accessibilityHint).toBe('Password input field');
    });

    it('should accept custom accessibilityHint', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Username"
            accessibilityHint="Enter your DiscBaboons username"
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.accessibilityHint).toBe('Enter your DiscBaboons username');
    });
  });
});
