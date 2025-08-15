/**
 * ThemeErrorBoundary - Specialized error boundary for theme-related errors
 * Provides specific handling for theme storage failures and theme-related crashes
 */

import { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

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

function ThemeErrorFallback({ resetErrorBoundary }) {
  const colors = useThemeColors();

  return (
    <View style={styles.container} testID="theme-error-boundary">
      <Text style={styles.errorIcon}>🎨</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Theme Error
      </Text>
      <Text style={[styles.message, { color: colors.textLight }]}>
        Your theme settings encountered an error. You can continue using the app
        with default settings.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={resetErrorBoundary}
        testID="theme-error-retry"
      >
        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );
}

ThemeErrorFallback.propTypes = {
  resetErrorBoundary: PropTypes.func.isRequired,
};

function ThemeErrorBoundary({ children, onError }) {
  const handleError = (error, errorInfo) => {
    // Log theme-specific errors
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ThemeErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  };

  const FallbackComponent = useMemo(() => ThemeErrorFallback, []);

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}

ThemeErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
};

ThemeErrorBoundary.defaultProps = {
  onError: null,
};

export default ThemeErrorBoundary;
