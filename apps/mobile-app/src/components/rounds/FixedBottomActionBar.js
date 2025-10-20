/**
 * FixedBottomActionBar Component
 * Fixed bottom action bar with primary and optional secondary actions
 * Platform-adaptive styling with safe area handling
 */

import { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { triggerSuccessHaptic } from '../../services/hapticService';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function FixedBottomActionBar({
  primaryLabel,
  onPrimaryPress,
  primaryDisabled = false,
  secondaryLabel,
  secondaryIcon,
  onSecondaryPress,
}) {
  const colors = useThemeColors();

  const handlePrimaryPress = () => {
    if (primaryDisabled) return;

    // Trigger haptic feedback (cross-platform)
    triggerSuccessHaptic();

    // Call the user-provided callback
    onPrimaryPress();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Platform.select({
        ios: spacing.xl,
        android: spacing.lg,
      }),
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    primaryButton: {
      flex: 1,
      backgroundColor: primaryDisabled ? colors.surfaceVariant : colors.primary,
      paddingVertical: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: primaryDisabled ? 0.6 : 1,
    },
    primaryButtonText: {
      ...typography.body,
      color: primaryDisabled ? colors.onSurfaceVariant : colors.onPrimary,
      fontWeight: '600',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginRight: spacing.md,
    },
    secondaryButtonText: {
      ...typography.body2,
      color: colors.primary,
      marginLeft: spacing.xs,
    },
  });

  return (
    <View testID="fixed-bottom-action-bar" style={styles.container}>
      {secondaryLabel && secondaryIcon && onSecondaryPress && (
        <TouchableOpacity
          testID="secondary-action-button"
          style={styles.secondaryButton}
          onPress={onSecondaryPress}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
        >
          <Icon name={secondaryIcon} size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        testID="primary-action-button"
        style={styles.primaryButton}
        onPress={primaryDisabled ? undefined : handlePrimaryPress}
        disabled={primaryDisabled}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        accessibilityState={{ disabled: primaryDisabled }}
      >
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

FixedBottomActionBar.propTypes = {
  primaryLabel: PropTypes.string.isRequired,
  onPrimaryPress: PropTypes.func.isRequired,
  primaryDisabled: PropTypes.bool,
  secondaryLabel: PropTypes.string,
  secondaryIcon: PropTypes.string,
  onSecondaryPress: PropTypes.func,
};

FixedBottomActionBar.defaultProps = {
  primaryDisabled: false,
  secondaryLabel: undefined,
  secondaryIcon: undefined,
  onSecondaryPress: undefined,
};

// Add display name for React DevTools
FixedBottomActionBar.displayName = 'FixedBottomActionBar';

export default memo(FixedBottomActionBar);
