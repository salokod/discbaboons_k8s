/**
 * AmountInput Component
 */

import {
  memo, useMemo,
} from 'react';
import {
  View, TextInput, StyleSheet, Platform, Text,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../spacing';
import { typography } from '../typography';

function AmountInput({
  value,
  onChangeText,
  placeholder = '0.00',
  disabled = false,
}) {
  const colors = useThemeColors();

  const handleTextChange = (text) => {
    // Filter input to allow only numbers and one decimal point
    let filtered = text.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    const decimalCount = (filtered.match(/\./g) || []).length;
    if (decimalCount > 1) {
      // Keep first decimal and remove subsequent ones
      const firstDecimalIndex = filtered.indexOf('.');
      filtered = filtered.slice(0, firstDecimalIndex + 1)
        + filtered.slice(firstDecimalIndex + 1).replace(/\./g, '');
    }

    // Limit to 2 decimal places
    const parts = filtered.split('.');
    if (parts.length === 2 && parts[1].length > 2) {
      filtered = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }

    if (onChangeText) {
      onChangeText(filtered);
    }
  };

  const handleBlur = () => {
    if (!value || value.length === 0) {
      return;
    }

    // Format to 2 decimal places
    const numValue = parseFloat(value);
    if (!Number.isNaN(numValue)) {
      const formatted = numValue.toFixed(2);
      if (onChangeText && formatted !== value) {
        onChangeText(formatted);
      }
    }
  };

  // Memoize styles to prevent component recreation
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 10,
        android: 12,
      }),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.select({
        ios: spacing.sm,
        android: spacing.md,
      }),
      opacity: disabled ? 0.6 : 1,
    },
    prefix: {
      ...typography.body,
      color: colors.text,
      marginRight: spacing.xs,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
  }), [colors, disabled]);

  return (
    <View testID="amount-input" style={styles.container}>
      {value && value.length > 0 && (
        <Text testID="amount-prefix" style={styles.prefix}>$</Text>
      )}
      <TextInput
        testID="amount-input-field"
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={handleTextChange}
        onBlur={handleBlur}
        editable={!disabled}
        keyboardType="decimal-pad"
        accessibilityLabel="Amount input"
        accessibilityHint="Enter an amount"
      />
    </View>
  );
}

AmountInput.propTypes = {
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

AmountInput.defaultProps = {
  value: '',
  onChangeText: () => {},
  placeholder: '0.00',
  disabled: false,
};

AmountInput.displayName = 'AmountInput';

export default memo(AmountInput);
