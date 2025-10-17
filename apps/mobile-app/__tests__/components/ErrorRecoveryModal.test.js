/**
 * ErrorRecoveryModal Component Tests
 * Tests for the error recovery modal that provides context-aware actions
 */

import { render, fireEvent } from '@testing-library/react-native';
import ErrorRecoveryModal from '../../src/components/ErrorRecoveryModal';
import { ERROR_TYPES } from '../../src/utils/errorTypes';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('ErrorRecoveryModal', () => {
  describe('component structure', () => {
    test('should export ErrorRecoveryModal component', () => {
      expect(ErrorRecoveryModal).toBeDefined();
      expect(typeof ErrorRecoveryModal).toBe('function');
    });

    test('should render modal when visible', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-recovery-modal')).toBeTruthy();
    });

    test('should not render when not visible', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible={false}
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('error-recovery-modal')).toBeFalsy();
    });

    test('should accept all required props', () => {
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={onRetry}
            onCancel={onCancel}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-recovery-modal')).toBeTruthy();
    });

    test('should accept optional errorMessage prop', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            errorMessage="Custom error message"
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-recovery-modal')).toBeTruthy();
    });
  });

  describe('content display', () => {
    test('should display title based on error type', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      const title = getByTestId('error-modal-title');
      expect(title).toBeTruthy();
      expect(title.props.children).toBe('Connection Error');
    });

    test('should display different titles for different error types', () => {
      const errorTitles = [
        { type: ERROR_TYPES.NETWORK, title: 'Connection Error' },
        { type: ERROR_TYPES.AUTH, title: 'Authentication Required' },
        { type: ERROR_TYPES.PERMISSION, title: 'Access Denied' },
        { type: ERROR_TYPES.VALIDATION, title: 'Invalid Request' },
        { type: ERROR_TYPES.RATE_LIMIT, title: 'Too Many Requests' },
        { type: ERROR_TYPES.SERVER, title: 'Server Error' },
        { type: ERROR_TYPES.UNKNOWN, title: 'Something Went Wrong' },
      ];

      errorTitles.forEach(({ type, title }) => {
        const { getByTestId } = render(
          <ThemeProvider>
            <ErrorRecoveryModal
              visible
              errorType={type}
              onRetry={() => {}}
              onCancel={() => {}}
            />
          </ThemeProvider>,
        );

        expect(getByTestId('error-modal-title').props.children).toBe(title);
      });
    });

    test('should display custom error message when provided', () => {
      const customMessage = 'Unable to connect to server';
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            errorMessage={customMessage}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      const message = getByTestId('error-modal-message');
      expect(message).toBeTruthy();
      expect(message.props.children).toBe(customMessage);
    });

    test('should display default message when no custom message provided', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      const message = getByTestId('error-modal-message');
      expect(message).toBeTruthy();
      expect(message.props.children).toBe(
        'Unable to connect to the server. Please check your internet connection and try again.',
      );
    });

    test('should display different default messages for different error types', () => {
      const errorMessages = [
        {
          type: ERROR_TYPES.NETWORK,
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
        },
        {
          type: ERROR_TYPES.AUTH,
          message: 'Your session has expired. Please log in again to continue.',
        },
        {
          type: ERROR_TYPES.PERMISSION,
          message: 'You do not have permission to access this resource.',
        },
        {
          type: ERROR_TYPES.VALIDATION,
          message: 'The request contains invalid data. Please check your input and try again.',
        },
        {
          type: ERROR_TYPES.RATE_LIMIT,
          message: 'Too many requests. Please wait a moment and try again.',
        },
        {
          type: ERROR_TYPES.SERVER,
          message: 'The server encountered an error. Please try again later.',
        },
        {
          type: ERROR_TYPES.UNKNOWN,
          message: 'An unexpected error occurred. Please try again.',
        },
      ];

      errorMessages.forEach(({ type, message }) => {
        const { getByTestId } = render(
          <ThemeProvider>
            <ErrorRecoveryModal
              visible
              errorType={type}
              onRetry={() => {}}
              onCancel={() => {}}
            />
          </ThemeProvider>,
        );

        expect(getByTestId('error-modal-message').props.children).toBe(message);
      });
    });
  });

  describe('action buttons', () => {
    test('should display retry button for retryable errors', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-modal-retry-button')).toBeTruthy();
    });

    test('should display cancel button for all errors', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-modal-cancel-button')).toBeTruthy();
    });

    test('should call onRetry when retry button is pressed', () => {
      const onRetry = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={onRetry}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      const retryButton = getByTestId('error-modal-retry-button');
      fireEvent.press(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    test('should call onCancel when cancel button is pressed', () => {
      const onCancel = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={onCancel}
          />
        </ThemeProvider>,
      );

      const cancelButton = getByTestId('error-modal-cancel-button');
      fireEvent.press(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('should not display retry button for non-retryable errors', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.AUTH}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('error-modal-retry-button')).toBeFalsy();
    });

    test('should show retry button for NETWORK errors', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.NETWORK}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-modal-retry-button')).toBeTruthy();
    });

    test('should show retry button for SERVER errors', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.SERVER}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-modal-retry-button')).toBeTruthy();
    });

    test('should show retry button for RATE_LIMIT errors', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.RATE_LIMIT}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('error-modal-retry-button')).toBeTruthy();
    });

    test('should not show retry button for VALIDATION errors', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.VALIDATION}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('error-modal-retry-button')).toBeFalsy();
    });

    test('should not show retry button for PERMISSION errors', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <ErrorRecoveryModal
            visible
            errorType={ERROR_TYPES.PERMISSION}
            onRetry={() => {}}
            onCancel={() => {}}
          />
        </ThemeProvider>,
      );

      expect(queryByTestId('error-modal-retry-button')).toBeFalsy();
    });
  });
});
