/**
 * ErrorRecoveryModal Component
 * Modal that provides context-aware recovery actions for different error types
 */

import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { ERROR_TYPES } from '../utils/errorTypes';
import { isRetryableError } from '../utils/errorClassifier';

// Error type to title mapping
const ERROR_TITLES = {
  [ERROR_TYPES.NETWORK]: 'Connection Error',
  [ERROR_TYPES.AUTH]: 'Authentication Required',
  [ERROR_TYPES.PERMISSION]: 'Access Denied',
  [ERROR_TYPES.VALIDATION]: 'Invalid Request',
  [ERROR_TYPES.RATE_LIMIT]: 'Too Many Requests',
  [ERROR_TYPES.SERVER]: 'Server Error',
  [ERROR_TYPES.UNKNOWN]: 'Something Went Wrong',
};

// Error type to default message mapping
const DEFAULT_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ERROR_TYPES.AUTH]: 'Your session has expired. Please log in again to continue.',
  [ERROR_TYPES.PERMISSION]: 'You do not have permission to access this resource.',
  [ERROR_TYPES.VALIDATION]: 'The request contains invalid data. Please check your input and try again.',
  [ERROR_TYPES.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ERROR_TYPES.SERVER]: 'The server encountered an error. Please try again later.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

function ErrorRecoveryModal({
  visible, errorType, errorMessage, onRetry, onCancel,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      margin: 20,
      minWidth: 280,
      maxWidth: 400,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: colors.textLight,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    retryButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    retryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (!visible) {
    return null;
  }

  const title = ERROR_TITLES[errorType] || ERROR_TITLES[ERROR_TYPES.UNKNOWN];
  const message = errorMessage
    || DEFAULT_MESSAGES[errorType]
    || DEFAULT_MESSAGES[ERROR_TYPES.UNKNOWN];
  const canRetry = isRetryableError(errorType);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="error-recovery-modal"
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title} testID="error-modal-title">
            {title}
          </Text>
          <Text style={styles.message} testID="error-modal-message">
            {message}
          </Text>
          <View style={styles.buttonContainer}>
            {canRetry && (
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={onRetry}
                testID="error-modal-retry-button"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              testID="error-modal-cancel-button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

ErrorRecoveryModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  errorType: PropTypes.oneOf(Object.values(ERROR_TYPES)).isRequired,
  errorMessage: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

ErrorRecoveryModal.defaultProps = {
  errorMessage: null,
};

export default ErrorRecoveryModal;
