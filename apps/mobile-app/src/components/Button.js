/**
 * Button Component
 */

import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';

function Button({
  title, onPress, variant = 'primary', disabled = false,
}) {
  const colors = useThemeColors();

  const getBackgroundColor = () => {
    if (disabled) {
      return colors.textLight; // Gray out disabled buttons
    }
    return variant === 'primary' ? colors.primary : colors.surface;
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.surface; // Light text on disabled buttons
    }
    return variant === 'primary' ? '#FFFFFF' : colors.text;
  };

  const styles = StyleSheet.create({
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: variant === 'secondary' ? colors.border : undefined,
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      ...typography.body,
      fontWeight: 'bold',
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
    >
      <Text testID="button-text" style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

Button.propTypes = {
  title: PropTypes.string,
  onPress: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  title: '',
  onPress: () => {},
  variant: 'primary',
  disabled: false,
};

export default Button;
