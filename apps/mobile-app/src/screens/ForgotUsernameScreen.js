/**
 * ForgotUsernameScreen - Username Recovery Flow
 */

import {
  useState, useCallback, useMemo, useEffect,
} from 'react';
import {
  SafeAreaView, Platform, StyleSheet, View, Text, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import AppContainer from '../components/AppContainer';
import Input from '../components/Input';
import Button from '../components/Button';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { forgotUsername, handleNetworkError } from '../services/authService';
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  errorContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    textAlign: 'center',
  },
  successContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  successText: {
    ...typography.body,
    textAlign: 'center',
  },
});

function ForgotUsernameScreen({ navigation }) {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Email validation
  const isEmailValid = useMemo(() => {
    if (!email.trim()) return false;
    return isValidEmail(email.trim());
  }, [email]);

  const styles = useMemo(() => ({
    safeArea: [
      staticStyles.safeArea,
      { backgroundColor: colors.background },
    ],
    content: staticStyles.content,
    title: [
      staticStyles.title,
      { color: colors.text },
    ],
    subtitle: [
      staticStyles.subtitle,
      { color: colors.textLight },
    ],
    inputContainer: staticStyles.inputContainer,
    buttonContainer: staticStyles.buttonContainer,
    errorContainer: staticStyles.errorContainer,
    errorText: [
      staticStyles.errorText,
      { color: colors.error },
    ],
    successContainer: [
      staticStyles.successContainer,
      { backgroundColor: `${colors.success}20` }, // 20% opacity
    ],
    successText: [
      staticStyles.successText,
      { color: colors.success },
    ],
  }), [colors]);

  const handleEmailSubmit = useCallback(async () => {
    if (!isEmailValid || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await forgotUsername(email);
      triggerSuccessHaptic();
      setSuccess(true);
      setCountdown(5); // Start 5-second countdown
    } catch (err) {
      triggerErrorHaptic();
      const errorMessage = handleNetworkError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, isEmailValid, isLoading]);

  // Countdown effect for redirecting back to login
  useEffect(() => {
    if (countdown === null) return undefined;

    if (countdown === 0) {
      navigation.goBack();
      return undefined;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea} testID="forgot-username-screen">
        <AppContainer>
          <View style={styles.content}>
            <Text style={styles.title}>Recover Username</Text>
            <Text style={styles.subtitle}>
              Enter your email address to receive your username
            </Text>

            <View style={styles.inputContainer}>
              <Input
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
            </View>

            {error && (
              <View style={styles.errorContainer} testID="error-message">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={isLoading ? 'Sending username recovery instructions...' : 'Send Username'}
                onPress={handleEmailSubmit}
                disabled={!isEmailValid || isLoading}
              />
            </View>

            {success && (
              <View style={styles.successContainer} testID="success-message">
                <Text style={styles.successText}>
                  If an account associated with this email address exists,
                  an email containing your username has been sent.
                </Text>
                {countdown !== null && (
                  <Text style={[styles.successText, { marginTop: spacing.md }]}>
                    Redirecting you back to login screen in
                    {' '}
                    {countdown}
                    ...
                  </Text>
                )}
              </View>
            )}
          </View>
        </AppContainer>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export default ForgotUsernameScreen;
