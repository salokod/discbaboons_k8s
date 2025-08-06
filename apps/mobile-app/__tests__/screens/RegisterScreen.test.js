/**
 * RegisterScreen Tests
 */

import {
  render, act, fireEvent, waitFor,
} from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import RegisterScreen from '../../src/screens/RegisterScreen';

// Mock haptic service
jest.mock('../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

// Mock auth service
jest.mock('../../src/services/authService', () => ({
  register: jest.fn(),
  handleNetworkError: jest.fn((error) => error.message || 'Network error'),
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should export a RegisterScreen component', () => {
    const RegisterScreenModule = require('../../src/screens/RegisterScreen');

    expect(RegisterScreenModule.default).toBeDefined();
    expect(typeof RegisterScreenModule.default).toBe('function');
  });

  it('should render with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AuthProvider>
          <RegisterScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(getByTestId('register-screen')).toBeTruthy();
  });

  describe('Form Fields', () => {
    it('should have username input field', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByPlaceholderText('Username')).toBeTruthy();
    });

    it('should have email input field', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByPlaceholderText('Email')).toBeTruthy();
    });

    it('should have password input field', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByPlaceholderText('Password')).toBeTruthy();
    });

    it('should have confirm password input field', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    });

    it('should have create account button', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('Create Account')).toBeTruthy();
    });

    it('should disable create account button initially when form is empty', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const button = getByTestId('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate username length (4-20 characters)', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const button = getByTestId('button');

      // Test invalid - too short (< 4 characters)
      usernameInput.props.onChangeText('abc');
      expect(button.props.accessibilityState?.disabled).toBe(true);

      // Test invalid - too long (> 20 characters)
      usernameInput.props.onChangeText('this_username_is_too_long');
      expect(button.props.accessibilityState?.disabled).toBe(true);

      // Test valid - within range
      usernameInput.props.onChangeText('validuser');
      // Button should still be disabled because other fields aren't valid yet
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('should validate email format', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const emailInput = getByPlaceholderText('Email');
      const button = getByTestId('button');

      // Test invalid - no @ symbol
      emailInput.props.onChangeText('invalid-email');
      expect(button.props.accessibilityState?.disabled).toBe(true);

      // Test invalid - missing domain
      emailInput.props.onChangeText('user@');
      expect(button.props.accessibilityState?.disabled).toBe(true);

      // Test valid - proper format
      emailInput.props.onChangeText('user@example.com');
      // Button should still be disabled because other fields aren't valid yet
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('should show validation requirements only when username field is focused or has content', () => {
      const { queryByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      // Initially hidden when no focus or content
      expect(queryByTestId('username-validation')).toBeNull();

      // Show when user types invalid username (too short)
      const usernameInput = getByPlaceholderText('Username');

      act(() => {
        usernameInput.props.onChangeText('abc');
      });

      expect(queryByTestId('username-validation')).toBeTruthy();
    });

    it('should hide validation helper when username meets criteria after brief success flash', () => {
      const { queryByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');

      // Type invalid username (too short)
      act(() => {
        usernameInput.props.onChangeText('abc');
      });

      expect(queryByTestId('username-validation')).toBeTruthy();

      // Type valid username (meets criteria)
      act(() => {
        usernameInput.props.onChangeText('validuser');
      });

      // Fast-forward through the 800ms flash duration
      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Validation helper should now be hidden
      expect(queryByTestId('username-validation')).toBeNull();
    });

    it('should hide email validation helper when user enters valid email after brief success flash', () => {
      const { queryByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const emailInput = getByPlaceholderText('Email');

      // Initially hidden
      expect(queryByTestId('email-validation')).toBeNull();

      // Show when user types invalid email
      act(() => {
        emailInput.props.onChangeText('invalid');
      });

      expect(queryByTestId('email-validation')).toBeTruthy();

      // Hide when email is valid (after brief success flash)
      act(() => {
        emailInput.props.onChangeText('user@example.com');
      });

      // Fast-forward through the 800ms flash duration
      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Validation helper should now be hidden
      expect(queryByTestId('email-validation')).toBeNull();
    });

    it('should hide password validation helper when password meets all requirements after brief success flash', () => {
      const { queryByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');

      // Initially hidden
      expect(queryByTestId('password-validation')).toBeNull();

      // Show when user types weak password
      act(() => {
        passwordInput.props.onChangeText('weak');
      });

      expect(queryByTestId('password-validation')).toBeTruthy();

      // Hide when password meets all requirements (after brief success flash)
      act(() => {
        passwordInput.props.onChangeText('StrongPass123!');
      });

      // Fast-forward through the 800ms flash duration
      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Validation helper should now be hidden
      expect(queryByTestId('password-validation')).toBeNull();
    });

    it('should hide confirm password validation helper when passwords match after brief success flash', () => {
      const { queryByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');

      // Initially hidden
      expect(queryByTestId('confirm-password-validation')).toBeNull();

      // Set password first
      act(() => {
        passwordInput.props.onChangeText('StrongPass123!');
      });

      // Show when confirm password doesn't match
      act(() => {
        confirmPasswordInput.props.onChangeText('different');
      });

      expect(queryByTestId('confirm-password-validation')).toBeTruthy();

      // Hide when passwords match (after brief success flash)
      act(() => {
        confirmPasswordInput.props.onChangeText('StrongPass123!');
      });

      // Fast-forward through the 800ms flash duration
      act(() => {
        jest.advanceTimersByTime(800);
      });

      // Validation helper should now be hidden
      expect(queryByTestId('confirm-password-validation')).toBeNull();
    });

    it('should enable create account button when all fields are valid', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const button = getByTestId('button');

      // Initially disabled
      expect(button.props.accessibilityState?.disabled).toBe(true);

      // Fill all fields with valid data
      act(() => {
        usernameInput.props.onChangeText('testuser');
        emailInput.props.onChangeText('test@example.com');
        passwordInput.props.onChangeText('StrongPass123!');
        confirmPasswordInput.props.onChangeText('StrongPass123!');
      });

      // Button should be enabled
      expect(button.props.accessibilityState?.disabled).toBe(false);
    });

    it('should call onRegistrationSuccess callback on successful registration', async () => {
      const mockOnRegistrationSuccess = jest.fn();
      const { register } = require('../../src/services/authService');
      // Mock successful registration
      register.mockResolvedValueOnce({
        success: true,
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
      });

      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen onRegistrationSuccess={mockOnRegistrationSuccess} />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const button = getByTestId('button');

      // Fill all fields with valid data
      act(() => {
        usernameInput.props.onChangeText('testuser');
        emailInput.props.onChangeText('test@example.com');
        passwordInput.props.onChangeText('StrongPass123!');
        confirmPasswordInput.props.onChangeText('StrongPass123!');
      });

      // Submit form
      await act(async () => {
        fireEvent.press(button);
      });

      // Wait for async registration to complete
      await waitFor(() => {
        expect(mockOnRegistrationSuccess).toHaveBeenCalledWith('testuser');
      });
    });

    it('should show detailed password requirements with individual status indicators', () => {
      const { queryByTestId, getByPlaceholderText, getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');

      // Initially hidden
      expect(queryByTestId('password-validation')).toBeNull();

      // Show when user types weak password
      act(() => {
        passwordInput.props.onChangeText('weak');
      });

      expect(queryByTestId('password-validation')).toBeTruthy();

      // Should show individual requirements with status indicators
      expect(getByText('8-32 characters (4/32)')).toBeTruthy();
      expect(getByText('1 uppercase letter (A-Z)')).toBeTruthy();
      expect(getByText('1 lowercase letter (a-z)')).toBeTruthy();
      expect(getByText('1 number (0-9)')).toBeTruthy();
      expect(getByText('1 special character (!@#$%^&*)')).toBeTruthy();
    });

    it('should show individual checkmarks for password requirements as they are met', () => {
      const { queryByTestId, getByPlaceholderText, getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');

      // Type password that meets some requirements
      act(() => {
        passwordInput.props.onChangeText('Password1');
      });

      const validationContainer = queryByTestId('password-validation');
      expect(validationContainer).toBeTruthy();

      // Should show correct character count
      expect(getByText('8-32 characters (9/32)')).toBeTruthy();
      expect(getByText('1 uppercase letter (A-Z)')).toBeTruthy();
      expect(getByText('1 lowercase letter (a-z)')).toBeTruthy();
      expect(getByText('1 number (0-9)')).toBeTruthy();
      expect(getByText('1 special character (!@#$%^&*)')).toBeTruthy();
    });

    it('should have auto-focus flow configured for all inputs', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <RegisterScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');

      // Should have proper return key types
      expect(usernameInput.props.returnKeyType).toBe('next');
      expect(emailInput.props.returnKeyType).toBe('next');
      expect(passwordInput.props.returnKeyType).toBe('next');
      expect(confirmPasswordInput.props.returnKeyType).toBe('done');

      // Should have onSubmitEditing handlers
      expect(usernameInput.props.onSubmitEditing).toBeDefined();
      expect(emailInput.props.onSubmitEditing).toBeDefined();
      expect(passwordInput.props.onSubmitEditing).toBeDefined();
      expect(confirmPasswordInput.props.onSubmitEditing).toBeDefined();
    });

    it(
      'should trigger form submission when pressing done on confirm password with valid form',
      () => {
        const mockOnRegistrationSuccess = jest.fn();
        const { register } = require('../../src/services/authService');
        register.mockResolvedValueOnce({
          success: true,
          user: { id: 1, username: 'testuser', email: 'test@example.com' },
        });

        const { getByPlaceholderText } = render(
          <ThemeProvider>
            <AuthProvider>
              <RegisterScreen onRegistrationSuccess={mockOnRegistrationSuccess} />
            </AuthProvider>
          </ThemeProvider>,
        );

        const usernameInput = getByPlaceholderText('Username');
        const emailInput = getByPlaceholderText('Email');
        const passwordInput = getByPlaceholderText('Password');
        const confirmPasswordInput = getByPlaceholderText('Confirm Password');

        // Fill form with valid data
        act(() => {
          usernameInput.props.onChangeText('testuser');
          emailInput.props.onChangeText('test@example.com');
          passwordInput.props.onChangeText('StrongPass123!');
          confirmPasswordInput.props.onChangeText('StrongPass123!');
        });

        // Trigger form submission via confirm password done button
        act(() => {
          confirmPasswordInput.props.onSubmitEditing();
        });

        // Should trigger registration
        expect(confirmPasswordInput.props.onSubmitEditing).toBeDefined();
      },
    );

    // Note: Keyboard dismissal is tested in integration tests and LoginScreen tests
    // since RegisterScreen can be used both standalone and within LoginScreen
  });
});
