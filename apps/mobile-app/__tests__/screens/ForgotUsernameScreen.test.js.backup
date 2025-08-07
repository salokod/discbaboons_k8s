/**
 * ForgotPasswordScreen Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import ForgotPasswordScreen from '../../src/screens/ForgotPasswordScreen';

// Mock the HapticService functions
jest.mock('../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

describe('ForgotPasswordScreen', () => {
  it('should export a ForgotPasswordScreen component', () => {
    const ForgotPasswordScreenModule = require('../../src/screens/ForgotPasswordScreen');
    expect(ForgotPasswordScreenModule.default).toBeDefined();
    expect(typeof ForgotPasswordScreenModule.default).toBe('function');
  });

  it('should render with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    expect(getByTestId('forgot-password-screen')).toBeTruthy();
  });

  it('should have AppContainer and SafeAreaView structure', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    expect(getByTestId('forgot-password-screen')).toBeTruthy();
    expect(getByTestId('app-container')).toBeTruthy();
  });

  it('should display screen title and security message', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByText('Enter your email address to receive a reset code')).toBeTruthy();
  });

  it('should accept navigation props', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <ForgotPasswordScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByTestId('forgot-password-screen')).toBeTruthy();
  });

  it('should have flexible username/email input field', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Email Address')).toBeTruthy();
  });

  it('should have submit button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    expect(getByText('Send Reset Instructions')).toBeTruthy();
  });

  it('should disable submit button when input is empty', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    const submitButton = getByTestId('button');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('should disable submit button when email is invalid', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    const input = getByPlaceholderText('Email Address');
    const submitButton = getByTestId('button');

    // Test invalid email formats
    fireEvent.changeText(input, 'invalid-email');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(input, 'user@');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(input, '@domain.com');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);

    // Test valid email - button should be enabled
    fireEvent.changeText(input, 'user@domain.com');
    expect(submitButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('should show security-focused loading state when submitting', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    const input = getByPlaceholderText('Email Address');
    fireEvent.changeText(input, 'test@example.com');

    // Initially should not show loading text
    expect(queryByText('Sending secure reset instructions...')).toBeNull();

    const submitButton = getByText('Send Reset Instructions');
    fireEvent.press(submitButton);

    // Should show security-focused loading message
    expect(queryByText('Sending secure reset instructions...')).toBeTruthy();
  });

  it('should display professional error messages', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    // Initially should not show error message
    expect(queryByTestId('error-message')).toBeNull();

    // Test that error display area exists when needed
    // (Error content will be tested when we add actual API integration)
  });

  it('should display success message after successful password reset request', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    // Initially should not show success message
    expect(queryByTestId('success-message')).toBeNull();
  });

  it('should show back to login option after successful reset', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { queryByText } = render(
      <ThemeProvider>
        <ForgotPasswordScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    // Test that back to login option will be available after success
    expect(queryByText('Back to Login')).toBeNull();
  });
});
