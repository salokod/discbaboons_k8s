/**
 * ForgotPasswordScreen - Password Recovery Flow
 */

import {
  useState, useCallback, useMemo, useRef, useEffect,
} from 'react';
import {
  Platform, StyleSheet, View, Text, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import AppContainer from '../components/AppContainer';
import StatusBarSafeView from '../components/StatusBarSafeView';
import Input from '../components/Input';
import Button from '../components/Button';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { forgotPassword, handleNetworkError } from '../services/authService';
import { triggerSuccessHaptic, triggerErrorHaptic } from '../services/hapticService';

const { isValidEmail } = require('../utils/validation');

const staticStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.select({
      android: 40,
      ios: 0,
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  securityMessage: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  buttonSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  errorSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  successSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  successText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButtonSection: {
    marginTop: spacing.md,
  },
});

function ForgotPasswordScreen({ navigation }) {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Ref for cleanup
  const timeoutRef = useRef(null);

  // Email validation is now imported from shared utility

  // Memoized form validation
  const isFormValid = useMemo(
    () => email.trim().length > 0 && isValidEmail(email.trim()),
    [email],
  );

  // Cleanup timeout on unmount
  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isLoading) {
      return;
    }

    setErrorMessage(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success messages
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      // Show success message and trigger success haptic
      setSuccessMessage(
        result.message || 'Reset instructions sent! Check your email for next steps.',
      );
      triggerSuccessHaptic();

      // Auto-navigate to ResetPasswordScreen after a brief delay
      timeoutRef.current = setTimeout(() => {
        if (navigation) {
          navigation.navigate('ResetPassword', {
            email,
          });
        }
      }, 2000);
    } catch (error) {
      setErrorMessage(
        handleNetworkError(error),
      );
      triggerErrorHaptic();
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, email, navigation]);

  const handleBackToLogin = useCallback(() => {
    if (navigation) {
      navigation.goBack();
    }
  }, [navigation]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Memoize styles to prevent recreation
  const styles = useMemo(() => ({
    ...staticStyles,
    title: {
      ...staticStyles.title,
      color: colors.text,
    },
    securityMessage: {
      ...staticStyles.securityMessage,
      color: colors.textLight,
    },
    successSection: {
      ...staticStyles.successSection,
      backgroundColor: `${colors.success}15`,
    },
    successText: {
      ...staticStyles.successText,
      color: colors.success,
    },
    errorSection: {
      ...staticStyles.errorSection,
      backgroundColor: `${colors.error}15`,
    },
    errorText: {
      ...staticStyles.errorText,
      color: colors.error,
    },
  }), [colors]);

  return (
    <StatusBarSafeView style={staticStyles.safeArea} testID="forgot-password-screen">
      <AppContainer>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={staticStyles.content}>
            <View style={staticStyles.headerSection}>
              <Text style={styles.title}>
                Reset Password
              </Text>
              <Text style={styles.securityMessage}>
                Enter your email address to receive a reset code
              </Text>
            </View>

            <View style={staticStyles.formSection}>
              <Input
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Email address input"
                accessibilityHint="Enter your email address to receive password reset instructions"
              />
            </View>

            {successMessage ? (
              <View
                style={styles.successSection}
                testID="success-message"
              >
                <Text style={styles.successText}>
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View
                style={styles.errorSection}
                testID="error-message"
              >
                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {!successMessage ? (
              <View style={staticStyles.buttonSection}>
                <Button
                  title={isLoading ? 'Sending secure reset instructions...' : 'Send Reset Instructions'}
                  onPress={handleSubmit}
                  disabled={!isFormValid || isLoading}
                  accessibilityLabel="Send reset instructions button"
                  accessibilityHint="Tap to send password reset instructions to your email address"
                />
              </View>
            ) : (
              <View style={staticStyles.backButtonSection}>
                <Button
                  title="Back to Login"
                  onPress={handleBackToLogin}
                  variant="secondary"
                  accessibilityLabel="Back to login button"
                  accessibilityHint="Return to the login screen"
                />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </AppContainer>
    </StatusBarSafeView>
  );
}

// Add display name for React DevTools
ForgotPasswordScreen.displayName = 'ForgotPasswordScreen';

export default ForgotPasswordScreen;
