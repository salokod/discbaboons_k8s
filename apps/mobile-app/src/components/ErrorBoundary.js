/**
 * ErrorBoundary - Catch and handle React errors gracefully
 * Converted to functional component using react-error-boundary
 */

import { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  debugText: {
    fontSize: 12,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});

function ErrorFallback({ error, resetError }) {
  const colors = useThemeColors();

  return (
    <View style={styles.container} testID="error-boundary">
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.message, { color: colors.textLight }]}>
        We apologize for the inconvenience. Please try again or restart the app if the problem
        persists.
      </Text>
      {__DEV__ && error && (
        <Text style={[styles.message, styles.debugText, { color: colors.error }]}>
          {error.toString()}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={resetError}
        testID="error-boundary-retry"
      >
        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.instanceOf(Error),
  resetError: PropTypes.func.isRequired,
};

ErrorFallback.defaultProps = {
  error: null,
};

function ErrorBoundary({ children, fallback }) {
  const handleError = (error, errorInfo) => {
    // Log error to console in development
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log this to a crash reporting service
    // Example: crashReporting.recordError(error, errorInfo);
  };

  const FallbackComponent = useMemo(() => {
    if (fallback) {
      return ({ error, resetErrorBoundary }) => fallback(error, resetErrorBoundary);
    }
    return ErrorFallback;
  }, [fallback]);

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  fallback: null,
};

export default ErrorBoundary;
