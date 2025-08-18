/**
 * BagDetailHeader Component
 * Header content for BagDetailScreen to use with FlatList ListHeaderComponent
 */

import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import MultiSelectHeader from './MultiSelectHeader';
import BaboonBagBreakdownModal from '../modals/BaboonBagBreakdownModal';
import BaboonsVisionModal from '../modals/BaboonsVisionModal';

function BagDetailHeader({
  bag,
  isMultiSelectMode,
  selectedCount,
  activeFilterCount,
  sort,
  onAddDisc,
  onSort,
  onFilter,
  onSelectAll,
  onCancelMultiSelect,
  onEnterMultiSelect,
  onClearFiltersAndSort,
  filteredDiscCount,
}) {
  const colors = useThemeColors();

  // Determine sort icon name
  const sortIconName = React.useMemo(() => {
    if (sort.field) {
      return sort.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline';
    }
    return 'swap-vertical-outline';
  }, [sort]);

  // Calculate disc count text
  const discCountText = React.useMemo(() => {
    if (!bag?.bag_contents) return '';

    const totalCount = bag.bag_contents.length;
    const hasFiltersOrSort = activeFilterCount > 0 || sort.field;

    if (hasFiltersOrSort && filteredDiscCount !== undefined) {
      return `Your Discs (${filteredDiscCount} of ${totalCount})`;
    }

    return `Your Discs (${totalCount})`;
  }, [bag?.bag_contents, activeFilterCount, sort.field, filteredDiscCount]);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.select({
        ios: spacing.xl,
        android: spacing.lg,
      }),
      backgroundColor: colors.background,
    },
    // Header Section (matching CreateBagScreen)
    header: {
      marginBottom: spacing.xs * 1.5,
      alignItems: 'center',
    },
    headerTitle: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    discCountBadge: {
      backgroundColor: colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: spacing.md,
      alignSelf: 'center',
    },
    discCountText: {
      ...typography.bodyBold,
      color: colors.primary,
    },
    clearAllButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.error,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    clearAllButtonText: {
      ...typography.caption,
      color: colors.surface,
      fontWeight: '700',
      fontSize: 12,
    },
    quickActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    analyticsActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xl * 1.5,
    },
    actionButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    actionButtonText: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
      fontSize: 12,
    },
    actionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    actionButtonTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{bag?.name || 'Bag Details'}</Text>
        {bag?.description && (
          <Text style={styles.headerSubtitle}>{bag.description}</Text>
        )}
      </View>

      {/* Disc Count Section */}
      {bag?.bag_contents && bag.bag_contents.length > 0 && (
        <View style={styles.discCountBadge}>
          <Text style={styles.discCountText}>
            {discCountText}
          </Text>
        </View>
      )}

      {/* Clear All Button (only show if filters or sort are active) */}
      {(activeFilterCount > 0 || sort.field) && (
        <TouchableOpacity style={styles.clearAllButton} onPress={onClearFiltersAndSort}>
          <Text style={styles.clearAllButtonText}>
            Clear All (
            {activeFilterCount + (sort.field ? 1 : 0)}
            )
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      {!isMultiSelectMode ? (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onAddDisc}>
            <Icon name="add-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Add Disc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              sort.field && styles.actionButtonActive,
            ]}
            onPress={onSort}
          >
            <Icon
              name={sortIconName}
              size={16}
              color={sort.field ? colors.primary : colors.textLight}
            />
            <Text style={[
              styles.actionButtonText,
              sort.field && styles.actionButtonTextActive,
            ]}
            >
              Sort
              {sort.field ? ' (1)' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              activeFilterCount > 0 && styles.actionButtonActive,
            ]}
            onPress={onFilter}
          >
            <Icon
              name="funnel-outline"
              size={16}
              color={activeFilterCount > 0 ? colors.primary : colors.textLight}
            />
            <Text style={[
              styles.actionButtonText,
              activeFilterCount > 0 && styles.actionButtonTextActive,
            ]}
            >
              Filter
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="select-button"
            style={styles.actionButton}
            onPress={onEnterMultiSelect}
          >
            <Icon name="checkmark-circle-outline" size={16} color={colors.textLight} />
            <Text style={styles.actionButtonText}>Select</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <MultiSelectHeader
            selectedCount={selectedCount}
            onSelectAll={onSelectAll}
            onCancel={onCancelMultiSelect}
          />
          {/* Keep Sort and Filter available in multi-select mode */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                sort.field && styles.actionButtonActive,
              ]}
              onPress={onSort}
            >
              <Icon
                name={sortIconName}
                size={16}
                color={sort.field ? colors.primary : colors.textLight}
              />
              <Text style={[
                styles.actionButtonText,
                sort.field && styles.actionButtonTextActive,
              ]}
              >
                Sort
                {sort.field ? ' (1)' : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                activeFilterCount > 0 && styles.actionButtonActive,
              ]}
              onPress={onFilter}
            >
              <Icon
                name="funnel-outline"
                size={16}
                color={activeFilterCount > 0 ? colors.primary : colors.textLight}
              />
              <Text style={[
                styles.actionButtonText,
                activeFilterCount > 0 && styles.actionButtonTextActive,
              ]}
              >
                Filter
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Analytics Row */}
      {bag?.bag_contents && bag.bag_contents.length > 0 && (
        <View style={styles.analyticsActions}>
          <BaboonBagBreakdownModal bag={bag} />
          <BaboonsVisionModal bag={bag} />
        </View>
      )}
    </View>
  );
}

BagDetailHeader.propTypes = {
  bag: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    bag_contents: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      model: PropTypes.string,
      brand: PropTypes.string,
    })),
  }),
  isMultiSelectMode: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
  activeFilterCount: PropTypes.number.isRequired,
  sort: PropTypes.shape({
    field: PropTypes.string,
    direction: PropTypes.string,
  }).isRequired,
  onAddDisc: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  onFilter: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onCancelMultiSelect: PropTypes.func.isRequired,
  onEnterMultiSelect: PropTypes.func.isRequired,
  onClearFiltersAndSort: PropTypes.func.isRequired,
  filteredDiscCount: PropTypes.number,
};

BagDetailHeader.defaultProps = {
  bag: null,
  filteredDiscCount: undefined,
};

BagDetailHeader.displayName = 'BagDetailHeader';

export default memo(BagDetailHeader);
