/**
 * RegisterScreen
 */

import {
  View, StyleSheet, Platform, Text, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import {
  useState, useMemo, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';
import Input from '../components/Input';
import Button from '../components/Button';
import { register as authRegister, handleNetworkError } from '../services/authService';
import { triggerSuccessHaptic, triggerErrorHaptic } from '../services/hapticService';

function RegisterScreen({ onRegistrationSuccess }) {
  const colors = useThemeColors();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Track which fields the user has interacted with
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track success flash states for each field
  const [usernameSuccessFlash, setUsernameSuccessFlash] = useState(false);
  const [emailSuccessFlash, setEmailSuccessFlash] = useState(false);
  const [passwordSuccessFlash, setPasswordSuccessFlash] = useState(false);
  const [confirmPasswordSuccessFlash, setConfirmPasswordSuccessFlash] = useState(false);

  // Refs for auto-focus flow
  const usernameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Form validation logic
  const isUsernameValid = useMemo(() => username.length >= 4 && username.length <= 20, [username]);

  const isEmailValid = useMemo(() => {
    // Basic email validation: must have @ and domain with .
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Individual password requirement checks
  const passwordRequirements = useMemo(() => {
    const requirements = {
      length: password.length >= 8 && password.length <= 32,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return requirements;
  }, [password]);

  const isPasswordValid = useMemo(
    () => Object.values(passwordRequirements).every(Boolean),
    [passwordRequirements],
  );

  const isConfirmPasswordValid = useMemo(
    () => password.length > 0 && confirmPassword === password,
    [password, confirmPassword],
  );

  const isFormValid = useMemo(
    () => isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid,
    [isUsernameValid, isEmailValid, isPasswordValid, isConfirmPasswordValid],
  );

  // Success flash effect for username
  useEffect(() => {
    if (isUsernameValid && usernameTouched) {
      setUsernameSuccessFlash(true);
      const timer = setTimeout(() => {
        setUsernameSuccessFlash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isUsernameValid, usernameTouched]);

  // Success flash effect for email
  useEffect(() => {
    if (isEmailValid && emailTouched) {
      setEmailSuccessFlash(true);
      const timer = setTimeout(() => {
        setEmailSuccessFlash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isEmailValid, emailTouched]);

  // Success flash effect for password
  useEffect(() => {
    if (isPasswordValid && passwordTouched) {
      setPasswordSuccessFlash(true);
      const timer = setTimeout(() => {
        setPasswordSuccessFlash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isPasswordValid, passwordTouched]);

  // Success flash effect for confirm password
  useEffect(() => {
    if (isConfirmPasswordValid && confirmPasswordTouched) {
      setConfirmPasswordSuccessFlash(true);
      const timer = setTimeout(() => {
        setConfirmPasswordSuccessFlash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isConfirmPasswordValid, confirmPasswordTouched]);

  const handleRegister = async () => {
    // Clear any previous errors
    setRegistrationError(null);
    setIsLoading(true);

    try {
      // Call real API
      await authRegister(username, email, password);

      // Trigger success haptic feedback
      triggerSuccessHaptic();

      // Call success callback to notify parent component
      if (onRegistrationSuccess) {
        onRegistrationSuccess(username);
      }

      // Clear the form
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsernameTouched(false);
      setEmailTouched(false);
      setPasswordTouched(false);
      setConfirmPasswordTouched(false);
    } catch (error) {
      // Trigger error haptic feedback
      triggerErrorHaptic();

      // Handle registration errors
      const errorMsg = handleNetworkError(error);
      setRegistrationError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    formContainer: {
      gap: spacing.lg,
    },
    inputGroup: {
      gap: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
    },
    buttonContainer: {
      marginTop: Platform.select({
        ios: spacing.sm,
        android: spacing.md,
      }),
    },
    validationHelper: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: 6,
      marginTop: spacing.xs,
      borderLeftWidth: 3,
      borderLeftColor: colors.textLight,
    },
    validationHelperSuccess: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.success,
      borderRadius: 6,
      marginTop: spacing.xs,
      borderLeftWidth: 3,
      borderLeftColor: colors.success,
    },
    validationHelperError: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: 6,
      marginTop: spacing.xs,
      borderLeftWidth: 3,
      borderLeftColor: colors.error,
    },
    requirementText: {
      ...typography.caption,
      color: colors.textLight,
      fontSize: Platform.select({
        ios: typography.caption.fontSize - 1,
        android: typography.caption.fontSize,
      }),
    },
    requirementTextSuccess: {
      ...typography.caption,
      color: '#FFFFFF',
      fontSize: Platform.select({
        ios: typography.caption.fontSize - 1,
        android: typography.caption.fontSize,
      }),
    },
    requirementTextError: {
      ...typography.caption,
      color: colors.error,
      fontSize: Platform.select({
        ios: typography.caption.fontSize - 1,
        android: typography.caption.fontSize,
      }),
    },
    requirementTextMet: {
      ...typography.caption,
      color: colors.success,
      fontSize: Platform.select({
        ios: typography.caption.fontSize - 1,
        android: typography.caption.fontSize,
      }),
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    statusIcon: {
      fontSize: Platform.select({
        ios: 12,
        android: 14,
      }),
    },
    statusIconSuccess: {
      color: colors.success,
    },
    errorContainer: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.error,
      borderRadius: 12,
      marginBottom: spacing.md,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
      }),
    },
    errorText: {
      ...typography.body,
      color: '#FFFFFF',
      textAlign: 'center',
      fontSize: Platform.select({
        ios: typography.body.fontSize,
        android: typography.body.fontSize + 1,
      }),
    },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View testID="register-screen" style={styles.formContainer}>
        {registrationError && (
        <View testID="error-message" style={styles.errorContainer}>
          <Text style={styles.errorText}>{registrationError}</Text>
        </View>
        )}

        <View style={styles.inputGroup}>
          <Input
            ref={usernameInputRef}
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setUsernameTouched(true);
              if (registrationError) setRegistrationError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
          />
          {((usernameTouched || username.length > 0) && !isUsernameValid)
            || usernameSuccessFlash ? (
              <View
                testID="username-validation"
                style={usernameSuccessFlash
                  ? styles.validationHelperSuccess
                  : styles.validationHelperError}
              >
                <View style={styles.requirementRow}>
                  <Text style={styles.statusIcon}>
                    {usernameSuccessFlash ? '✓' : '✗'}
                  </Text>
                  <Text
                    style={usernameSuccessFlash
                      ? styles.requirementTextSuccess
                      : styles.requirementTextError}
                  >
                    Username: 4-20 characters
                  </Text>
                </View>
              </View>
            ) : null}
          <Input
            ref={emailInputRef}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailTouched(true);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />
          {((emailTouched || email.length > 0) && !isEmailValid) || emailSuccessFlash ? (
            <View
              testID="email-validation"
              style={emailSuccessFlash
                ? styles.validationHelperSuccess
                : styles.validationHelperError}
            >
              <View style={styles.requirementRow}>
                <Text style={styles.statusIcon}>
                  {emailSuccessFlash ? '✓' : '✗'}
                </Text>
                <Text
                  style={emailSuccessFlash
                    ? styles.requirementTextSuccess
                    : styles.requirementTextError}
                >
                  Valid format required (e.g., user@example.com)
                </Text>
              </View>
            </View>
          ) : null}
          <Input
            ref={passwordInputRef}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordTouched(true);
            }}
            secureTextEntry
            showPasswordToggle
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
          />
          {((passwordTouched || password.length > 0) && !isPasswordValid)
            || passwordSuccessFlash ? (
              <View
                testID="password-validation"
                style={passwordSuccessFlash
                  ? styles.validationHelperSuccess
                  : styles.validationHelperError}
              >
                <View style={styles.requirementRow}>
                  <Text
                    style={[
                      styles.statusIcon,
                      passwordRequirements.length && styles.statusIconSuccess,
                    ]}
                  >
                    {passwordRequirements.length ? '✓' : '✗'}
                  </Text>
                  <Text
                    style={(() => {
                      if (passwordSuccessFlash) return styles.requirementTextSuccess;
                      if (passwordRequirements.length) return styles.requirementTextMet;
                      return styles.requirementTextError;
                    })()}
                  >
                    8-32 characters (
                    {password.length}
                    /32)
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text
                    style={[
                      styles.statusIcon,
                      passwordRequirements.uppercase && styles.statusIconSuccess,
                    ]}
                  >
                    {passwordRequirements.uppercase ? '✓' : '✗'}
                  </Text>
                  <Text
                    style={(() => {
                      if (passwordSuccessFlash) return styles.requirementTextSuccess;
                      if (passwordRequirements.uppercase) return styles.requirementTextMet;
                      return styles.requirementTextError;
                    })()}
                  >
                    1 uppercase letter (A-Z)
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text
                    style={[
                      styles.statusIcon,
                      passwordRequirements.lowercase && styles.statusIconSuccess,
                    ]}
                  >
                    {passwordRequirements.lowercase ? '✓' : '✗'}
                  </Text>
                  <Text
                    style={(() => {
                      if (passwordSuccessFlash) return styles.requirementTextSuccess;
                      if (passwordRequirements.lowercase) return styles.requirementTextMet;
                      return styles.requirementTextError;
                    })()}
                  >
                    1 lowercase letter (a-z)
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text
                    style={[
                      styles.statusIcon,
                      passwordRequirements.number && styles.statusIconSuccess,
                    ]}
                  >
                    {passwordRequirements.number ? '✓' : '✗'}
                  </Text>
                  <Text
                    style={(() => {
                      if (passwordSuccessFlash) return styles.requirementTextSuccess;
                      if (passwordRequirements.number) return styles.requirementTextMet;
                      return styles.requirementTextError;
                    })()}
                  >
                    1 number (0-9)
                  </Text>
                </View>
                <View style={styles.requirementRow}>
                  <Text
                    style={[
                      styles.statusIcon,
                      passwordRequirements.special && styles.statusIconSuccess,
                    ]}
                  >
                    {passwordRequirements.special ? '✓' : '✗'}
                  </Text>
                  <Text
                    style={(() => {
                      if (passwordSuccessFlash) return styles.requirementTextSuccess;
                      if (passwordRequirements.special) return styles.requirementTextMet;
                      return styles.requirementTextError;
                    })()}
                  >
                    1 special character (!@#$%^&*)
                  </Text>
                </View>
              </View>
            ) : null}
          <Input
            ref={confirmPasswordInputRef}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordTouched(true);
            }}
            secureTextEntry
            showPasswordToggle
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={() => {
              if (isFormValid) {
                handleRegister();
              }
            }}
          />
          {((confirmPasswordTouched || confirmPassword.length > 0) && !isConfirmPasswordValid)
          || confirmPasswordSuccessFlash ? (
            <View
              testID="confirm-password-validation"
              style={confirmPasswordSuccessFlash
                ? styles.validationHelperSuccess
                : styles.validationHelperError}
            >
              <View style={styles.requirementRow}>
                <Text style={styles.statusIcon}>
                  {confirmPasswordSuccessFlash ? '✓' : '✗'}
                </Text>
                <Text
                  style={confirmPasswordSuccessFlash
                    ? styles.requirementTextSuccess
                    : styles.requirementTextError}
                >
                  Passwords must match
                </Text>
              </View>
            </View>
            ) : null}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? 'Creating Account...' : 'Create Account'}
            onPress={handleRegister}
            variant="primary"
            disabled={!isFormValid || isLoading}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

RegisterScreen.propTypes = {
  onRegistrationSuccess: PropTypes.func,
};

RegisterScreen.defaultProps = {
  onRegistrationSuccess: null,
};

export default RegisterScreen;
