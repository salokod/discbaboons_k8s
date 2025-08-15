/**
 * ThemeErrorBoundary Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import ThemeErrorBoundary from '../../../src/components/settings/ThemeErrorBoundary';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock console.error to avoid noise in tests
// eslint-disable-next-line no-console
const originalConsoleError = console.error;
beforeEach(() => {
  // eslint-disable-next-line no-console
  console.error = jest.fn();
});

afterEach(() => {
  // eslint-disable-next-line no-console
  console.error = originalConsoleError;
});

// Test component that throws an error
function ThrowError({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test theme error');
  }
  return null;
}

// Test component wrapper with theme provider
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

describe('ThemeErrorBoundary', () => {
  it('should export a ThemeErrorBoundary component', () => {
    expect(typeof ThemeErrorBoundary).toBe('function');
  });

  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <TestWrapper>
        <ThemeErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ThemeErrorBoundary>
      </TestWrapper>,
    );

    // Should not show error boundary UI
    expect(() => getByText('Theme Error')).toThrow();
  });

  it('should catch theme-related errors and show fallback UI', () => {
    const { getByText } = render(
      <TestWrapper>
        <ThemeErrorBoundary>
          <ThrowError shouldThrow />
        </ThemeErrorBoundary>
      </TestWrapper>,
    );

    expect(getByText('Theme Error')).toBeTruthy();
    expect(getByText(/theme settings encountered an error/i)).toBeTruthy();
  });

  it('should display retry button in error state', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ThemeErrorBoundary>
          <ThrowError shouldThrow />
        </ThemeErrorBoundary>
      </TestWrapper>,
    );

    expect(getByTestId('theme-error-retry')).toBeTruthy();
  });

  it('should call reset function when retry button is pressed', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ThemeErrorBoundary>
          <ThrowError shouldThrow />
        </ThemeErrorBoundary>
      </TestWrapper>,
    );

    // Error should be displayed
    expect(getByTestId('theme-error-retry')).toBeTruthy();

    // Press retry button - this should not throw
    expect(() => {
      fireEvent.press(getByTestId('theme-error-retry'));
    }).not.toThrow();
  });

  it('should have testID for error boundary container', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ThemeErrorBoundary>
          <ThrowError shouldThrow />
        </ThemeErrorBoundary>
      </TestWrapper>,
    );

    expect(getByTestId('theme-error-boundary')).toBeTruthy();
  });

  it('should display user-friendly error message for theme failures', () => {
    const { getByText } = render(
      <TestWrapper>
        <ThemeErrorBoundary>
          <ThrowError shouldThrow />
        </ThemeErrorBoundary>
      </TestWrapper>,
    );

    expect(getByText(/theme settings encountered an error/i)).toBeTruthy();
    expect(getByText(/continue using the app with default settings/i)).toBeTruthy();
  });

  it('should handle theme storage specific errors', () => {
    const storageError = new Error('AsyncStorage failed');

    function ThrowStorageError() {
      throw storageError;
    }

    const { getByText } = render(
      <TestWrapper>
        <ThemeErrorBoundary>
          <ThrowStorageError />
        </ThemeErrorBoundary>
      </TestWrapper>,
    );

    expect(getByText('Theme Error')).toBeTruthy();
  });
});
