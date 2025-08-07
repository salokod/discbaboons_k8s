/**
 * ResetPasswordScreen Component Tests
 */

import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import ResetPasswordScreen from '../../src/screens/ResetPasswordScreen';

// Mock the HapticService functions
jest.mock('../../src/services/hapticService', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerErrorHaptic: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    email: 'test@example.com',
  },
};

const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a ResetPasswordScreen component', () => {
    const ResetPasswordScreenModule = require('../../src/screens/ResetPasswordScreen');

    expect(ResetPasswordScreenModule.default).toBeDefined();
    expect(typeof ResetPasswordScreenModule.default).toBe('function');
  });

  it('should render with theme support', () => {
    const { getByTestId } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByTestId('reset-password-screen')).toBeTruthy();
  });

  it('should display screen title and instructions with email', () => {
    const { getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByText('Create New Password')).toBeTruthy();
    expect(getByText('Enter the 6-digit code sent to test@example.com and create your new password')).toBeTruthy();
  });

  it('should display generic instructions when email is not provided', () => {
    const routeWithoutEmail = { params: {} };
    const { getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={routeWithoutEmail} />,
    );

    expect(getByText('Enter your verification code and create a new password')).toBeTruthy();
  });

  it('should have verification code input field', () => {
    const { getByTestId } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />,
    );

    // Should have 6 digit inputs
    for (let i = 0; i < 6; i += 1) {
      expect(getByTestId(`code-input-${i}`)).toBeTruthy();
    }
  });

  it('should have new password input field', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByPlaceholderText('Enter new password')).toBeTruthy();
  });

  it('should have confirm password input field', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByPlaceholderText('Confirm new password')).toBeTruthy();
  });

  it('should have update password button', () => {
    const { getByText } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByText('Update Password')).toBeTruthy();
  });

  it('should disable update password button when form is invalid', () => {
    const { getByTestId } = renderWithTheme(
      <ResetPasswordScreen navigation={mockNavigation} route={mockRoute} />,
    );

    const updateButton = getByTestId('button');
    expect(updateButton.props.accessibilityState.disabled).toBe(true);
  });
});
