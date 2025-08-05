/**
 * LoginScreen
 */

import {
  View, StyleSheet, Image, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform,
} from 'react-native';
import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';
import Input from '../components/Input';
import Button from '../components/Button';
import { login as authLogin, handleNetworkError } from '../services/authService';

function LoginScreen({
  errorMessage = null,
  onForgotPassword,
  onForgotUsername,
  onCreateAccount,
  onPrivacyPolicy,
  onTermsOfService,
  onSupport,
}) {
  const colors = useThemeColors();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [activeTab, setActiveTab] = useState('signin');
  const [isLoading, setIsLoading] = useState(false);

  // Form validation logic
  const isUsernameValid = useMemo(() => username.length >= 4 && username.length <= 20, [username]);

  const isPasswordValid = useMemo(() => password.length >= 8 && password.length <= 32, [password]);

  const isFormValid = useMemo(
    () => isUsernameValid && isPasswordValid,
    [isUsernameValid, isPasswordValid],
  );

  const handleLogin = async () => {
    // Clear any previous errors
    setLoginError(null);
    setIsLoading(true);

    try {
      // Call real API
      const { user, tokens } = await authLogin(username, password);

      // Successful login - update auth context
      login({ user, tokens });
    } catch (error) {
      // Handle login errors
      const errorMsg = handleNetworkError(error);
      setLoginError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      ...Platform.select({
        android: {
          paddingTop: 40, // StatusBar height + extra spacing for Android
        },
      }),
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: Platform.select({
        ios: spacing.lg,
        android: spacing.xl,
      }),
    },
    headerSection: {
      alignItems: 'center',
      paddingTop: Platform.select({
        ios: spacing.xl,
        android: spacing.xl,
      }),
      paddingBottom: spacing.xl,
    },
    logo: {
      width: 120,
      height: 120,
      resizeMode: 'contain',
    },
    contentSection: {
      flex: 1,
      minHeight: Platform.select({
        ios: 400,
        android: 450,
      }),
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: spacing.xl,
      padding: 4,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
      }),
    },
    tab: {
      flex: 1,
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.secondary,
      ...Platform.select({
        android: {
          elevation: 1,
        },
        ios: {
          shadowColor: colors.secondary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1,
        },
      }),
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      ...typography.body,
      fontWeight: Platform.select({
        ios: '600',
        android: 'bold',
      }),
      fontSize: Platform.select({
        ios: typography.body.fontSize,
        android: typography.body.fontSize + 1,
      }),
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    inactiveTabText: {
      color: colors.text,
    },
    formContainer: {
      gap: spacing.lg,
    },
    inputGroup: {
      gap: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
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
    buttonContainer: {
      marginTop: Platform.select({
        ios: spacing.sm,
        android: spacing.md,
      }),
    },
    secondaryActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      paddingHorizontal: Platform.select({
        ios: 0,
        android: spacing.xs,
      }),
    },
    linkText: {
      ...typography.body,
      color: colors.primary,
      textDecorationLine: 'underline',
      fontSize: Platform.select({
        ios: typography.body.fontSize,
        android: typography.body.fontSize + 1,
      }),
    },
    footerSection: {
      paddingTop: spacing.xl,
      paddingBottom: Platform.select({
        ios: spacing.lg,
        android: spacing.xl,
      }),
      alignItems: 'center',
      gap: spacing.md,
    },
    footerLinksContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Platform.select({
        ios: spacing.lg,
        android: spacing.md,
      }),
      marginBottom: spacing.md,
    },
    footerLinkText: {
      ...typography.caption,
      color: colors.primary,
      textDecorationLine: 'underline',
      fontSize: Platform.select({
        ios: typography.caption.fontSize,
        android: typography.caption.fontSize + 1,
      }),
    },
    copyrightText: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      fontSize: Platform.select({
        ios: typography.caption.fontSize,
        android: typography.caption.fontSize + 1,
      }),
    },
  });

  return (
    <SafeAreaView testID="login-screen" style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Image
            testID="logo-image"
            source={require('../../discbaboon_logo_blue.png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.contentSection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              testID="tab-sign-in"
              style={[
                styles.tab,
                activeTab === 'signin' ? styles.activeTab : styles.inactiveTab,
              ]}
              onPress={() => setActiveTab('signin')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'signin' ? styles.activeTabText : styles.inactiveTabText,
              ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="tab-sign-up"
              style={[
                styles.tab,
                activeTab === 'signup' ? styles.activeTab : styles.inactiveTab,
              ]}
              onPress={() => setActiveTab('signup')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'signup' ? styles.activeTabText : styles.inactiveTabText,
              ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {(errorMessage || loginError) && (
              <View testID="error-message" style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage || loginError}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Input
                placeholder="Username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (loginError) setLoginError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                textContentType="username"
              />
              <Input
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (loginError) setLoginError(null);
                }}
                secureTextEntry
                textContentType="password"
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={
                  (() => {
                    if (isLoading && activeTab === 'signin') return 'Logging in...';
                    if (activeTab === 'signin') return 'Log In';
                    return 'Create Account';
                  })()
                }
                onPress={activeTab === 'signin' ? handleLogin : onCreateAccount}
                variant="primary"
                disabled={!isFormValid || isLoading}
              />
            </View>

            {activeTab === 'signin' && (
              <View style={styles.secondaryActionsContainer}>
                <Text
                  style={styles.linkText}
                  onPress={onForgotUsername}
                >
                  Forgot username?
                </Text>
                <Text
                  style={styles.linkText}
                  onPress={onForgotPassword}
                >
                  Forgot password?
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerLinksContainer}>
            <Text style={styles.footerLinkText} onPress={onPrivacyPolicy}>
              Privacy Policy
            </Text>
            <Text style={styles.footerLinkText} onPress={onTermsOfService}>
              Terms of Service
            </Text>
            <Text style={styles.footerLinkText} onPress={onSupport}>
              Support
            </Text>
          </View>
          <Text style={styles.copyrightText}>© 2025 DiscBaboons</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

LoginScreen.propTypes = {
  errorMessage: PropTypes.string,
  onForgotPassword: PropTypes.func,
  onForgotUsername: PropTypes.func,
  onCreateAccount: PropTypes.func,
  onPrivacyPolicy: PropTypes.func,
  onTermsOfService: PropTypes.func,
  onSupport: PropTypes.func,
};

LoginScreen.defaultProps = {
  errorMessage: null,
  onForgotPassword: () => {},
  onForgotUsername: () => {},
  onCreateAccount: () => {},
  onPrivacyPolicy: () => {},
  onTermsOfService: () => {},
  onSupport: () => {},
};

export default LoginScreen;
