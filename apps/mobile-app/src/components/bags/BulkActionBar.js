/**
 * BulkActionBar Component
 * Bottom action bar with bulk actions for multi-select mode
 */

import { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function BulkActionBar({
  selectedCount, onMove, onMarkLost, visible,
}) {
  const colors = useThemeColors();

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  const isDisabled = selectedCount === 0;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    button: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.xs,
      opacity: isDisabled ? 0.5 : 1,
    },
    moveButton: {
      backgroundColor: isDisabled ? colors.surfaceVariant : colors.info,
      borderRadius: 8,
    },
    markLostButton: {
      backgroundColor: isDisabled ? colors.surfaceVariant : colors.error,
      borderRadius: 8,
    },
    buttonText: {
      ...typography.body2,
      color: isDisabled ? colors.onSurfaceVariant : colors.onPrimary,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
    iconStyle: {
      color: isDisabled ? colors.onSurfaceVariant : colors.onPrimary,
    },
  });

  const handlePress = (callback) => {
    if (!isDisabled) {
      callback();
    }
  };

  return (
    <View testID="bulk-action-bar" style={styles.container}>
      <TouchableOpacity
        testID="bulk-move-button"
        style={[styles.button, styles.moveButton]}
        onPress={() => handlePress(onMove)}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityRole="button"
      >
        <Icon name="folder-open-outline" size={20} style={styles.iconStyle} />
        <Text style={styles.buttonText}>{`Move ${selectedCount}`}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="bulk-mark-lost-button"
        style={[styles.button, styles.markLostButton]}
        onPress={() => handlePress(onMarkLost)}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityRole="button"
      >
        <Icon name="warning-outline" size={20} style={styles.iconStyle} />
        <Text style={styles.buttonText}>{`Mark ${selectedCount} as Lost`}</Text>
      </TouchableOpacity>

    </View>
  );
}

BulkActionBar.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onMove: PropTypes.func.isRequired,
  onMarkLost: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
};

// Add display name for React DevTools
BulkActionBar.displayName = 'BulkActionBar';

export default memo(BulkActionBar);
