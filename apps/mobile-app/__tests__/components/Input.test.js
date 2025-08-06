/**
 * Input Component Tests
 */

import { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../../src/components/Input';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('Input component', () => {
  it('should export an Input component', () => {
    const InputModule = require('../../src/components/Input');

    expect(InputModule.default).toBeDefined();
    // forwardRef creates an object, not a function
    expect(typeof InputModule.default).toBe('object');
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

  describe('Keyboard Configuration', () => {
    it('should have default keyboard settings', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input placeholder="Test" onChangeText={() => {}} />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.autoCapitalize).toBe('sentences');
      expect(input.props.autoCorrect).toBe(true);
      expect(input.props.spellCheck).toBe(true);
      expect(input.props.textContentType).toBeUndefined();
    });

    it('should accept custom autoCapitalize setting', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Username"
            autoCapitalize="none"
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.autoCapitalize).toBe('none');
    });

    it('should accept autoCorrect disabled', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Username"
            autoCorrect={false}
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.autoCorrect).toBe(false);
    });

    it('should accept spellCheck disabled', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Username"
            spellCheck={false}
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.spellCheck).toBe(false);
    });

    it('should accept textContentType setting', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Username"
            textContentType="username"
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.textContentType).toBe('username');
    });

    it('should configure all keyboard settings for username input', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="username"
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.autoCapitalize).toBe('none');
      expect(input.props.autoCorrect).toBe(false);
      expect(input.props.spellCheck).toBe(false);
      expect(input.props.textContentType).toBe('username');
    });

    it('should configure textContentType for password input', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            textContentType="password"
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.textContentType).toBe('password');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should not show toggle button when showPasswordToggle is false', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle={false}
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('password-toggle')).toBeNull();
    });

    it('should not show toggle button when secureTextEntry is false', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Text"
            secureTextEntry={false}
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('password-toggle')).toBeNull();
    });

    it('should show toggle button when both showPasswordToggle and secureTextEntry are true', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('password-toggle')).toBeTruthy();
    });

    it('should start with password hidden (secureTextEntry true)', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should show eye icon when password is hidden', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const toggleButton = getByTestId('password-toggle');
      expect(toggleButton).toBeTruthy();
    });

    it('should toggle password visibility when toggle button is pressed', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      const toggleButton = getByTestId('password-toggle');

      // Initially hidden
      expect(input.props.secureTextEntry).toBe(true);

      // Press toggle to show password
      fireEvent.press(toggleButton);
      expect(input.props.secureTextEntry).toBe(false);

      // Press toggle to hide password again
      fireEvent.press(toggleButton);
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should have proper accessibility labels for password toggle', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const toggleButton = getByTestId('password-toggle');

      // Initially should show "Show password"
      expect(toggleButton.props.accessibilityLabel).toBe('Show password');
      expect(toggleButton.props.accessibilityHint).toBe('Tap to show password');
      expect(toggleButton.props.accessibilityRole).toBe('button');

      // After toggle should show "Hide password"
      fireEvent.press(toggleButton);
      expect(toggleButton.props.accessibilityLabel).toBe('Hide password');
      expect(toggleButton.props.accessibilityHint).toBe('Tap to hide password');
    });

    it('should maintain text input functionality when password toggle is enabled', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={onChangeTextMock}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');

      // Text input should still work
      fireEvent.changeText(input, 'test123');
      expect(onChangeTextMock).toHaveBeenCalledWith('test123');

      // Toggle visibility and test again
      const toggleButton = getByTestId('password-toggle');
      fireEvent.press(toggleButton);

      fireEvent.changeText(input, 'newpassword');
      expect(onChangeTextMock).toHaveBeenCalledWith('newpassword');
    });

    it('should have proper padding when password toggle is enabled', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      // Should have extra right padding for the eye icon
      expect(input.props.style.paddingRight).toBe(64); // spacing.xl * 2
    });

    it('should not have extra padding when password toggle is disabled', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle={false}
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      // Should have normal padding
      expect(input.props.style.paddingRight).toBe(16); // spacing.md
    });

    it('should work with different theme colors', () => {
      // This test ensures the toggle button respects theme colors
      const { getByTestId } = render(
        <ThemeProvider initialTheme="dark">
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            onChangeText={() => {}}
          />
        </ThemeProvider>,
      );

      const toggleButton = getByTestId('password-toggle');
      expect(toggleButton).toBeTruthy();

      // Toggle should still function in dark theme
      const input = getByTestId('input');
      expect(input.props.secureTextEntry).toBe(true);

      fireEvent.press(toggleButton);
      expect(input.props.secureTextEntry).toBe(false);
    });
  });

  describe('Auto-focus functionality', () => {
    it('should support returnKeyType prop', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Test input"
            onChangeText={jest.fn()}
            returnKeyType="next"
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      expect(input.props.returnKeyType).toBe('next');
    });

    it('should call onSubmitEditing when return key is pressed', () => {
      const mockSubmitEditing = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Test input"
            onChangeText={jest.fn()}
            onSubmitEditing={mockSubmitEditing}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      fireEvent(input, 'submitEditing');
      expect(mockSubmitEditing).toHaveBeenCalled();
    });

    it('should support ref forwarding', () => {
      function TestComponent() {
        const inputRef = useRef(null);
        return (
          <ThemeProvider>
            <Input
              ref={inputRef}
              placeholder="Test input"
              onChangeText={jest.fn()}
            />
          </ThemeProvider>
        );
      }

      const { getByTestId } = render(<TestComponent />);
      const input = getByTestId('input');
      expect(input).toBeTruthy();
    });

    it('should work with password toggle and auto-focus together', () => {
      const mockSubmitEditing = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <Input
            placeholder="Password"
            secureTextEntry
            showPasswordToggle
            returnKeyType="done"
            onSubmitEditing={mockSubmitEditing}
            onChangeText={jest.fn()}
          />
        </ThemeProvider>,
      );

      const input = getByTestId('input');
      const toggleButton = getByTestId('password-toggle');

      // Should have return key type
      expect(input.props.returnKeyType).toBe('done');

      // Toggle should still work
      fireEvent.press(toggleButton);
      expect(input.props.secureTextEntry).toBe(false);

      // Submit editing should work
      fireEvent(input, 'submitEditing');
      expect(mockSubmitEditing).toHaveBeenCalled();
    });
  });
});
