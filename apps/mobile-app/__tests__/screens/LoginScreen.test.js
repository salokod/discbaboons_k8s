/**
 * LoginScreen Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import LoginScreen from '../../src/screens/LoginScreen';

// Mock the AuthService functions
jest.mock('../../src/services/authService', () => ({
  login: jest.fn(),
  handleNetworkError: jest.fn((error) => error.message || 'Something went wrong. Please try again.'),
}));

// Mock the HapticService functions
jest.mock('../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

describe('LoginScreen', () => {
  it('should export a LoginScreen component', () => {
    const LoginScreenModule = require('../../src/screens/LoginScreen');

    expect(LoginScreenModule.default).toBeDefined();
    expect(typeof LoginScreenModule.default).toBe('function');
  });

  it('should render with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(getByTestId('login-screen')).toBeTruthy();
  });

  it('should display the DiscBaboons logo', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(getByTestId('logo-image')).toBeTruthy();
  });

  it('should have username input field', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Username')).toBeTruthy();
  });

  it('should have password input field', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('should have login button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(getByText('Log In')).toBeTruthy();
  });

  it('should hide password text with secureTextEntry', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    const passwordInput = getByPlaceholderText('Password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('should not hide username text', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    const usernameInput = getByPlaceholderText('Username');
    expect(usernameInput.props.secureTextEntry).toBeFalsy();
  });

  it('should call login function when valid form is submitted', async () => {
    // Mock successful API response
    const { login: authLogin } = require('../../src/services/authService');
    const mockApiResponse = {
      user: { id: 123, username: 'testuser' },
      tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
    };
    authLogin.mockResolvedValueOnce(mockApiResponse);

    // Create a mock login function to track calls
    const mockLogin = jest.fn();

    // Create a custom AuthProvider that provides our mock login function
    function TestAuthProvider({ children }) {
      const contextValue = {
        isAuthenticated: false,
        user: null,
        tokens: null,
        login: mockLogin,
        logout: jest.fn(),
      };

      return React.createElement(
        require('../../src/context/AuthContext').AuthContext.Provider,
        { value: contextValue },
        children,
      );
    }

    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <TestAuthProvider>
          <LoginScreen />
        </TestAuthProvider>
      </ThemeProvider>,
    );

    // Fill in form data with valid data
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'validpass123');

    // Press login button
    const loginButton = getByText('Log In');
    fireEvent.press(loginButton);

    // Wait for async operation
    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledWith('testuser', 'validpass123');
      expect(mockLogin).toHaveBeenCalledWith(mockApiResponse);
    });
  });

  it('should show loading state during login', async () => {
    // Mock API call that takes time
    const { login: authLogin } = require('../../src/services/authService');
    authLogin.mockImplementation(() => new Promise((resolve) => {
      setTimeout(resolve, 100);
    }));

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    // Fill in form data
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'validpass123');

    // Press login button
    const loginButton = getByText('Log In');
    fireEvent.press(loginButton);

    // Should show loading state
    expect(getByText('Logging in...')).toBeTruthy();

    // Button should be disabled during loading (check the actual button element)
    const buttonElement = getByTestId('button');
    expect(buttonElement.props.accessibilityState?.disabled).toBe(true);
  });

  it('should handle login errors', async () => {
    // Mock API error
    const { login: authLogin, handleNetworkError } = require('../../src/services/authService');
    const error = new Error('Invalid username or password');
    authLogin.mockRejectedValueOnce(error);
    handleNetworkError.mockReturnValueOnce('Invalid username or password');

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <ThemeProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </ThemeProvider>,
    );

    // Fill in form data
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'wrongpass');

    // Press login button
    const loginButton = getByText('Log In');
    fireEvent.press(loginButton);

    // Wait for error to show
    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
      expect(getByText('Invalid username or password')).toBeTruthy();
    });
  });

  describe('Error Display', () => {
    it('should not display error message initially', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(queryByTestId('error-message')).toBeNull();
    });

    it('should display error message with theme-aware styling', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen errorMessage="Invalid username or password" />
          </AuthProvider>
        </ThemeProvider>,
      );

      const errorMessage = getByTestId('error-message');
      expect(errorMessage).toBeTruthy();

      const errorText = getByText('Invalid username or password');
      expect(errorText).toBeTruthy();

      // Verify theme-aware styling (error background color)
      expect(errorMessage.props.style.backgroundColor).toBeDefined();
    });

    it('should hide error message when errorMessage prop is null', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen errorMessage={null} />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(queryByTestId('error-message')).toBeNull();
    });
  });

  describe('Tab Interface', () => {
    it('should display Sign In and Sign Up tabs', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });

    it('should have Sign In tab active by default', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const signInTab = getByTestId('tab-sign-in');
      const signUpTab = getByTestId('tab-sign-up');

      expect(signInTab.props.style.backgroundColor).toBeDefined();
      expect(signUpTab.props.style.backgroundColor).not.toEqual(
        signInTab.props.style.backgroundColor,
      );
    });

    it('should switch to Sign Up tab when pressed', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const signUpTab = getByText('Sign Up');
      fireEvent.press(signUpTab);

      // Should show Create Account button instead of Log In
      expect(getByText('Create Account')).toBeTruthy();
    });

    it('should show forgot links only on Sign In tab', () => {
      const { getByText, queryByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      // Initially on Sign In - should show forgot links
      expect(queryByText('Forgot username?')).toBeTruthy();
      expect(queryByText('Forgot password?')).toBeTruthy();

      // Switch to Sign Up
      const signUpTab = getByText('Sign Up');
      fireEvent.press(signUpTab);

      // Should hide forgot links
      expect(queryByText('Forgot username?')).toBeNull();
      expect(queryByText('Forgot password?')).toBeNull();
    });
  });

  describe('Footer Links', () => {
    it('should display Privacy Policy link', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('Privacy Policy')).toBeTruthy();
    });

    it('should display Terms of Service link', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('Terms of Service')).toBeTruthy();
    });

    it('should display Support link', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('Support')).toBeTruthy();
    });

    it('should display copyright text', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('© 2025 DiscBaboons')).toBeTruthy();
    });

    it('should handle privacy policy link press', () => {
      const mockOnPrivacyPolicy = jest.fn();

      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen onPrivacyPolicy={mockOnPrivacyPolicy} />
          </AuthProvider>
        </ThemeProvider>,
      );

      const privacyLink = getByText('Privacy Policy');
      fireEvent.press(privacyLink);

      expect(mockOnPrivacyPolicy).toHaveBeenCalled();
    });
  });

  describe('Secondary Actions', () => {
    it('should display forgot password link', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('Forgot password?')).toBeTruthy();
    });

    it('should display forgot username link', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByText('Forgot username?')).toBeTruthy();
    });

    it('should handle forgot password link press', () => {
      const mockNavigation = jest.fn();

      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen onForgotPassword={mockNavigation} />
          </AuthProvider>
        </ThemeProvider>,
      );

      const forgotPasswordLink = getByText('Forgot password?');
      fireEvent.press(forgotPasswordLink);

      expect(mockNavigation).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should disable login button initially when form is empty', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const loginButton = getByTestId('button');

      expect(loginButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should disable login button when username is too short', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('button');

      // Valid password, invalid username (too short)
      fireEvent.changeText(usernameInput, 'abc'); // 3 chars (min is 4)
      fireEvent.changeText(passwordInput, 'validPassword123!');

      expect(loginButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should disable login button when username is too long', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('button');

      // Valid password, invalid username (too long)
      fireEvent.changeText(usernameInput, 'a'.repeat(21)); // 21 chars (max is 20)
      fireEvent.changeText(passwordInput, 'validPassword123!');

      expect(loginButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should disable login button when password is too short', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('button');

      // Valid username, invalid password (too short)
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'short1!'); // 7 chars (min is 8)

      expect(loginButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should disable login button when password is too long', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('button');

      // Valid username, invalid password (too long)
      fireEvent.changeText(usernameInput, 'testuser');
      fireEvent.changeText(passwordInput, 'a'.repeat(33)); // 33 chars (max is 32)

      expect(loginButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should enable login button when both username and password are valid', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('button');

      // Valid username and password
      fireEvent.changeText(usernameInput, 'testuser'); // 8 chars (4-20 range)
      fireEvent.changeText(passwordInput, 'validPassword123!'); // 17 chars (8-32 range)

      expect(loginButton.props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('Platform-Specific Styling', () => {
    const originalPlatform = require('react-native').Platform.OS;
    const originalSelect = require('react-native').Platform.select;

    afterEach(() => {
      require('react-native').Platform.OS = originalPlatform;
      require('react-native').Platform.select = originalSelect;
    });

    it('should apply iOS-specific styles', () => {
      require('react-native').Platform.OS = 'ios';
      require('react-native').Platform.select = (obj) => obj.ios;

      const { getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const loginScreen = getByTestId('login-screen');
      expect(loginScreen).toBeTruthy();

      // iOS should use SafeAreaView without extra padding
      expect(loginScreen.props.style.paddingTop).toBeUndefined();
    });

    it('should apply Android-specific styles', () => {
      require('react-native').Platform.OS = 'android';
      require('react-native').Platform.select = (obj) => obj.android;

      const { getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const loginScreen = getByTestId('login-screen');
      expect(loginScreen).toBeTruthy();

      // Android should have StatusBar padding
      expect(loginScreen.props.style.paddingTop).toBe(40);
    });

    it('should render consistently across platforms', () => {
      // Test iOS
      require('react-native').Platform.OS = 'ios';
      require('react-native').Platform.select = (obj) => obj.ios;
      const { getByTestId: getByTestIdIOS } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      // Test Android
      require('react-native').Platform.OS = 'android';
      require('react-native').Platform.select = (obj) => obj.android;
      const { getByTestId: getByTestIdAndroid } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      // Both should have all the same functional elements
      expect(getByTestIdIOS('login-screen')).toBeTruthy();
      expect(getByTestIdAndroid('login-screen')).toBeTruthy();
      expect(getByTestIdIOS('logo-image')).toBeTruthy();
      expect(getByTestIdAndroid('logo-image')).toBeTruthy();
      expect(getByTestIdIOS('tab-sign-in')).toBeTruthy();
      expect(getByTestIdAndroid('tab-sign-in')).toBeTruthy();
    });
  });

  describe('Input Keyboard Configuration', () => {
    it('should configure username input for optimal typing experience', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');
      expect(usernameInput.props.autoCapitalize).toBe('none');
      expect(usernameInput.props.autoCorrect).toBe(false);
      expect(usernameInput.props.spellCheck).toBe(false);
      expect(usernameInput.props.textContentType).toBe('username');
    });

    it('should configure password input with textContentType', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');
      expect(passwordInput.props.textContentType).toBe('password');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should allow username input with mixed case typing', () => {
      const { getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const usernameInput = getByPlaceholderText('Username');

      // Simulate typing mixed case username
      fireEvent.changeText(usernameInput, 'TestUser');

      // Input should preserve the case as typed
      expect(usernameInput.props.value).toBe('TestUser');

      // But autoCapitalize should be 'none' to prevent auto-capitalization
      expect(usernameInput.props.autoCapitalize).toBe('none');
    });
  });

  describe('Haptic Feedback Integration', () => {
    let mockAuthService;
    let mockHapticService;

    beforeEach(() => {
      mockAuthService = require('../../src/services/authService');
      mockHapticService = require('../../src/services/hapticService');

      // Clear all previous mock calls
      mockAuthService.login.mockClear();
      mockHapticService.triggerSuccessHaptic.mockClear();
      mockHapticService.triggerErrorHaptic.mockClear();
    });

    it('should trigger success haptic on successful login', async () => {
      const mockLoginResponse = {
        user: { id: 1, username: 'testuser' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      const { getByText, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      // Fill in form
      fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      // Submit form
      const loginButton = getByText('Log In');
      fireEvent.press(loginButton);

      // Wait for async operation
      await waitFor(() => {
        expect(mockHapticService.triggerSuccessHaptic).toHaveBeenCalledTimes(1);
      });
    });

    it('should trigger error haptic on failed login', async () => {
      const mockError = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValueOnce(mockError);
      mockAuthService.handleNetworkError.mockReturnValueOnce('Invalid username or password');

      const { getByText, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      // Fill in form
      fireEvent.changeText(getByPlaceholderText('Username'), 'wronguser');
      fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');

      // Submit form
      const loginButton = getByText('Log In');
      fireEvent.press(loginButton);

      // Wait for async operation
      await waitFor(() => {
        expect(mockHapticService.triggerErrorHaptic).toHaveBeenCalledTimes(1);
      });
    });

    it('should not trigger haptic feedback when form is invalid', () => {
      const { getByText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      // Try to submit with empty form (button should be disabled)
      getByText('Log In');

      // Button should be disabled, so no haptic feedback should occur
      expect(mockHapticService.triggerSuccessHaptic).not.toHaveBeenCalled();
      expect(mockHapticService.triggerErrorHaptic).not.toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should show password visibility toggle button', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      expect(getByTestId('password-toggle')).toBeTruthy();
    });

    it('should toggle password visibility when toggle button is pressed', () => {
      const {
        getByTestId, getByPlaceholderText,
      } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');
      const toggleButton = getByTestId('password-toggle');

      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Press toggle to show password
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Press toggle to hide password again
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should maintain password toggle state during form validation', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');
      const toggleButton = getByTestId('password-toggle');

      // Show password first
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Enter invalid password (too short) to trigger validation
      fireEvent.changeText(passwordInput, '123');

      // Toggle state should be maintained after validation
      expect(passwordInput.props.secureTextEntry).toBe(false);
    });

    it('should have proper accessibility labels for password toggle', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
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

    it('should allow password entry and toggle functionality together', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <ThemeProvider>
          <AuthProvider>
            <LoginScreen />
          </AuthProvider>
        </ThemeProvider>,
      );

      const passwordInput = getByPlaceholderText('Password');
      const toggleButton = getByTestId('password-toggle');

      // Enter password while hidden
      fireEvent.changeText(passwordInput, 'testpassword123');
      expect(passwordInput.props.value).toBe('testpassword123');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Show password
      fireEvent.press(toggleButton);
      expect(passwordInput.props.value).toBe('testpassword123');
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Continue typing while visible
      fireEvent.changeText(passwordInput, 'testpassword123!');
      expect(passwordInput.props.value).toBe('testpassword123!');
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Hide password again
      fireEvent.press(toggleButton);
      expect(passwordInput.props.value).toBe('testpassword123!');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });
});
