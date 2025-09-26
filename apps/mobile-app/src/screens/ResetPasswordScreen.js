/**
 * ResetPasswordScreen - Enter verification code and new password
 */

import {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import AppContainer from '../components/AppContainer';
import StatusBarSafeView from '../components/StatusBarSafeView';
import Input from '../components/Input';
import Button from '../components/Button';
import CodeInput from '../components/CodeInput';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { triggerSuccessHaptic, triggerErrorHaptic } from '../services/hapticService';
import { resetPassword, resendPasswordResetCode, handleNetworkError } from '../services/authService';

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
  instructions: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  formSection: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  buttonSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  resendButtonDisabled: {
    opacity: 0.5,
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
});

function ResetPasswordScreen({ navigation, route }) {
  const colors = useThemeColors();
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get email from navigation params
  const { email } = route?.params || {};

  // Refs for cleanup
  const timeoutRefs = useRef([]);

  // Cooldown timer effect
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prevTime) => prevTime - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Cleanup timeouts on unmount
  useEffect(() => () => {
    timeoutRefs.current.forEach((timeoutId) => {
      if (timeoutId) clearTimeout(timeoutId);
    });
  }, []);

  // Memoized form validation to prevent unnecessary recalculation
  const isFormValid = useMemo(() => verificationCode.trim().length === 6
      && newPassword.length >= 8
      && newPassword === confirmPassword, [verificationCode, newPassword, confirmPassword]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isLoading) {
      return;
    }

    setErrorMessage(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success
    setIsLoading(true);

    try {
      await resetPassword(verificationCode, newPassword, email || '');

      // Clear sensitive data from state
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');

      setSuccessMessage('Password updated successfully! Redirecting to login...');
      triggerSuccessHaptic();

      // Navigate to login after brief success message
      const timeoutId = setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
      timeoutRefs.current.push(timeoutId);
    } catch (error) {
      setErrorMessage(
        handleNetworkError(error),
      );
      triggerErrorHaptic();
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, verificationCode, newPassword, email, navigation]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0 || isResendLoading) {
      return;
    }

    setErrorMessage(''); // Clear previous errors
    setIsResendLoading(true);

    try {
      await resendPasswordResetCode(email || '');

      // Start 60-second cooldown
      setResendCooldown(60);
      setSuccessMessage('New verification code sent to your email!');
      triggerSuccessHaptic();

      // Clear success message after 3 seconds
      const timeoutId = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      timeoutRefs.current.push(timeoutId);
    } catch (error) {
      setErrorMessage(
        handleNetworkError(error),
      );
      triggerErrorHaptic();
    } finally {
      setIsResendLoading(false);
    }
  }, [resendCooldown, isResendLoading, email]);

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
    instructions: {
      ...staticStyles.instructions,
      color: colors.textLight,
    },
    inputLabel: {
      ...staticStyles.inputLabel,
      color: colors.text,
    },
    resendText: {
      ...staticStyles.resendText,
      color: colors.textLight,
    },
    resendButtonText: {
      ...staticStyles.resendButtonText,
      color: colors.primary,
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
    <StatusBarSafeView style={staticStyles.safeArea} testID="reset-password-screen">
      <AppContainer>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={staticStyles.content}>
            <View style={staticStyles.headerSection}>
              <Text style={styles.title}>
                Create New Password
              </Text>
              <Text style={styles.instructions}>
                {email ? `Enter the 6-digit code sent to ${email} and create your new password` : 'Enter your verification code and create a new password'}
              </Text>
            </View>

            <View style={staticStyles.formSection}>
              <View style={staticStyles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Verification Code
                </Text>
                <CodeInput
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  autoFocus
                  accessibilityLabel="Verification code input"
                />
              </View>

              <View style={staticStyles.inputGroup}>
                <Text style={styles.inputLabel}>
                  New Password
                </Text>
                <Input
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  showPasswordToggle
                  textContentType="newPassword"
                  returnKeyType="next"
                  accessibilityLabel="New password input"
                  accessibilityHint="Enter your new password. Must be at least 8 characters long"
                />
              </View>

              <View style={staticStyles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Confirm Password
                </Text>
                <Input
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  showPasswordToggle
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  accessibilityLabel="Confirm password input"
                  accessibilityHint="Re-enter your new password to confirm it matches"
                />
              </View>
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

            <View style={staticStyles.resendSection}>
              <Text style={styles.resendText}>
                Didn&apos;t receive the code?
              </Text>
              <TouchableOpacity
                style={[
                  staticStyles.resendButton,
                  (resendCooldown > 0 || isResendLoading) && staticStyles.resendButtonDisabled,
                ]}
                onPress={handleResendCode}
                disabled={resendCooldown > 0 || isResendLoading}
                accessibilityLabel="Resend verification code button"
                accessibilityHint="Request a new verification code to be sent to your email"
                accessibilityState={{ disabled: resendCooldown > 0 || isResendLoading }}
              >
                <Text style={styles.resendButtonText}>
                  {(() => {
                    if (isResendLoading) {
                      return 'Sending...';
                    }
                    if (resendCooldown > 0) {
                      return `Resend code in ${resendCooldown}s`;
                    }
                    return 'Resend Code';
                  })()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={staticStyles.buttonSection}>
              <Button
                title={isLoading ? 'Updating password...' : 'Update Password'}
                onPress={handleSubmit}
                disabled={!isFormValid || isLoading}
                accessibilityLabel="Update password button"
                accessibilityHint="Confirm password reset with the verification code and new password"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </AppContainer>
    </StatusBarSafeView>
  );
}

// Add display name for React DevTools
ResetPasswordScreen.displayName = 'ResetPasswordScreen';

export default ResetPasswordScreen;
