/**
 * Button Component
 */

import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';

function Button({ title, onPress, variant = 'primary' }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: variant === 'primary' ? colors.primary : colors.surface,
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: variant === 'secondary' ? colors.border : undefined,
    },
    text: {
      ...typography.body,
      fontWeight: 'bold',
      color: variant === 'primary' ? '#FFFFFF' : colors.text,
    },
  });

  return (
    <TouchableOpacity testID="button" style={styles.button} onPress={onPress}>
      <Text testID="button-text" style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

Button.propTypes = {
  title: PropTypes.string,
  onPress: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};

Button.defaultProps = {
  title: '',
  onPress: () => {},
  variant: 'primary',
};

export default Button;
