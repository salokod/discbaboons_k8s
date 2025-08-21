/**
 * BackButton Component
 * Reusable back navigation button
 */

import { memo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';

function BackButton({ onPress, disabled = false, accessibilityLabel = 'Go back' }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    button: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44, // Minimum touch target size
      minWidth: 44,
      opacity: disabled ? 0.5 : 1,
    },
  });

  return (
    <TouchableOpacity
      testID="back-button"
      style={styles.button}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Icon
        name={Platform.select({
          ios: 'chevron-back',
          android: 'arrow-back',
        })}
        size={24}
        color={colors.text}
      />
    </TouchableOpacity>
  );
}

BackButton.propTypes = {
  onPress: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  accessibilityLabel: PropTypes.string,
};

BackButton.defaultProps = {
  disabled: false,
  accessibilityLabel: 'Go back',
};

BackButton.displayName = 'BackButton';

export default memo(BackButton);
