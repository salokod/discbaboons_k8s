/**
 * ForgotPasswordScreen - Password Recovery Flow
 */

import { useState } from 'react';
import {
  SafeAreaView, Platform, StyleSheet, View, Text, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import AppContainer from '../components/AppContainer';
import Input from '../components/Input';
import Button from '../components/Button';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { forgotPassword, handleNetworkError } from '../services/authService';
import { triggerSuccessHaptic, triggerErrorHaptic } from '../services/hapticService';

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

  // Email validation regex
  const isValidEmail = (emailAddress) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress.trim());
  };

  const isFormValid = email.trim().length > 0 && isValidEmail(email.trim());

  const handleSubmit = async () => {
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
      setTimeout(() => {
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
  };

  const handleBackToLogin = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="forgot-password-screen">
      <AppContainer>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
              <Text style={[styles.title, { color: colors.text }]}>
                Reset Password
              </Text>
              <Text style={[styles.securityMessage, { color: colors.textLight }]}>
                Enter your email address to receive a reset code
              </Text>
            </View>

            <View style={styles.formSection}>
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
              />
            </View>

            {successMessage ? (
              <View
                style={[
                  styles.successSection,
                  { backgroundColor: `${colors.success}15` },
                ]}
                testID="success-message"
              >
                <Text style={[styles.successText, { color: colors.success }]}>
                  {successMessage}
                </Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View
                style={[
                  styles.errorSection,
                  { backgroundColor: `${colors.error}15` },
                ]}
                testID="error-message"
              >
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {!successMessage ? (
              <View style={styles.buttonSection}>
                <Button
                  title={isLoading ? 'Sending secure reset instructions...' : 'Send Reset Instructions'}
                  onPress={handleSubmit}
                  disabled={!isFormValid || isLoading}
                />
              </View>
            ) : (
              <View style={styles.backButtonSection}>
                <Button
                  title="Back to Login"
                  onPress={handleBackToLogin}
                  variant="secondary"
                />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </AppContainer>
    </SafeAreaView>
  );
}

export default ForgotPasswordScreen;
