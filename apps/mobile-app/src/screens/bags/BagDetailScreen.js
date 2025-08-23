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
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { getBag, removeDiscFromBag, getLostDiscCountForBag } from '../../services/bagService';
import SwipeableDiscRow from '../../components/bags/SwipeableDiscRow';
import SelectableDiscRow from '../../components/bags/SelectableDiscRow';
import BulkActionBar from '../../components/bags/BulkActionBar';
import BagDetailHeader from '../../components/bags/BagDetailHeader';
import MoveDiscModal from '../../components/modals/MoveDiscModal';
import BulkMoveModal from '../../components/modals/BulkMoveModal';
import FilterPanel from '../../design-system/components/FilterPanel';
import SortPanel from '../../design-system/components/SortPanel';
import { useBagRefreshListener, useBagRefreshContext } from '../../context/BagRefreshContext';
import useMultiSelect from '../../hooks/useMultiSelect';

function BagDetailScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { triggerBagListRefresh } = useBagRefreshContext();
  const { bagId } = route?.params || {};

  // State management
  const [bag, setBag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lostDiscCount, setLostDiscCount] = useState(0);

  // Multi-select state
  const {
    isMultiSelectMode,
    selectedIds,
    selectedCount,
    toggleSelection,
    enterMultiSelectMode,
    exitMultiSelectMode,
  } = useMultiSelect();

  // Filter and Sort state
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ field: null, direction: 'asc' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  // Move modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedDisc, setSelectedDisc] = useState(null);

  // Bulk move modal state
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);

  // Navigation handler
  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [navigation]);

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

      // Load lost disc count for this bag
      try {
        const count = await getLostDiscCountForBag(bagId);
        setLostDiscCount(count);
      } catch (countError) {
        // Don't fail the whole screen if lost disc count fails
        // eslint-disable-next-line no-console
        console.warn('Failed to load lost disc count:', countError);
        setLostDiscCount(0);
      }
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

  // Listen for refresh triggers from context
  useBagRefreshListener(bagId, useCallback(() => {
    if (bagId) {
      loadBagData();
    }
  }, [bagId, loadBagData]));

  // Fallback: Check for navigation param shouldRefresh
  useEffect(() => {
    if (route?.params?.shouldRefresh && bagId) {
      loadBagData();
      // Clear the param to prevent infinite refresh
      if (navigation?.setParams) {
        navigation.setParams({ shouldRefresh: false });
      }
    }
  }, [route?.params?.shouldRefresh, bagId, loadBagData, navigation]);

  // Removed auto-refresh temporarily - was causing infinite loop bug
  // TODO: Implement proper auto-refresh with correct useFocusEffect pattern

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

        // Handle numeric values vs string values separately
        if (['speed', 'glide', 'turn', 'fade'].includes(sort.field)) {
          // Keep as numbers for proper numeric comparison
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;

          if (sort.direction === 'asc') {
            return aVal - bVal;
          }
          return bVal - aVal;
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

  // getItemLayout for FlatList performance optimization
  const getItemLayout = useCallback((data, index) => {
    // Standard disc row height calculation:
    // - DiscRow minHeight: 80px
    // - DiscRow paddingVertical: spacing.sm * 2 = 16px
    // - Card padding: spacing.md * 2 = 32px
    // - DiscCard marginBottom: spacing.xs = 4px
    // Total: 80 + 16 + 32 + 4 = 132px
    const ITEM_HEIGHT = 132;

    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  // Performance monitoring callbacks
  const onScrollBeginDrag = useCallback(() => {
    // Track scroll start time for performance monitoring
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('FlatList scroll started');
    }
  }, []);

  const onScrollEndDrag = useCallback(() => {
    // Track scroll end time for performance monitoring
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('FlatList scroll ended');
    }
  }, []);

  const onMomentumScrollBegin = useCallback(() => {
    // Track momentum scroll start
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('FlatList momentum scroll started');
    }
  }, []);

  const onMomentumScrollEnd = useCallback(() => {
    // Track momentum scroll end
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('FlatList momentum scroll ended');
    }
  }, []);

  // Viewability tracking for render performance
  const onViewableItemsChanged = useCallback(({ viewableItems, changed }) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('Viewable items changed:', {
        viewableCount: viewableItems.length,
        changedCount: changed.length,
      });
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    viewAreaCoveragePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // Handler for quick actions
  const handleAddDisc = useCallback(() => {
    if (!bagId) {
      return;
    }

    // Navigate to DiscSearchScreen modal for adding disc to bag
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

  // Handler for Lost Discs navigation
  const handleViewLostDiscs = useCallback(() => {
    if (!bagId) {
      return;
    }

    // Navigate to LostDiscs screen with sourceBagId parameter for filtering
    navigation?.navigate('LostDiscs', {
      sourceBagId: bagId,
      navigationSource: 'BagDetail',
    });
  }, [bagId, navigation]);

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

  // Handle move disc operation
  const handleMoveDisc = useCallback((disc) => {
    setSelectedDisc(disc);
    setShowMoveModal(true);
  }, []);

  // Handle successful move
  const handleMoveSuccess = useCallback(async () => {
    setShowMoveModal(false);
    setSelectedDisc(null);
    // Refresh bag data to show updated contents
    await loadBagData();
  }, [loadBagData]);

  // Handle move modal close
  const handleMoveModalClose = useCallback(() => {
    setShowMoveModal(false);
    setSelectedDisc(null);
  }, []);

  // Handle bulk move success
  const handleBulkMoveSuccess = useCallback(async () => {
    setShowBulkMoveModal(false);
    exitMultiSelectMode();
    // Refresh bag data to show updated contents
    await loadBagData();
  }, [loadBagData, exitMultiSelectMode]);

  // Handle bulk move modal close
  const handleBulkMoveModalClose = useCallback(() => {
    setShowBulkMoveModal(false);
  }, []);

  // Right swipe action handler - Edit and Remove only
  const handleDiscSwipeRight = useCallback((disc) => {
    const actions = [
      {
        id: 'edit',
        label: 'Edit',
        color: colors.primary,
        icon: 'create-outline',
      },
      {
        id: 'delete',
        label: 'Delete',
        color: colors.error,
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
                    // Trigger bag list refresh to update disc counts
                    triggerBagListRefresh();
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
  }, [loadBagData, bag?.name, triggerBagListRefresh, colors]);

  // Left swipe action handler - Move only
  const handleDiscSwipeLeft = useCallback((disc) => {
    const actions = [
      {
        id: 'move',
        label: 'Move',
        color: colors.info,
        icon: 'swap-horizontal-outline',
        onPress: () => handleMoveDisc(disc),
      },
    ];

    return actions;
  }, [handleMoveDisc, colors]);

  // Multi-select handlers
  const handleSelectAll = useCallback(() => {
    if (!bag?.bag_contents) return;

    // If all are selected, deselect all, otherwise select all
    const allDiscIds = bag.bag_contents.map((disc) => disc.id);
    const areAllSelected = allDiscIds.every((id) => selectedIds.has(id));

    if (areAllSelected) {
      allDiscIds.forEach((id) => toggleSelection(id));
    } else {
      allDiscIds.forEach((id) => {
        if (!selectedIds.has(id)) {
          toggleSelection(id);
        }
      });
    }
  }, [bag?.bag_contents, selectedIds, toggleSelection]);

  // Bulk action handlers
  const handleBulkMove = useCallback(() => {
    setShowBulkMoveModal(true);
  }, []);

  // Count active filters for display
  const activeFilterCount = useMemo(() => Object.keys(filters).filter(
    (key) => filters[key] !== undefined
             && (Array.isArray(filters[key]) ? filters[key].length > 0 : true),
  ).length, [filters]);

  // Create styles here to use in useCallback hooks
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flatListContent: {
      flexGrow: 1,
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
    // Disc List
    listContent: {
      paddingBottom: spacing.lg,
    },
  });

  // Empty state for when bag has no contents
  const renderEmptyState = useCallback(() => (
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
  ), [colors.textLight, handleAddDisc, styles]);

  // Empty state for when filters return no results
  const renderFilterEmptyState = useCallback(() => (
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
  ), [colors.textLight, clearFiltersAndSort, styles]);

  // Determine which empty state to show
  const renderListEmptyComponent = useCallback(() => {
    // If bag has no contents at all
    if (!bag?.bag_contents || bag.bag_contents.length === 0) {
      return renderEmptyState();
    }
    // If bag has contents but filters return nothing
    return renderFilterEmptyState();
  }, [bag?.bag_contents, renderEmptyState, renderFilterEmptyState]);

  // Render header component
  const renderHeader = useCallback(() => (
    <BagDetailHeader
      bag={bag}
      isMultiSelectMode={isMultiSelectMode}
      selectedCount={selectedCount}
      activeFilterCount={activeFilterCount}
      sort={sort}
      filteredDiscCount={filteredAndSortedDiscs.length}
      lostDiscCount={lostDiscCount}
      onAddDisc={handleAddDisc}
      onSort={handleSort}
      onFilter={handleFilter}
      onSelectAll={handleSelectAll}
      onCancelMultiSelect={exitMultiSelectMode}
      onEnterMultiSelect={enterMultiSelectMode}
      onClearFiltersAndSort={clearFiltersAndSort}
      onViewLostDiscs={handleViewLostDiscs}
    />
  ), [
    bag,
    isMultiSelectMode,
    selectedCount,
    activeFilterCount,
    sort,
    filteredAndSortedDiscs.length,
    lostDiscCount,
    handleAddDisc,
    handleSort,
    handleFilter,
    handleSelectAll,
    exitMultiSelectMode,
    enterMultiSelectMode,
    clearFiltersAndSort,
    handleViewLostDiscs,
  ]);

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

  // Render disc item
  const renderDiscItem = ({ item }) => {
    if (isMultiSelectMode) {
      return (
        <SelectableDiscRow
          disc={item}
          bagId={bag?.id || bagId || 'unknown'}
          bagName={bag?.name || 'Unknown Bag'}
          isMultiSelectMode={isMultiSelectMode}
          isSelected={selectedIds.has(item.id)}
          onToggleSelection={toggleSelection}
          onSwipeRight={handleDiscSwipeRight}
          onSwipeLeft={handleDiscSwipeLeft}
        />
      );
    }

    return (
      <SwipeableDiscRow
        disc={item}
        onSwipeRight={handleDiscSwipeRight}
        onSwipeLeft={handleDiscSwipeLeft}
        bagId={bag?.id || bagId || 'unknown'}
        bagName={bag?.name || 'Unknown Bag'}
        onLongPress={() => {
          enterMultiSelectMode();
          toggleSelection(item.id);
        }}
      />
    );
  };

  // Success state with bag data
  return (
    <SafeAreaView testID="bag-detail-screen" style={styles.container}>
      <AppContainer>
        <NavigationHeader
          title={bag?.name || 'Bag Details'}
          onBack={handleBack}
          backAccessibilityLabel="Return to bags list"
        />
        <FlatList
          testID="main-disc-list"
          data={filteredAndSortedDiscs}
          renderItem={renderDiscItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderListEmptyComponent}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          )}
          getItemLayout={getItemLayout}
          removeClippedSubviews
          maxToRenderPerBatch={filteredAndSortedDiscs.length > 100 ? 15 : 10}
          windowSize={filteredAndSortedDiscs.length > 100 ? 10 : 5}
          initialNumToRender={Math.min(
            filteredAndSortedDiscs.length,
            filteredAndSortedDiscs.length > 50 ? 20 : 15,
          )}
          updateCellsBatchingPeriod={50}
          scrollEventThrottle={16}
          disableIntervalMomentum
          disableScrollViewPanResponder={false}
          scrollEnabled
          progressViewOffset={0}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollBegin={onMomentumScrollBegin}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

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

        {/* Move Disc Modal */}
        <MoveDiscModal
          visible={showMoveModal}
          onClose={handleMoveModalClose}
          disc={selectedDisc}
          currentBagId={bagId}
          currentBagName={bag?.name || 'Current Bag'}
          onSuccess={handleMoveSuccess}
        />

        {/* Bulk Move Modal */}
        <BulkMoveModal
          visible={showBulkMoveModal}
          onClose={handleBulkMoveModalClose}
          selectedDiscIds={Array.from(selectedIds)}
          currentBagId={bagId}
          currentBagName={bag?.name || 'Current Bag'}
          onSuccess={handleBulkMoveSuccess}
        />

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedCount}
          onMove={handleBulkMove}
          visible={isMultiSelectMode}
        />
      </AppContainer>
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
