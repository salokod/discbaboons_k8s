/**
 * CreatorBadge Component
 * Displays a creator badge with star icon and "CREATOR" text
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

function CreatorBadge() {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.creatorPrimary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: Platform.select({
        ios: 8,
        android: 6,
      }),
      borderWidth: 1,
      borderColor: colors.creatorPrimary,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: colors.creatorPrimary,
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
      color: colors.creatorSecondary,
      letterSpacing: 0.5,
    },
  });

  return (
    <View
      testID="creator-badge"
      style={styles.badge}
      accessibilityLabel="Creator badge"
      accessibilityHint="Indicates you are the creator of this round"
    >
      <Icon
        testID="creator-badge-icon"
        name="star"
        size={12}
        color={colors.creatorSecondary}
        style={styles.icon}
      />
      <Text style={styles.text}>CREATOR</Text>
    </View>
  );
}

// Add display name for React DevTools
CreatorBadge.displayName = 'CreatorBadge';

export default memo(CreatorBadge);
