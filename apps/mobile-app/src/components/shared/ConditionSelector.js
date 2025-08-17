/**
 * ConditionSelector Component
 * Reusable condition selection interface for disc condition rating
 */

import {
  View, TouchableOpacity, Text, StyleSheet, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New', icon: 'sparkles-outline' },
  { value: 'good', label: 'Good', icon: 'thumbs-up-outline' },
  { value: 'worn', label: 'Worn', icon: 'time-outline' },
  { value: 'beat-in', label: 'Beat-in', icon: 'fitness-outline' },
];

function ConditionSelector({ condition, onConditionChange, disabled = false }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    conditionButtons: {
      marginTop: spacing.sm,
    },
    conditionButtonRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    conditionButton: {
      flex: 1,
      aspectRatio: 1.8, // Wider than tall for better text fit
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    conditionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    conditionButtonText: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 12,
    },
    conditionButtonTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
  });

  const handleConditionSelect = (selectedCondition) => {
    if (disabled) return;
    const newCondition = condition === selectedCondition ? '' : selectedCondition;
    onConditionChange(newCondition);
  };

  return (
    <View style={styles.conditionButtons} testID="condition-selector">
      <View style={styles.conditionButtonRow}>
        {CONDITION_OPTIONS.slice(0, 2).map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.conditionButton,
              condition === option.value && styles.conditionButtonActive,
            ]}
            onPress={() => handleConditionSelect(option.value)}
            disabled={disabled}
          >
            <Icon
              name={option.icon}
              size={18}
              color={
                condition === option.value
                  ? colors.primary
                  : colors.textLight
              }
            />
            <Text
              style={[
                styles.conditionButtonText,
                condition === option.value
                  && styles.conditionButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.conditionButtonRow}>
        {CONDITION_OPTIONS.slice(2, 4).map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.conditionButton,
              condition === option.value && styles.conditionButtonActive,
            ]}
            onPress={() => handleConditionSelect(option.value)}
            disabled={disabled}
          >
            <Icon
              name={option.icon}
              size={18}
              color={
                condition === option.value
                  ? colors.primary
                  : colors.textLight
              }
            />
            <Text
              style={[
                styles.conditionButtonText,
                condition === option.value
                  && styles.conditionButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

ConditionSelector.propTypes = {
  condition: PropTypes.string.isRequired,
  onConditionChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ConditionSelector.defaultProps = {
  disabled: false,
};

export default ConditionSelector;
