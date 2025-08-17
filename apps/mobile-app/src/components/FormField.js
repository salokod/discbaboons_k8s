/**
 * FormField Component
 * Reusable form field wrapper with consistent layout and validation
 */

import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';

function FormField({
  label, children, required = false, error, maxLength, showCounter = false, value = '',
}) {
  const colors = useThemeColors();

  // Character counter color based on percentage
  const getCounterColor = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return colors.error;
    if (percentage >= 80) return colors.warning;
    return colors.textLight;
  };

  const currentCount = (value || '').length;

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    label: {
      ...typography.overline,
      color: colors.text,
      textTransform: 'uppercase',
    },
    requiredIndicator: {
      ...typography.overline,
      color: colors.error,
      marginLeft: spacing.xs / 2,
    },
    errorMessage: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
      fontWeight: '500',
    },
    characterCounter: {
      ...typography.captionSmall,
      textAlign: 'right',
      marginTop: spacing.xs,
      fontWeight: '600',
      color: getCounterColor(currentCount, maxLength),
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredIndicator}>*</Text>}
        </View>
      )}
      {children}
      {showCounter && maxLength && (
        <Text style={styles.characterCounter}>
          {currentCount}
          /
          {maxLength}
        </Text>
      )}
      {error && error.trim().length > 0 && (
        <Text style={styles.errorMessage}>{error}</Text>
      )}
    </View>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  maxLength: PropTypes.number,
  showCounter: PropTypes.bool,
  value: PropTypes.string,
};

FormField.defaultProps = {
  label: undefined,
  required: false,
  error: undefined,
  maxLength: undefined,
  showCounter: false,
  value: '',
};

export default FormField;
