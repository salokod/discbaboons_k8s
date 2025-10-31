/**
 * NavigationHeader Component
 * Reusable navigation header with back button and title
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';
import BackButton from './BackButton';

function NavigationHeader({
  title,
  onBack,
  backAccessibilityLabel,
  rightAction,
  rightIconName = 'settings-outline',
  rightAccessibilityLabel = 'Actions',
  rightComponent,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: Platform.select({
        ios: 60,
        android: 64,
      }),
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    centerSection: {
      flex: 3,
      alignItems: 'center',
    },
    rightSection: {
      flex: 1,
      alignItems: 'flex-end',
    },
    title: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
    },
    rightButton: {
      padding: spacing.sm,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 44,
    },
  });

  return (
    <View testID="navigation-header" style={styles.container}>
      <View style={styles.leftSection}>
        {onBack && (
          <BackButton
            onPress={onBack}
            accessibilityLabel={backAccessibilityLabel}
          />
        )}
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        {rightComponent || (rightAction && (
          <TouchableOpacity
            testID="right-action"
            style={styles.rightButton}
            onPress={rightAction}
            accessibilityRole="button"
            accessibilityLabel={rightAccessibilityLabel}
          >
            <Icon
              name={rightIconName}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

NavigationHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  backAccessibilityLabel: PropTypes.string,
  rightAction: PropTypes.func,
  rightIconName: PropTypes.string,
  rightAccessibilityLabel: PropTypes.string,
  rightComponent: PropTypes.node,
};

NavigationHeader.defaultProps = {
  onBack: null,
  backAccessibilityLabel: 'Go back',
  rightAction: null,
  rightIconName: 'settings-outline',
  rightAccessibilityLabel: 'Actions',
  rightComponent: null,
};

NavigationHeader.displayName = 'NavigationHeader';

export default memo(NavigationHeader);
