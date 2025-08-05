/**
 * LoginScreen
 */

import {
  View, StyleSheet, Image, Text, TouchableOpacity,
} from 'react-native';
import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';
import Input from '../components/Input';
import Button from '../components/Button';

function LoginScreen({
  errorMessage = null, onForgotPassword, onForgotUsername, onCreateAccount,
}) {
  const colors = useThemeColors();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [activeTab, setActiveTab] = useState('signin');

  // Form validation logic
  const isUsernameValid = useMemo(() => username.length >= 4 && username.length <= 20, [username]);

  const isPasswordValid = useMemo(() => password.length >= 8 && password.length <= 32, [password]);

  const isFormValid = useMemo(
    () => isUsernameValid && isPasswordValid,
    [isUsernameValid, isPasswordValid],
  );

  const handleLogin = () => {
    // Clear any previous errors
    setLoginError(null);

    // TODO: Replace with actual API call
    // For demo purposes, show error for invalid test credentials
    if (username === 'demo' && password === 'wrongpass') {
      setLoginError('Invalid username or password');
      return;
    }

    // Mock successful login
    login({
      user: { username },
      tokens: { access: 'mock-jwt-token' },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    logo: {
      width: 150,
      height: 150,
      resizeMode: 'contain',
    },
    formContainer: {
      gap: spacing.md,
    },
    errorContainer: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.error,
      borderRadius: 8,
      marginBottom: spacing.md,
    },
    errorText: {
      ...typography.body,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: spacing.lg,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: colors.secondary,
    },
    inactiveTab: {
      backgroundColor: 'transparent',
    },
    tabText: {
      ...typography.body,
      fontWeight: '600',
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    inactiveTabText: {
      color: colors.text,
    },
    secondaryActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    linkText: {
      ...typography.body,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
  });

  return (
    <View testID="login-screen" style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          testID="logo-image"
          source={require('../../discbaboon_logo_blue.png')}
          style={styles.logo}
        />
      </View>

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
        <Input
          placeholder="Username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (loginError) setLoginError(null);
          }}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (loginError) setLoginError(null);
          }}
          secureTextEntry
        />
        <Button
          title={activeTab === 'signin' ? 'Log In' : 'Create Account'}
          onPress={activeTab === 'signin' ? handleLogin : onCreateAccount}
          variant="primary"
          disabled={!isFormValid}
        />

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
  );
}

LoginScreen.propTypes = {
  errorMessage: PropTypes.string,
  onForgotPassword: PropTypes.func,
  onForgotUsername: PropTypes.func,
  onCreateAccount: PropTypes.func,
};

LoginScreen.defaultProps = {
  errorMessage: null,
  onForgotPassword: () => {},
  onForgotUsername: () => {},
  onCreateAccount: () => {},
};

export default LoginScreen;
