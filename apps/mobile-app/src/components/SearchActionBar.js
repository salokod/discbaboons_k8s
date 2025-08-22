/**
 * SearchActionBar Component
 * Fixed position bottom action bar that appears when search has no results
 */

import { memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';

function SearchActionBar({ visible, onClear, onAddDisc }) {
  const colors = useThemeColors();

  if (!visible) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Platform.select({
        ios: spacing.xl, // Extra padding for iOS home indicator
        android: spacing.lg,
      }),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      ...Platform.select({
        android: {
          elevation: 8,
        },
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }),
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    clearButton: {
      flex: 1.2,
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.lg,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearButtonText: {
      ...typography.body,
      color: colors.text,
      fontWeight: Platform.select({
        ios: '600',
        android: '700',
      }),
    },
    addDiscButton: {
      flex: 1,
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.lg,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      alignItems: 'center',
      backgroundColor: colors.primary,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
      }),
    },
    addDiscButtonText: {
      ...typography.body,
      color: colors.textOnPrimary,
      fontWeight: Platform.select({
        ios: 'bold',
        android: '700',
      }),
      fontSize: Platform.select({
        ios: typography.body.fontSize,
        android: typography.body.fontSize + 1,
      }),
    },
  });

  return (
    <View testID="search-action-bar" style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          testID="clear-button"
          style={styles.clearButton}
          onPress={onClear}
          accessibilityLabel="Clear search and filters"
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="add-disc-button"
          style={styles.addDiscButton}
          onPress={onAddDisc}
          accessibilityLabel="Add new disc"
        >
          <Text style={styles.addDiscButtonText}>Add New Disc</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

SearchActionBar.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClear: PropTypes.func.isRequired,
  onAddDisc: PropTypes.func.isRequired,
};

export default memo(SearchActionBar);
