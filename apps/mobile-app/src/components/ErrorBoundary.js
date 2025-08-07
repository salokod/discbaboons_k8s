/**
 * ErrorBoundary - Catch and handle React errors gracefully
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log this to a crash reporting service
    // Example: crashReporting.recordError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback(error, this.handleReset);
      }
      return <ErrorFallback error={error} resetError={this.handleReset} />;
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  fallback: null,
};

export default ErrorBoundary;
