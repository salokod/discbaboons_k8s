/**
 * BagDetailScreen Component
 * Shows detailed view of a bag with disc contents
 * Following CreateBagScreen design patterns with professional polish
 */

import {
  memo, useState, useEffect, useCallback, useMemo,
} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import Button from '../../components/Button';
import { getBag, removeDiscFromBag } from '../../services/bagService';
import SwipeableDiscRow from '../../components/bags/SwipeableDiscRow';
import BaboonBagBreakdownModal from '../../components/modals/BaboonBagBreakdownModal';
import BaboonsVisionModal from '../../components/modals/BaboonsVisionModal';
import FilterPanel from '../../design-system/components/FilterPanel';
import SortPanel from '../../design-system/components/SortPanel';

function BagDetailScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { bagId } = route?.params || {};

  // State management
  const [bag, setBag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and Sort state
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ field: null, direction: 'asc' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  // Load bag data function
  const loadBagData = useCallback(async (isRefreshing = false) => {
    if (!bagId) {
      setError('No bag ID provided');
      setLoading(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const bagData = await getBag(bagId);
      setBag(bagData);
    } catch (err) {
      setError(err.message || 'Failed to load bag details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bagId]);

  // Load bag data on mount
  useEffect(() => {
    loadBagData();
  }, [loadBagData]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    loadBagData(true);
  }, [loadBagData]);

  // Filter and sort the discs
  const filteredAndSortedDiscs = useMemo(() => {
    if (!bag?.bag_contents) return [];

    let discs = [...bag.bag_contents];

    // Apply filters
    if (Object.keys(filters).length > 0) {
      discs = discs.filter((disc) => {
        // Brand filter
        if (filters.brands && filters.brands.length > 0) {
          const discBrand = disc.brand || disc.disc_master?.brand || '';
          const matchesBrand = filters.brands.some((brand) => (
            discBrand.toLowerCase().includes(brand.toLowerCase())
          ));
          if (!matchesBrand) {
            return false;
          }
        }

        // Flight number filters
        const flightNumbers = ['speed', 'glide', 'turn', 'fade'];
        for (let i = 0; i < flightNumbers.length; i += 1) {
          const flightNum = flightNumbers[i];
          if (filters[flightNum] && filters[flightNum].length > 0) {
            const value = disc[flightNum] || disc.disc_master?.[flightNum] || 0;
            const ranges = filters[flightNum];
            const matchesRange = ranges.some((range) => {
              const [min, max] = range.split('-').map(Number);
              return value >= min && value <= max;
            });
            if (!matchesRange) {
              return false;
            }
          }
        }

        return true;
      });
    }

    // Apply sorting
    if (sort.field) {
      discs.sort((a, b) => {
        let aVal = a[sort.field] || a.disc_master?.[sort.field] || '';
        let bVal = b[sort.field] || b.disc_master?.[sort.field] || '';

        // Handle numeric values
        if (['speed', 'glide', 'turn', 'fade'].includes(sort.field)) {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }
        // Handle string values
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (sort.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    }

    return discs;
  }, [bag?.bag_contents, filters, sort]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.select({
        ios: spacing.xl,
        android: spacing.lg,
      }),
      paddingBottom: spacing.xl * 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
      marginTop: spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.lg,
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
    },
    discCountText: {
      ...typography.bodyBold,
      color: colors.primary,
    },
    // Quick Actions Section (matching CreateBagScreen section style)
    section: {
      marginBottom: spacing.xl * 1.5,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
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
    // Professional Empty State (matching CreateBagScreen and EmptyBagsScreen)
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
      paddingHorizontal: spacing.lg,
    },
    emptyIcon: {
      marginBottom: spacing.xl,
    },
    emptyTitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    emptyButtonContainer: {
      width: '100%',
      marginTop: spacing.lg,
    },
    // Disc List
    listContent: {
      paddingBottom: spacing.lg,
    },
  });

  // Handler for quick actions
  const handleAddDisc = useCallback(() => {
    if (!bagId) {
      return;
    }

    // Navigate to DiscSearchScreen with bagId parameter for adding disc to bag
    navigation?.navigate('DiscSearchScreen', {
      mode: 'addToBag',
      bagId,
      bagName: bag?.name || 'Your Bag',
    });
  }, [bagId, bag?.name, navigation]);

  const handleSort = useCallback(() => {
    setShowSortPanel(true);
  }, []);

  const handleFilter = useCallback(() => {
    setShowFilterPanel(true);
  }, []);

  // Handle filter panel apply
  const handleFilterApply = useCallback((newFilters) => {
    setFilters(newFilters);
    setShowFilterPanel(false);
  }, []);

  // Handle sort panel apply
  const handleSortApply = useCallback((newSort) => {
    setSort(newSort);
    setShowSortPanel(false);
  }, []);

  // Clear all filters and sort
  const clearFiltersAndSort = useCallback(() => {
    setFilters({});
    setSort({ field: null, direction: 'asc' });
  }, []);

  // Swipe action handler with edit and delete functionality
  const handleDiscSwipe = useCallback((disc) => {
    const actions = [
      {
        id: 'edit',
        label: 'Edit',
        color: '#007AFF',
        icon: 'create-outline',
        onPress: async () => {
          try {
            // For now, navigate to a disc edit screen or show edit modal
            // This will be implemented in future slices
            // eslint-disable-next-line no-console
            console.log('Edit disc:', disc.id);
          } catch (editError) {
            // eslint-disable-next-line no-console
            console.error('Edit disc failed:', editError);
          }
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        color: '#FF3B30',
        icon: 'trash-outline',
        onPress: async () => {
          const discBrand = disc.brand || disc.disc_master?.brand || '';
          const discModel = disc.model || disc.disc_master?.model || '';
          const bagName = bag?.name || 'this bag';

          Alert.alert(
            'Remove Disc',
            `Remove ${discBrand} ${discModel} from ${bagName}?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await removeDiscFromBag(disc.id);
                    // Refresh bag data to show updated contents
                    await loadBagData();
                  } catch (removeError) {
                    // eslint-disable-next-line no-console
                    console.error('Remove disc failed:', removeError);
                  }
                },
              },
            ],
          );
        },
      },
    ];

    return actions;
  }, [loadBagData, bag?.name]);

  // Count active filters for display
  const activeFilterCount = useMemo(() => Object.keys(filters).filter(
    (key) => filters[key] !== undefined
             && (Array.isArray(filters[key]) ? filters[key].length > 0 : true),
  ).length, [filters]);

  // Determine sort icon name
  const sortIconName = useMemo(() => {
    if (sort.field) {
      return sort.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline';
    }
    return 'swap-vertical-outline';
  }, [sort]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView testID="bag-detail-screen" style={styles.container}>
        <AppContainer>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading bag details...</Text>
          </View>
        </AppContainer>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView testID="bag-detail-screen" style={styles.container}>
        <AppContainer>
          <View style={styles.errorContainer}>
            <Icon
              name="alert-circle-outline"
              size={64}
              color={colors.error}
              style={styles.emptyIcon}
            />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Try Again"
              onPress={() => loadBagData()}
              variant="primary"
            />
          </View>
        </AppContainer>
      </SafeAreaView>
    );
  }

  // Professional empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="bag-outline"
        size={80}
        color={colors.textLight}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Ready to Build Your Bag</Text>
      <Text style={styles.emptySubtitle}>
        Start adding discs to create your perfect disc golf setup.
        Search our database of thousands of discs to find exactly what you need.
      </Text>
      <View style={styles.emptyButtonContainer}>
        <Button
          title="Add Your First Disc"
          onPress={handleAddDisc}
          variant="primary"
        />
      </View>
    </View>
  );

  // Render disc item
  const renderDiscItem = ({ item }) => (
    <SwipeableDiscRow disc={item} onSwipeRight={handleDiscSwipe} />
  );

  // Success state with bag data
  return (
    <SafeAreaView testID="bag-detail-screen" style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        )}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{bag?.name || 'Bag Details'}</Text>
          {bag?.description && (
            <Text style={styles.headerSubtitle}>{bag.description}</Text>
          )}
        </View>

        {/* Clear All Button (only show if filters or sort are active) */}
        {(activeFilterCount > 0 || sort.field) && (
          <TouchableOpacity style={styles.clearAllButton} onPress={clearFiltersAndSort}>
            <Text style={styles.clearAllButtonText}>
              Clear All (
              {activeFilterCount + (sort.field ? 1 : 0)}
              )
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddDisc}>
            <Icon name="add-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Add Disc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              sort.field && styles.actionButtonActive,
            ]}
            onPress={handleSort}
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
            onPress={handleFilter}
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

        {/* Analytics Row */}
        {bag?.bag_contents && bag.bag_contents.length > 0 && (
          <View style={styles.analyticsActions}>
            <BaboonBagBreakdownModal bag={bag} />
            <BaboonsVisionModal bag={bag} />
          </View>
        )}

        {/* Disc List or Empty State */}
        {bag?.bag_contents && bag.bag_contents.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="disc-outline"
                size={20}
                color={colors.primary}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>
                Your Discs
                {' '}
                (
                {filteredAndSortedDiscs.length}
                {filteredAndSortedDiscs.length !== bag.bag_contents.length
                  && ` of ${bag.bag_contents.length}`}
                )
              </Text>
            </View>

            {filteredAndSortedDiscs.length > 0 ? (
              <FlatList
                testID="disc-list"
                data={filteredAndSortedDiscs}
                renderItem={renderDiscItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={5}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon
                  name="funnel-outline"
                  size={64}
                  color={colors.textLight}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No Matching Discs</Text>
                <Text style={styles.emptySubtitle}>
                  No discs match your current filters or search criteria.
                  Try adjusting your filters or clearing them to see all discs.
                </Text>
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearFiltersAndSort}
                >
                  <Text style={styles.clearAllButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Filter Panel Modal */}
      <FilterPanel
        testID="filter-panel"
        visible={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApplyFilters={handleFilterApply}
        currentFilters={filters}
        discs={bag?.bag_contents || []}
      />

      {/* Sort Panel Modal */}
      <SortPanel
        testID="sort-panel"
        visible={showSortPanel}
        onClose={() => setShowSortPanel(false)}
        onApplySort={handleSortApply}
        currentSort={sort}
      />
    </SafeAreaView>
  );
}

BagDetailScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      bagId: PropTypes.string,
    }),
  }),
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};

BagDetailScreen.defaultProps = {
  route: null,
  navigation: null,
};

BagDetailScreen.displayName = 'BagDetailScreen';

export default memo(BagDetailScreen);
