/**
 * AdminBadge Component
 * Displays an admin badge with crown icon and "ADMIN" text
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';

function AdminBadge() {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.adminPrimary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: Platform.select({
        ios: 8,
        android: 6,
      }),
      borderWidth: 1,
      borderColor: colors.adminSecondary,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: colors.adminSecondary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
        },
      }),
    },
    icon: {
      marginRight: spacing.xs,
    },
    text: {
      ...typography.caption,
      fontWeight: Platform.select({
        ios: 'bold',
        android: '700',
      }),
      fontSize: 10,
      color: colors.adminSecondary,
      letterSpacing: 0.5,
    },
  });

  return (
    <View
      testID="admin-badge"
      style={styles.badge}
      accessibilityLabel="Administrator badge"
      accessibilityHint="Indicates this user has administrator privileges"
    >
      <Icon
        testID="admin-badge-icon"
        name="diamond"
        size={12}
        color={colors.adminSecondary}
        style={styles.icon}
      />
      <Text style={styles.text}>ADMIN</Text>
    </View>
  );
}

// Add display name for React DevTools
AdminBadge.displayName = 'AdminBadge';

export default memo(AdminBadge);
