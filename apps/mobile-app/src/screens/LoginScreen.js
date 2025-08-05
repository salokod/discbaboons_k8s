/**
 * LoginScreen
 */

import { View, StyleSheet, Image } from 'react-native';
import { useState, useMemo } from 'react';
import { useThemeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing } from '../design-system/spacing';
import Input from '../components/Input';
import Button from '../components/Button';

function LoginScreen() {
  const colors = useThemeColors();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Form validation logic
  const isUsernameValid = useMemo(() => username.length >= 4 && username.length <= 20, [username]);

  const isPasswordValid = useMemo(() => password.length >= 8 && password.length <= 32, [password]);

  const isFormValid = useMemo(
    () => isUsernameValid && isPasswordValid,
    [isUsernameValid, isPasswordValid],
  );

  const handleLogin = () => {
    // TODO: Replace with actual API call
    // For now, mock successful login
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

      <View style={styles.formContainer}>
        <Input
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Log In"
          onPress={handleLogin}
          variant="primary"
          disabled={!isFormValid}
        />
      </View>
    </View>
  );
}

export default LoginScreen;
