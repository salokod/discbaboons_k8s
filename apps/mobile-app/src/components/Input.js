/**
 * Input Component
 */

import { TextInput, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';

function Input({
  placeholder, value, onChangeText, secureTextEntry = false, accessibilityLabel, accessibilityHint,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    input: {
      ...typography.body,
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.md,
      borderWidth: Platform.select({
        ios: 1,
        android: 0,
      }),
      borderColor: colors.border,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: Platform.select({
        ios: typography.body.fontSize,
        android: typography.body.fontSize + 1,
      }),
      ...Platform.select({
        android: {
          elevation: 1,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        },
      }),
    },
  });

  return (
    <TextInput
      testID="input"
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      accessibilityLabel={accessibilityLabel || placeholder}
      accessibilityHint={accessibilityHint || (secureTextEntry ? 'Password input field' : 'Text input field')}
    />
  );
}

Input.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func.isRequired,
  secureTextEntry: PropTypes.bool,
  accessibilityLabel: PropTypes.string,
  accessibilityHint: PropTypes.string,
};

Input.defaultProps = {
  placeholder: '',
  value: '',
  secureTextEntry: false,
  accessibilityLabel: undefined,
  accessibilityHint: undefined,
};

export default Input;
