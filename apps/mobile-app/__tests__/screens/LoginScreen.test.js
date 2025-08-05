/**
 * LoginScreen Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import LoginScreen from '../../src/screens/LoginScreen';

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

  it('should call login function when valid form is submitted', () => {
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

    // Verify login was called with expected user data
    expect(mockLogin).toHaveBeenCalledWith({
      user: { username: 'testuser' },
      tokens: { access: 'mock-jwt-token' },
    });
  });

  it('should authenticate user when login button is pressed', () => {
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

    // Fill in form data
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'testpass');

    // Press login button
    const loginButton = getByText('Log In');
    fireEvent.press(loginButton);

    // Verify login was called with user data
    expect(mockLogin).toHaveBeenCalledWith({
      user: { username: 'testuser' },
      tokens: { access: 'mock-jwt-token' },
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
});
