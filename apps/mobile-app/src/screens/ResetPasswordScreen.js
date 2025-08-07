/**
 * ResetPasswordScreen - Enter verification code and new password
 */

import { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import AppContainer from '../components/AppContainer';
import Input from '../components/Input';
import Button from '../components/Button';
import CodeInput from '../components/CodeInput';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { triggerSuccessHaptic, triggerErrorHaptic } from '../services/hapticService';
import { resetPassword, resendPasswordResetCode } from '../services/authService';

const styles = StyleSheet.create({
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
});

function ResetPasswordScreen({ navigation, route }) {
  const colors = useThemeColors();
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResendLoading, setIsResendLoading] = useState(false);

  // Get email from navigation params
  const { email } = route?.params || {};

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

  const isFormValid = verificationCode.trim().length === 6
    && newPassword.length >= 8
    && newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!isFormValid || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(verificationCode, newPassword, email || '');

      triggerSuccessHaptic();
      navigation.navigate('Login');
    } catch (error) {
      triggerErrorHaptic();
      // TODO: Add error state display
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResendLoading) {
      return;
    }

    setIsResendLoading(true);

    try {
      await resendPasswordResetCode(email || '');

      // Start 60-second cooldown
      setResendCooldown(60);
      triggerSuccessHaptic();
    } catch (error) {
      triggerErrorHaptic();
      // TODO: Add error state display
    } finally {
      setIsResendLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="reset-password-screen">
      <AppContainer>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <Text style={[styles.title, { color: colors.text }]}>
                Create New Password
              </Text>
              <Text style={[styles.instructions, { color: colors.textLight }]}>
                {email ? `Enter the 6-digit code sent to ${email} and create your new password` : 'Enter your verification code and create a new password'}
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Verification Code
                </Text>
                <CodeInput
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
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
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
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
                />
              </View>
            </View>

            <View style={styles.resendSection}>
              <Text style={[styles.resendText, { color: colors.textLight }]}>
                Didn&apos;t receive the code?
              </Text>
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (resendCooldown > 0 || isResendLoading) && styles.resendButtonDisabled,
                ]}
                onPress={handleResendCode}
                disabled={resendCooldown > 0 || isResendLoading}
              >
                <Text style={[styles.resendButtonText, { color: colors.primary }]}>
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

            <View style={styles.buttonSection}>
              <Button
                title={isLoading ? 'Updating password...' : 'Update Password'}
                onPress={handleSubmit}
                disabled={!isFormValid || isLoading}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </AppContainer>
    </SafeAreaView>
  );
}

export default ResetPasswordScreen;
