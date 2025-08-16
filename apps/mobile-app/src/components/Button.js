/**
 * Button Component
 */

import { memo } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';

function Button({
  title, onPress, variant = 'primary', disabled = false, accessibilityLabel, accessibilityHint,
}) {
  const colors = useThemeColors();

  const getBackgroundColor = () => {
    if (disabled) {
      return colors.textLight; // Gray out disabled buttons
    }
    if (variant === 'primary') {
      return colors.primary;
    }
    if (variant === 'destructive') {
      return colors.error;
    }
    return colors.surface;
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.white; // White text on disabled buttons for contrast
    }
    if (variant === 'primary' || variant === 'destructive') {
      return colors.textOnPrimary;
    }
    return colors.text;
  };

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
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: variant === 'secondary' ? colors.border : undefined,
      opacity: disabled ? 0.6 : 1,
      ...Platform.select({
        android: {
          elevation: disabled ? 0 : 2,
        },
        ios: {
          shadowColor: disabled ? 'transparent' : colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
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
      color: getTextColor(),
    },
  });

  return (
    <TouchableOpacity
      testID="button"
      style={styles.button}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Text testID="button-text" style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

Button.propTypes = {
  title: PropTypes.string,
  onPress: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'destructive']),
  disabled: PropTypes.bool,
  accessibilityLabel: PropTypes.string,
  accessibilityHint: PropTypes.string,
};

Button.defaultProps = {
  title: '',
  onPress: () => {},
  variant: 'primary',
  disabled: false,
  accessibilityLabel: undefined,
  accessibilityHint: undefined,
};

// Add display name for React DevTools
Button.displayName = 'Button';

export default memo(Button);
