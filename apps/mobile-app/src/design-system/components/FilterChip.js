/**
 * FilterChip Component
 */

import { memo } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../spacing';
import { typography } from '../typography';

function FilterChip({
  label, onPress, selected = false, disabled = false,
}) {
  const colors = useThemeColors();

  const getBackgroundColor = () => {
    if (disabled) {
      return colors.textLight;
    }
    return selected ? colors.primary : colors.surface;
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.white;
    }
    return selected ? colors.textOnPrimary : colors.text;
  };

  const styles = StyleSheet.create({
    chip: {
      paddingVertical: Platform.select({
        ios: spacing.xs,
        android: spacing.sm,
      }),
      paddingHorizontal: spacing.md,
      borderRadius: Platform.select({
        ios: 16,
        android: 20,
      }),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getBackgroundColor(),
      borderWidth: selected ? 0 : 1,
      borderColor: colors.border,
      opacity: disabled ? 0.6 : 1,
    },
    text: {
      ...typography.caption,
      fontWeight: Platform.select({
        ios: selected ? 'bold' : 'normal',
        android: selected ? '700' : 'normal',
      }),
      color: getTextColor(),
    },
  });

  return (
    <TouchableOpacity
      testID="filter-chip"
      style={styles.chip}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityState={{ disabled, selected }}
      accessibilityRole="button"
    >
      <Text testID="filter-chip-text" style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

FilterChip.propTypes = {
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
};

FilterChip.defaultProps = {
  onPress: () => {},
  selected: false,
  disabled: false,
};

// Add display name for React DevTools
FilterChip.displayName = 'FilterChip';

export default memo(FilterChip);
