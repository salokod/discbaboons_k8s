/**
 * FilterPanel Component
 * Modern filter interface for disc search (sort moved to separate SortPanel)
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

// FilterPanel now handles only filters - sort moved to SortPanel

// Popular disc brands for quick filtering
const POPULAR_BRANDS = [
  'Innova',
  'Discraft',
  'Dynamic Discs',
  'Latitude 64',
  'MVP',
  'Axiom',
  'Kastaplast',
  'Prodigy',
  'Trilogy',
  'Gateway',
];

// Flight number ranges for quick filtering
const FLIGHT_RANGES = {
  speed: [
    { label: 'Putters (1-4)', range: '1-4' },
    { label: 'Midranges (5-6)', range: '5-6' },
    { label: 'Fairways (7-9)', range: '7-9' },
    { label: 'Drivers (10-15)', range: '10-15' },
  ],
  glide: [
    { label: 'Low Glide (1-3)', range: '1-3' },
    { label: 'Med Glide (4-5)', range: '4-5' },
    { label: 'High Glide (6-7)', range: '6-7' },
  ],
  turn: [
    { label: 'Overstable (-5 to -1)', range: '-5--1' },
    { label: 'Stable (0)', range: '0-0' },
    { label: 'Understable (1-2)', range: '1-2' },
  ],
  fade: [
    { label: 'Low Fade (0-1)', range: '0-1' },
    { label: 'Med Fade (2-3)', range: '2-3' },
    { label: 'High Fade (4-5)', range: '4-5' },
  ],
};

function FilterPanel({
  visible,
  onClose,
  onApplyFilters,
  currentFilters = {},
  testID,
}) {
  const colors = useThemeColors();
  const [localFilters, setLocalFilters] = useState(currentFilters);

  // Sync local filters when currentFilters changes or panel becomes visible
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(currentFilters);
    }
  }, [currentFilters, visible]);

  // Memoize styles
  // eslint-disable-next-line no-use-before-define
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Handle brand filter toggle
  const toggleBrand = (brand) => {
    const currentBrands = localFilters.brands || [];
    const updatedBrands = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand];

    setLocalFilters((prev) => ({
      ...prev,
      brands: updatedBrands.length > 0 ? updatedBrands : undefined,
    }));
  };

  // Handle flight range filter toggle (now supports multiple selections)
  const toggleFlightRange = (type, range) => {
    const currentRanges = localFilters[type] || [];
    const updatedRanges = currentRanges.includes(range)
      ? currentRanges.filter((r) => r !== range)
      : [...currentRanges, range];

    setLocalFilters((prev) => ({
      ...prev,
      [type]: updatedRanges.length > 0 ? updatedRanges : undefined,
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalFilters({});
  };

  // Apply filters
  const applyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  // Count active filters
  const activeFilterCount = Object.keys(localFilters).filter(
    (key) => localFilters[key] !== undefined
           && (Array.isArray(localFilters[key]) ? localFilters[key].length > 0 : true),
  ).length;

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel} testID={testID}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Filter Discs</Text>
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Filter Section */}
          <View style={styles.firstSection}>
            <View style={styles.sectionHeader}>
              <Icon
                name="business-outline"
                size={20}
                color={colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Brands</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Filter by disc manufacturer
            </Text>
            <View style={styles.brandOptions}>
              {POPULAR_BRANDS.map((brand) => {
                const isSelected = (localFilters.brands || []).includes(brand);
                return (
                  <TouchableOpacity
                    key={brand}
                    testID={brand === 'Innova' ? 'filter-panel-apply-brand-filter' : undefined}
                    style={[
                      styles.brandOption,
                      isSelected && styles.brandOptionSelected,
                    ]}
                    onPress={() => toggleBrand(brand)}
                  >
                    <View style={styles.brandOptionContent}>
                      <Text style={[
                        styles.brandOptionLabel,
                        isSelected && styles.brandOptionLabelSelected,
                      ]}
                      >
                        {brand}
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

          {/* Disc Status Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="checkmark-done-outline"
                size={20}
                color={colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Disc Status</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Show approved discs or your pending submissions
            </Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  (localFilters.approved === undefined || localFilters.approved === true)
                    && styles.statusOptionSelected,
                ]}
                onPress={() => setLocalFilters((prev) => ({ ...prev, approved: undefined }))}
              >
                <View style={styles.statusOptionContent}>
                  <Text style={[
                    styles.statusOptionLabel,
                    (localFilters.approved === undefined || localFilters.approved === true)
                      && styles.statusOptionLabelSelected,
                  ]}
                  >
                    Approved Discs
                  </Text>
                  <Text style={[
                    styles.statusOptionDescription,
                    (localFilters.approved === undefined || localFilters.approved === true)
                      && styles.statusOptionDescriptionSelected,
                  ]}
                  >
                    Community approved discs
                  </Text>
                </View>
                {(localFilters.approved === undefined || localFilters.approved === true) && (
                  <Icon
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  localFilters.approved === false && styles.statusOptionSelected,
                ]}
                onPress={() => setLocalFilters((prev) => ({ ...prev, approved: false }))}
              >
                <View style={styles.statusOptionContent}>
                  <Text style={[
                    styles.statusOptionLabel,
                    localFilters.approved === false && styles.statusOptionLabelSelected,
                  ]}
                  >
                    My Pending Submissions
                  </Text>
                  <Text style={[
                    styles.statusOptionDescription,
                    localFilters.approved === false && styles.statusOptionDescriptionSelected,
                  ]}
                  >
                    Discs you submitted awaiting approval
                  </Text>
                </View>
                {localFilters.approved === false && (
                  <Icon
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Flight Number Sections */}
          {Object.entries(FLIGHT_RANGES).map(([type, ranges]) => {
            const icons = {
              speed: 'speedometer-outline',
              glide: 'airplane-outline',
              turn: 'return-down-forward-outline',
              fade: 'trending-down-outline',
            };
            return (
              <View key={type} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon
                    name={icons[type]}
                    size={20}
                    color={colors.primary}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>
                    {`${type.charAt(0).toUpperCase()}${type.slice(1)} Range`}
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  {`Filter by ${type} flight characteristics`}
                </Text>
                <View style={styles.rangeOptions}>
                  {ranges.map((option) => {
                    const currentRanges = localFilters[type] || [];
                    const isSelected = currentRanges.includes(option.range);
                    return (
                      <TouchableOpacity
                        key={option.range}
                        style={[styles.rangeOption, isSelected && styles.rangeOptionActive]}
                        onPress={() => toggleFlightRange(type, option.range)}
                      >
                        <Text style={[
                          styles.rangeOptionText,
                          isSelected && styles.rangeOptionTextActive,
                        ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Clear All"
            onPress={clearAllFilters}
            variant="outline"
            style={styles.footerButton}
          />
          <Button
            title={`Apply${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
            onPress={applyFilters}
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
    minHeight: '60%',
    paddingTop: spacing.lg,
    marginBottom: 0, // Same on both platforms
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
    borderBottomColor: colors.surface.overlay,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
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
  brandOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  brandOption: {
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
    width: '48%', // Two columns with small gap
    minHeight: 44, // Ensure consistent height for touch targets
  },
  brandOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: Platform.select({
      ios: `${colors.primary}10`,
      android: `${colors.primary}15`,
    }),
  },
  brandOptionContent: {
    flex: 1,
  },
  brandOptionLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  brandOptionLabelSelected: {
    color: colors.primary,
  },
  rangeOptions: {
    gap: spacing.sm,
  },
  rangeOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rangeOptionActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  rangeOptionText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
  },
  rangeOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: Platform.select({
      ios: spacing.xl, // iOS safe area padding
      android: spacing.xl + spacing.lg, // Extra padding for Android to center buttons properly
    }),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});

FilterPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  currentFilters: PropTypes.shape({
    brands: PropTypes.arrayOf(PropTypes.string),
    speed: PropTypes.arrayOf(PropTypes.string),
    glide: PropTypes.arrayOf(PropTypes.string),
    turn: PropTypes.arrayOf(PropTypes.string),
    fade: PropTypes.arrayOf(PropTypes.string),
  }),
  testID: PropTypes.string,
};

FilterPanel.defaultProps = {
  currentFilters: {},
  testID: undefined,
};

export default FilterPanel;
