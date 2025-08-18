/**
 * MultiSelectHeader Component
 * Header for multi-select mode with selection count and action buttons
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

function MultiSelectHeader({
  selectedCount,
  onSelectAll,
  onCancel,
  showFlightPaths,
  onToggleFlightPaths,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleText: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
    },
    buttonText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    button: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    centerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    flightPathToggle: {
      padding: spacing.xs,
      borderRadius: 4,
      backgroundColor: showFlightPaths ? colors.primary : 'transparent',
    },
  });

  const displayText = selectedCount === 0 ? 'Select items' : `${selectedCount} selected`;

  return (
    <View testID="multi-select-header" style={styles.container}>
      <TouchableOpacity onPress={onCancel} style={styles.button}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.centerSection}>
        <Text style={styles.titleText}>{displayText}</Text>
        {showFlightPaths !== undefined && onToggleFlightPaths && (
          <TouchableOpacity
            testID="flight-path-toggle"
            onPress={onToggleFlightPaths}
            style={styles.flightPathToggle}
          >
            <Icon
              name="trending-up"
              size={18}
              color={showFlightPaths ? colors.background : colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={onSelectAll} style={styles.button}>
        <Text style={styles.buttonText}>Select All</Text>
      </TouchableOpacity>
    </View>
  );
}

MultiSelectHeader.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showFlightPaths: PropTypes.bool,
  onToggleFlightPaths: PropTypes.func,
};

MultiSelectHeader.defaultProps = {
  showFlightPaths: undefined,
  onToggleFlightPaths: undefined,
};

// Add display name for React DevTools
MultiSelectHeader.displayName = 'MultiSelectHeader';

export default memo(MultiSelectHeader);
