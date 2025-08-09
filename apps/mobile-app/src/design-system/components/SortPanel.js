/**
 * SortPanel Component
 * Dedicated panel for disc sorting options
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../spacing';
import { typography } from '../typography';
import Button from '../../components/Button';

// Sort options with user-friendly labels and direction text
const SORT_OPTIONS = [
  {
    key: 'model',
    label: 'Disc Name',
    type: 'string',
    ascText: 'A-Z',
    descText: 'Z-A',
  },
  {
    key: 'brand',
    label: 'Brand',
    type: 'string',
    ascText: 'A-Z',
    descText: 'Z-A',
  },
  {
    key: 'speed',
    label: 'Speed',
    type: 'number',
    ascText: '1-15',
    descText: '15-1',
  },
  {
    key: 'glide',
    label: 'Glide',
    type: 'number',
    ascText: '1-7',
    descText: '7-1',
  },
  {
    key: 'turn',
    label: 'Turn',
    type: 'number',
    ascText: '-5 to +2',
    descText: '+2 to -5',
  },
  {
    key: 'fade',
    label: 'Fade',
    type: 'number',
    ascText: '0-5',
    descText: '5-0',
  },
];

function SortPanel({
  visible,
  onClose,
  onApplySort,
  currentSort = { field: null, direction: 'asc' },
}) {
  const colors = useThemeColors();
  const [localSort, setLocalSort] = useState(currentSort);

  // Sync local sort when currentSort changes or panel becomes visible
  React.useEffect(() => {
    if (visible) {
      setLocalSort(currentSort);
    }
  }, [currentSort, visible]);

  // Memoize styles
  // eslint-disable-next-line no-use-before-define
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Handle sort selection
  const handleSortChange = (field) => {
    if (localSort.field === field) {
      // Toggle direction if same field
      setLocalSort((prev) => ({
        field,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      // New field, default to ascending
      setLocalSort({
        field,
        direction: 'asc',
      });
    }
  };

  // Clear sort
  const clearSort = () => {
    setLocalSort({ field: null, direction: 'asc' });
  };

  // Apply sort
  const applySort = () => {
    onApplySort(localSort);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sort Discs</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sort Direction Section - At the top */}
          <View style={styles.firstSection}>
            <View style={styles.sectionHeader}>
              <Icon
                name="swap-vertical-outline"
                size={20}
                color={colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Sort Direction</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Choose ascending or descending order
            </Text>
            <View style={styles.directionOptions}>
              <View style={styles.directionOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.directionOption,
                    localSort.direction === 'asc' && styles.directionOptionSelected,
                  ]}
                  onPress={() => setLocalSort((prev) => ({ ...prev, direction: 'asc' }))}
                >
                  <View style={styles.directionOptionContent}>
                    <Icon
                      name="arrow-up-outline"
                      size={24}
                      color={localSort.direction === 'asc' ? colors.primary : colors.textLight}
                    />
                    <Text style={[
                      styles.directionOptionLabel,
                      localSort.direction === 'asc' && styles.directionOptionLabelSelected,
                    ]}
                    >
                      Ascending
                    </Text>
                    <Text style={[
                      styles.directionOptionDescription,
                      localSort.direction === 'asc' && styles.directionOptionDescriptionSelected,
                    ]}
                    >
                      A-Z, 1-15
                    </Text>
                  </View>
                  {localSort.direction === 'asc' && (
                    <Icon
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.directionOption,
                    localSort.direction === 'desc' && styles.directionOptionSelected,
                  ]}
                  onPress={() => setLocalSort((prev) => ({ ...prev, direction: 'desc' }))}
                >
                  <View style={styles.directionOptionContent}>
                    <Icon
                      name="arrow-down-outline"
                      size={24}
                      color={localSort.direction === 'desc' ? colors.primary : colors.textLight}
                    />
                    <Text style={[
                      styles.directionOptionLabel,
                      localSort.direction === 'desc' && styles.directionOptionLabelSelected,
                    ]}
                    >
                      Descending
                    </Text>
                    <Text style={[
                      styles.directionOptionDescription,
                      localSort.direction === 'desc' && styles.directionOptionDescriptionSelected,
                    ]}
                    >
                      Z-A, 15-1
                    </Text>
                  </View>
                  {localSort.direction === 'desc' && (
                    <Icon
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Current Sort Status - Show what's active */}
          {localSort.field && (
            <View style={styles.currentSortSection}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="checkmark-done-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Active Sort</Text>
              </View>
              <View style={styles.currentSortDisplay}>
                <View style={styles.currentSortField}>
                  <Text style={styles.currentSortFieldText}>
                    {SORT_OPTIONS.find((opt) => opt.key === localSort.field)?.label || 'Unknown'}
                  </Text>
                </View>
                <Icon
                  name={localSort.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.currentSortDirection}>
                  <Text style={styles.currentSortDirectionText}>
                    {SORT_OPTIONS.find((opt) => opt.key === localSort.field)?.[
                      localSort.direction === 'asc' ? 'ascText' : 'descText'
                    ] || (localSort.direction === 'asc' ? 'Low to High' : 'High to Low')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Sort Field Options */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="list-outline"
                size={20}
                color={colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Sort By Field</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Choose what to sort the discs by
            </Text>
            <View style={styles.sortFieldOptions}>
              {SORT_OPTIONS.map((option) => {
                const isSelected = localSort.field === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortFieldOption,
                      isSelected && styles.sortFieldOptionSelected,
                    ]}
                    onPress={() => handleSortChange(option.key)}
                  >
                    <View style={styles.sortFieldOptionContent}>
                      <Text style={[
                        styles.sortFieldOptionLabel,
                        isSelected && styles.sortFieldOptionLabelSelected,
                      ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.sortFieldOptionDescription,
                        isSelected && styles.sortFieldOptionDescriptionSelected,
                      ]}
                      >
                        {localSort.direction === 'asc' ? option.ascText : option.descText}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Clear Sort"
            onPress={clearSort}
            variant="outline"
            style={styles.footerButton}
          />
          <Button
            title={`Apply${localSort.field ? ' Sort' : ''}`}
            onPress={applySort}
            variant="primary"
            style={styles.footerButton}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '65%',
    paddingTop: spacing.lg,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  firstSection: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionIcon: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textLight,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  currentSortSection: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 16,
    padding: spacing.lg,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  currentSortTitle: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  currentSortDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  currentSortField: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  currentSortFieldText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
  currentSortDirection: {
    backgroundColor: `${colors.primary}20`,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  currentSortDirectionText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  directionOptions: {
    marginTop: spacing.sm,
  },
  directionOptionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  directionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Platform.select({
      ios: 10,
      android: 12,
    }),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  directionOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: Platform.select({
      ios: `${colors.primary}10`,
      android: `${colors.primary}15`,
    }),
  },
  directionOptionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  directionOptionLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  directionOptionLabelSelected: {
    color: colors.primary,
  },
  directionOptionDescription: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 14,
  },
  directionOptionDescriptionSelected: {
    color: colors.primary,
  },
  sortFieldOptions: {
    gap: spacing.sm,
  },
  sortFieldOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: Platform.select({
      ios: 10,
      android: 12,
    }),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortFieldOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: Platform.select({
      ios: `${colors.primary}10`,
      android: `${colors.primary}15`,
    }),
  },
  sortFieldOptionContent: {
    flex: 1,
  },
  sortFieldOptionLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sortFieldOptionLabelSelected: {
    color: colors.primary,
  },
  sortFieldOptionDescription: {
    ...typography.caption,
    color: colors.textLight,
    lineHeight: 16,
  },
  sortFieldOptionDescriptionSelected: {
    color: colors.primary,
  },
  sortDirectionContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sortDirectionLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sortDirectionToggle: {
    gap: spacing.sm,
  },
  sortDirectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortDirectionOptionActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  sortDirectionText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  sortDirectionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl, // Same safe area padding for both platforms
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});

SortPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApplySort: PropTypes.func.isRequired,
  currentSort: PropTypes.shape({
    field: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc']),
  }),
};

SortPanel.defaultProps = {
  currentSort: { field: null, direction: 'asc' },
};

export default SortPanel;
