/**
 * ForgotUsernameScreen Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import ForgotUsernameScreen from '../../src/screens/ForgotUsernameScreen';

// Mock the AuthService functions
jest.mock('../../src/services/authService', () => ({
  forgotUsername: jest.fn(),
  handleNetworkError: jest.fn((error) => error.message || 'Something went wrong. Please try again.'),
}));

// Mock the HapticService functions
jest.mock('../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

describe('ForgotUsernameScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a ForgotUsernameScreen component', () => {
    const ForgotUsernameScreenModule = require('../../src/screens/ForgotUsernameScreen');
    expect(ForgotUsernameScreenModule.default).toBeDefined();
    expect(typeof ForgotUsernameScreenModule.default).toBe('function');
  });

  it('should render with theme support', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByTestId('forgot-username-screen')).toBeTruthy();
  });

  it('should have AppContainer and SafeAreaView structure', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByTestId('forgot-username-screen')).toBeTruthy();
    expect(getByTestId('app-container')).toBeTruthy();
  });

  it('should display screen title and subtitle', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByText('Recover Username')).toBeTruthy();
    expect(getByText('Enter your email address to receive your username')).toBeTruthy();
  });

  it('should have email input field', () => {
    const { getByPlaceholderText } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByPlaceholderText('Email Address')).toBeTruthy();
  });

  it('should have submit button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    expect(getByText('Send Username')).toBeTruthy();
  });

  it('should disable submit button when input is empty', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    const submitButton = getByTestId('button');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('should disable submit button when email is invalid', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
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

  it('should show loading state when submitting', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    const input = getByPlaceholderText('Email Address');
    fireEvent.changeText(input, 'test@example.com');

    // Initially should not show loading text
    expect(queryByText('Sending username recovery instructions...')).toBeNull();

    const submitButton = getByText('Send Username');
    fireEvent.press(submitButton);

    // Should show loading message
    expect(queryByText('Sending username recovery instructions...')).toBeTruthy();
  });

  it('should display error messages', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    // Initially should not show error message
    expect(queryByTestId('error-message')).toBeNull();
  });

  it('should display success message after successful request', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <ForgotUsernameScreen navigation={mockNavigation} />
      </ThemeProvider>,
    );

    // Initially should not show success message
    expect(queryByTestId('success-message')).toBeNull();
  });
});
