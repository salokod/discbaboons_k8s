/**
 * LogoutButton Component
 */

import { memo, useCallback, useState } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Platform, Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';

function LogoutButton({ onLogout }) {
  const colors = useThemeColors();
  const { logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Use provided onLogout prop, otherwise fallback to AuthContext logout
  const handleLogout = onLogout || authLogout;

  const handleConfirmedLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await handleLogout();
    } catch (error) {
      // Handle errors silently - the AuthContext or parent component will handle error display
      // eslint-disable-next-line no-console
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout]);

  const handlePress = useCallback(() => {
    if (isLoading) return; // Prevent multiple clicks during loading
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleConfirmedLogout,
        },
      ],
    );
  }, [handleConfirmedLogout, isLoading]);

  const styles = StyleSheet.create({
    button: {
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.lg,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      alignItems: 'center',
      backgroundColor: isLoading ? colors.textLight : colors.surface,
      borderWidth: 1,
      borderColor: isLoading ? colors.textLight : colors.border,
      opacity: isLoading ? 0.7 : 1,
      ...Platform.select({
        android: {
          elevation: isLoading ? 0 : 2,
        },
        ios: {
          shadowColor: isLoading ? 'transparent' : colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isLoading ? 0 : 0.1,
          shadowRadius: 2,
        },
      }),
    },
    text: {
      ...typography.body,
      fontWeight: Platform.select({
        ios: 'bold',
        android: '700',
      }),
      fontSize: Platform.select({
        ios: typography.body.fontSize,
        android: typography.body.fontSize + 1,
      }),
      color: isLoading ? colors.white : colors.text,
    },
  });

  return (
    <TouchableOpacity
      testID="logout-button"
      style={styles.button}
      onPress={handlePress}
      disabled={isLoading}
      accessibilityLabel={isLoading ? 'Logging out' : 'Logout button'}
      accessibilityHint={isLoading ? 'Logout in progress' : 'Tap to logout from the application'}
    >
      <Text testID="logout-button-text" style={styles.text}>
        {isLoading ? 'Logging out...' : 'Logout'}
      </Text>
    </TouchableOpacity>
  );
}

LogoutButton.propTypes = {
  onLogout: PropTypes.func,
};

LogoutButton.defaultProps = {
  onLogout: undefined,
};

// Add display name for React DevTools
LogoutButton.displayName = 'LogoutButton';

export default memo(LogoutButton);
