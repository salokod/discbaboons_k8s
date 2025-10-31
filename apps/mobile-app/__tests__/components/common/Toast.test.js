/**
 * Toast Component Tests
 */

import {
  render, screen, act,
} from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import Toast from '../../../src/components/common/Toast';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Wrapper component with all necessary providers
function TestWrapper({ children }) {
  return (
    <NavigationContainer>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </NavigationContainer>
  );
}

describe('Toast', () => {
  afterEach(() => {
    // Ensure real timers are restored after each test
    jest.useRealTimers();
  });

  it('should export a component', () => {
    expect(Toast).toBeDefined();
    expect(typeof Toast).toBe('object'); // memo returns an object
  });

  it('should not render when visible is false', () => {
    render(
      <TestWrapper>
        <Toast message="Test message" visible={false} />
      </TestWrapper>,
    );

    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('should render when visible is true', () => {
    render(
      <TestWrapper>
        <Toast message="Test message" visible />
      </TestWrapper>,
    );

    expect(screen.getByTestId('toast')).toBeTruthy();
    expect(screen.getByTestId('toast-message')).toBeTruthy();
  });

  it('should display the provided message', () => {
    const testMessage = 'Theme changed successfully';

    render(
      <TestWrapper>
        <Toast message={testMessage} visible />
      </TestWrapper>,
    );

    expect(screen.getByText(testMessage)).toBeTruthy();
  });

  it('should call onHide after auto-dismiss duration', async () => {
    jest.useFakeTimers();
    const mockOnHide = jest.fn();
    const shortDuration = 100;

    render(
      <TestWrapper>
        <Toast
          message="Test message"
          visible
          onHide={mockOnHide}
          duration={shortDuration}
        />
      </TestWrapper>,
    );

    // Should not have called onHide immediately
    expect(mockOnHide).not.toHaveBeenCalled();

    // Advance timers by duration + animation time
    act(() => {
      jest.advanceTimersByTime(shortDuration + 350);
    });

    expect(mockOnHide).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('should use default duration of 2000ms when not specified', async () => {
    jest.useFakeTimers();
    const mockOnHide = jest.fn();

    render(
      <TestWrapper>
        <Toast
          message="Test message"
          visible
          onHide={mockOnHide}
        />
      </TestWrapper>,
    );

    // Should not have called onHide after short time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockOnHide).not.toHaveBeenCalled();

    // Should call onHide after default duration + animation
    act(() => {
      jest.advanceTimersByTime(2000 + 350);
    });

    expect(mockOnHide).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('should handle message changes when visible', () => {
    const { rerender } = render(
      <TestWrapper>
        <Toast message="First message" visible />
      </TestWrapper>,
    );

    expect(screen.getByText('First message')).toBeTruthy();

    rerender(
      <TestWrapper>
        <Toast message="Second message" visible />
      </TestWrapper>,
    );

    expect(screen.getByText('Second message')).toBeTruthy();
    expect(screen.queryByText('First message')).toBeNull();
  });

  it('should not show toast when visible becomes false', () => {
    const { rerender } = render(
      <TestWrapper>
        <Toast message="Test message" visible />
      </TestWrapper>,
    );

    expect(screen.getByTestId('toast')).toBeTruthy();

    rerender(
      <TestWrapper>
        <Toast message="Test message" visible={false} />
      </TestWrapper>,
    );

    // Component should not render when visible is false
    expect(screen.queryByTestId('toast')).toBeNull();
  });
});
