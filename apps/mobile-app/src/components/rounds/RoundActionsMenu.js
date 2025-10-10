/**
 * RoundActionsMenu Component
 * Renders action buttons for round management (pause, complete, delete)
 */

import { useMemo } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';

function RoundActionsMenu({ onPause, onComplete, onDelete }) {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      ...typography.body,
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    buttonTextDisabled: {
      color: colors.textLight,
    },
  }), [colors]);

  return (
    <View testID="round-actions-menu" style={styles.container}>
      <TouchableOpacity
        testID="pause-round-button"
        style={styles.button}
        onPress={onPause}
        accessibilityRole="button"
        accessibilityLabel="Pause round"
        accessibilityHint="Pauses the current round and saves progress"
      >
        <Icon name="pause-outline" size={18} color={colors.text} />
        <Text style={styles.buttonText}>Pause</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="complete-round-button"
        style={styles.button}
        onPress={onComplete}
        accessibilityRole="button"
        accessibilityLabel="Complete round"
        accessibilityHint="Marks the round as finished and locks scores"
      >
        <Icon name="checkmark-circle-outline" size={18} color={colors.text} />
        <Text style={styles.buttonText}>Complete</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="delete-round-button"
        style={[styles.button, styles.buttonDisabled]}
        disabled
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete round"
        accessibilityHint="Permanently deletes this round"
      >
        <Icon name="trash-outline" size={18} color={colors.textLight} />
        <Text style={[styles.buttonText, styles.buttonTextDisabled]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

RoundActionsMenu.propTypes = {
  onPause: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};

RoundActionsMenu.defaultProps = {
  onDelete: null,
};

export default RoundActionsMenu;
