/**
 * DiscSearchScreen
 * Search master disc database with advanced filtering
 */

import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';

import SearchBar from '../../design-system/components/SearchBar';
import EmptyState from '../../design-system/components/EmptyState';
import FilterPanel from '../../design-system/components/FilterPanel';
import SortPanel from '../../design-system/components/SortPanel';
import SearchActionBar from '../../components/SearchActionBar';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { searchDiscs } from '../../services/discService';

// RangeInput component removed - now using sliders instead

function DiscSearchScreen({ navigation, route }) {
  const colors = useThemeColors();

  // Check if we're in "add to bag" mode
  const { mode, bagId, bagName } = route?.params || {};
  const isAddToBagMode = mode === 'addToBag' && bagId;
  const [searchQuery, setSearchQuery] = useState('');
  // Using ref for search input to avoid re-renders on every keystroke
  const searchInputRef = useRef(''); // Ref to avoid re-renders
  const [discs, setDiscs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  // Modern filter and sort state
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ field: null, direction: 'asc' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showPending, setShowPending] = useState(false); // Toggle for pending vs approved discs

  // Debounce timer ref
  const searchTimeoutRef = useRef(null);

  // Memoize styles to prevent component recreation (createStyles defined below)
  // eslint-disable-next-line no-use-before-define
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // Build search filters from current state
  const buildSearchFilters = useCallback(
    (
      additionalFilters = {},
      isRefresh = false,
      queryOverride = null,
      filtersOverride = null,
      sortOverride = null,
      showPendingOverride = null,
    ) => {
      const currentFilters = filtersOverride !== null ? filtersOverride : filters;
      const currentSort = sortOverride !== null ? sortOverride : sort;
      const hasActiveSort = currentSort.field !== null;
      const hasActiveFilters = Object.keys(currentFilters).some(
        (key) => currentFilters[key] !== undefined
                && (Array.isArray(currentFilters[key]) ? currentFilters[key].length > 0 : true),
      );

      // Increase limit when filters/sort are active to reduce pagination issues
      let limit = 50;
      if (hasActiveFilters || hasActiveSort) {
        limit = 200; // Higher limit for filtered/sorted results
      }

      // When sorting is active, always get all results (no pagination)
      const currentShowPending = showPendingOverride !== null ? showPendingOverride : showPending;
      const searchFilters = {
        limit: hasActiveSort ? 1000 : limit, // Get more results when sorting
        offset: isRefresh || hasActiveSort ? 0 : pagination.offset,
        approved: !currentShowPending, // Show pending discs when showPending is true
        ...additionalFilters,
      };

      // Use override query if provided, otherwise use current searchQuery
      const query = queryOverride !== null ? queryOverride : searchQuery;

      // Add search query as model filter if provided
      if (query && query.trim()) {
        searchFilters.model = query.trim();
      }

      // Add brand filters - convert array to comma-separated string for API
      if (currentFilters.brands && currentFilters.brands.length > 0) {
        searchFilters.brand = currentFilters.brands.join(',');
      }

      // Add flight number range filters - convert arrays to comma-separated strings for API
      ['speed', 'glide', 'turn', 'fade'].forEach((key) => {
        if (currentFilters[key] && currentFilters[key].length > 0) {
          searchFilters[key] = Array.isArray(currentFilters[key])
            ? currentFilters[key].join(',')
            : currentFilters[key];
        }
      });

      return searchFilters;
    },
    [searchQuery, filters, sort, pagination.offset, showPending],
  );

  const performSearch = useCallback(async (
    isRefresh = false,
    additionalFilters = {},
    queryOverride = null,
    sortOverride = null,
    filtersOverride = null,
    showPendingOverride = null,
  ) => {
    if (!isRefresh && loading) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const searchFilters = buildSearchFilters(
        additionalFilters,
        isRefresh,
        queryOverride,
        filtersOverride,
        sortOverride,
        showPendingOverride,
      );
      const result = await searchDiscs(searchFilters);

      // Apply client-side sorting if specified (use override if provided)
      const currentSort = sortOverride || sort;
      const sortedDiscs = [...result.discs];
      if (currentSort.field) {
        sortedDiscs.sort((a, b) => {
          let aVal = a[currentSort.field];
          let bVal = b[currentSort.field];

          // Handle null/undefined values
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;

          // Handle string comparisons (case-insensitive)
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }

          // Handle numeric comparisons
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return currentSort.direction === 'desc' ? bVal - aVal : aVal - bVal;
          }

          // Handle string comparisons
          if (aVal < bVal) return currentSort.direction === 'desc' ? 1 : -1;
          if (aVal > bVal) return currentSort.direction === 'desc' ? -1 : 1;
          return 0;
        });
      }

      if (isRefresh || currentSort.field) {
        // For refresh or when sorting is active, replace all discs
        setDiscs(sortedDiscs);
        setPagination(result.pagination);
      } else {
        // For pagination, append new results and ensure no duplicates
        setDiscs((prevDiscs) => {
          const existingIds = new Set(prevDiscs.map((disc) => disc.id));
          const newDiscs = sortedDiscs.filter((disc) => !existingIds.has(disc.id));
          return [...prevDiscs, ...newDiscs];
        });
        setPagination(result.pagination);
      }
    } catch (error) {
      Alert.alert('Search Error', error.message || 'Unable to search discs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, buildSearchFilters, sort]);

  // Toggle between approved and pending discs
  const togglePendingStatus = useCallback(() => {
    const newShowPending = !showPending;
    setShowPending(newShowPending);
    // Trigger a fresh search when toggling with the new state
    performSearch(true, {}, null, null, null, newShowPending);
  }, [showPending, performSearch]);

  // Don't auto-search on screen focus - let users initiate search

  // Load all discs initially when screen mounts
  useEffect(() => {
    if (!hasSearched && discs.length === 0) {
      performSearch(true, {}, ''); // Load all discs initially
      setHasSearched(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create stable reference to performSearch for filters
  const performSearchRef = useRef(performSearch);
  performSearchRef.current = performSearch;

  // Disable auto-search on filter changes - require manual search trigger
  // This prevents keyboard/slider interruptions
  useEffect(() => () => {
    // Cleanup any existing timeout on unmount
    const currentTimeout = searchTimeoutRef.current;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
  }, []); // Only run cleanup on unmount

  // Manual search trigger - should ONLY be called when search button is pressed
  const triggerSearch = useCallback(() => {
    const query = searchInputRef.current.trim();
    setSearchQuery(query);
    performSearch(true, {}, query);
    setHasSearched(true);
  }, [performSearch]);

  // Filter panel handlers
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    // Trigger search with new filters (pass filters override to avoid stale state)
    performSearch(true, {}, searchQuery, null, newFilters);
  }, [performSearch, searchQuery]);

  // Sort panel handlers
  const handleApplySort = useCallback((newSort) => {
    setSort(newSort);
    // Trigger search with new sort (pass sort override to avoid stale state)
    performSearch(true, {}, searchQuery, newSort);
  }, [performSearch, searchQuery]);

  // Handle search input change - use ref to avoid re-renders
  const handleSearchInputChange = useCallback((text) => {
    // Store in ref to avoid triggering re-renders
    searchInputRef.current = text;
  }, []);

  // Clear search input only (for SearchBar onClear)
  const handleSearchClear = useCallback(() => {
    searchInputRef.current = '';
    setSearchQuery('');
    performSearch(true, {}, ''); // Show all discs when cleared
  }, [performSearch]);

  // Clear search and results
  const clearSearch = useCallback(() => {
    searchInputRef.current = '';
    setSearchQuery('');
    const emptyFilters = {};
    const emptySort = { field: null, direction: 'asc' };
    setFilters(emptyFilters);
    setSort(emptySort);
    // Reload all discs when clearing search (pass empty filters and sort directly)
    performSearch(true, {}, '', emptySort, emptyFilters);
  }, [performSearch]);

  const handleLoadMore = useCallback(() => {
    // Disable pagination when sorting is active (all results already loaded)
    if (sort.field) {
      return;
    }

    if (pagination.hasMore && !loading) {
      setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
      performSearch(false);
    }
  }, [pagination.hasMore, loading, performSearch, sort.field]);

  const handleRefresh = useCallback(() => {
    performSearch(true);
  }, [performSearch]);

  // Navigate to add disc screen
  const handleAddDiscToBag = useCallback((disc) => {
    if (!disc || !disc.id) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Invalid disc object passed to handleAddDiscToBag:', disc);
      }
      return;
    }

    navigation.navigate('AddDiscToBagScreen', {
      disc,
      bagId,
      bagName,
    });
  }, [navigation, bagId, bagName]);

  // Navigate to bags (cross-tab navigation)
  const handleViewBags = useCallback(() => {
    navigation.navigate('Bags', { screen: 'BagsList' });
  }, [navigation]);

  const renderDiscItem = React.useCallback(({ item }) => (
    <View style={styles.discItem}>
      <View style={styles.discContent}>
        <View style={styles.discInfoContainer}>
          <View style={styles.discInfo}>
            <View style={styles.discNameRow}>
              <Text style={styles.discName}>{item.model}</Text>
              <Text style={styles.discBrand}>
                {item.brand}
              </Text>
            </View>
          </View>
          <View style={styles.flightNumbers}>
            <View style={[styles.flightNumber, styles.speedNumber]}>
              <Text style={styles.flightLabel}>S</Text>
              <Text style={styles.flightNumberText}>{item.speed}</Text>
            </View>
            <View style={[styles.flightNumber, styles.glideNumber]}>
              <Text style={styles.flightLabel}>G</Text>
              <Text style={styles.flightNumberText}>{item.glide}</Text>
            </View>
            <View style={[styles.flightNumber, styles.turnNumber]}>
              <Text style={styles.flightLabel}>T</Text>
              <Text style={styles.flightNumberText}>{item.turn}</Text>
            </View>
            <View style={[styles.flightNumber, styles.fadeNumber]}>
              <Text style={styles.flightLabel}>F</Text>
              <Text style={styles.flightNumberText}>{item.fade}</Text>
            </View>
          </View>
        </View>

        {isAddToBagMode && (
          <TouchableOpacity
            style={styles.addToBagButton}
            onPress={() => handleAddDiscToBag(item)}
          >
            <Icon name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addToBagButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [styles, isAddToBagMode, handleAddDiscToBag, colors]);

  // Count active filters for display
  const activeFilterCount = React.useMemo(() => Object.keys(filters).filter(
    (key) => filters[key] !== undefined
             && (Array.isArray(filters[key]) ? filters[key].length > 0 : true),
  ).length, [filters]);

  const renderListHeader = React.useCallback(() => {
    // Determine sort icon name without nested ternary
    let sortIconName = 'swap-vertical-outline';
    if (sort.field) {
      sortIconName = sort.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline';
    }

    return (
      <View>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <SearchBar
              onChangeText={handleSearchInputChange}
              placeholder="Search disc models..."
              onClear={handleSearchClear}
              onSubmitEditing={triggerSearch}
            />
          </View>

          {/* Search Icon Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={triggerSearch}
            accessibilityLabel="Search discs"
          >
            <Icon name="search" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Clear All Icon Button */}
          {(hasSearched && (
            searchQuery || activeFilterCount > 0 || sort.field
          )) && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={clearSearch}
            accessibilityLabel="Clear all search and filters"
          >
            <Icon name="close-circle" size={24} color={colors.textLight} />
          </TouchableOpacity>
          )}
        </View>

        {/* Filter and Sort Row */}
        <View style={styles.filterSortContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              activeFilterCount > 0 && styles.actionButtonActive,
            ]}
            onPress={() => setShowFilterPanel(true)}
            accessibilityLabel="Open filter panel"
          >
            <Icon
              name="funnel-outline"
              size={20}
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
            style={[
              styles.actionButton,
              sort.field && styles.actionButtonActive,
            ]}
            onPress={() => setShowSortPanel(true)}
            accessibilityLabel="Open sort panel"
          >
            <Icon
              name={sortIconName}
              size={20}
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
        </View>

        {/* Status Toggle */}
        <View style={styles.statusToggleContainer}>
          <View style={styles.statusToggleRow}>
            <TouchableOpacity
              style={[
                styles.statusToggle,
                !showPending && styles.statusToggleActive,
              ]}
              onPress={() => (showPending ? togglePendingStatus() : null)}
            >
              <Text style={[
                styles.statusToggleText,
                !showPending && styles.statusToggleTextActive,
              ]}
              >
                Approved
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusToggle,
                showPending && styles.statusToggleActive,
              ]}
              onPress={() => (!showPending ? togglePendingStatus() : null)}
            >
              <Text style={[
                styles.statusToggleText,
                showPending && styles.statusToggleTextActive,
              ]}
              >
                My Pending
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cross-tab navigation: View Bags shortcut */}
        {!isAddToBagMode && (
          <View style={styles.crossTabContainer}>
            <TouchableOpacity
              style={styles.viewBagsButton}
              onPress={handleViewBags}
              testID="add-to-bag-shortcut"
            >
              <Icon name="bag-outline" size={20} color={colors.primary} />
              <Text style={styles.viewBagsButtonText}>Add to Bag (View Bags)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Count */}
        {discs.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {pagination.total}
            {' '}
            disc
            {pagination.total !== 1 ? 's' : ''}
            {' '}
            found
            {showPending && ' (pending approval)'}
          </Text>
        </View>
        )}
      </View>
    );
  }, [
    styles, handleSearchInputChange, handleSearchClear, triggerSearch,
    activeFilterCount, colors, hasSearched, searchQuery,
    clearSearch, discs.length, pagination.total, sort.field, sort.direction,
    showPending, togglePendingStatus, handleViewBags, isAddToBagMode,
  ]);

  const renderListFooter = React.useCallback(() => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loading, refreshing, styles.loadingFooter, colors.primary]);

  const renderEmptyState = React.useCallback(() => {
    if (loading && discs.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading discs...</Text>
        </View>
      );
    }

    // Show different empty states based on search/filter status
    const hasSearch = searchQuery && searchQuery.trim().length > 0;

    if (hasSearch || activeFilterCount > 0) {
      return (
        <EmptyState
          title="No Discs Found"
          subtitle={
            hasSearch
              ? `No discs match "${searchQuery}". Try different search terms or adjust your filters.`
              : 'No discs match your current filters. Try adjusting the flight number ranges.'
          }
        />
      );
    }

    // Fallback empty state (shouldn't normally show since we load all discs initially)
    return (
      <EmptyState
        title="No Discs Available"
        subtitle="No discs are currently available in the database."
        actionLabel="Submit New Disc"
        onAction={() => navigation.navigate('SubmitDisc')}
      />
    );
  }, [
    loading, discs.length, styles, colors, activeFilterCount, searchQuery, navigation,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <FlatList
        data={discs}
        renderItem={renderDiscItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        style={styles.container}
        contentContainerStyle={discs.length === 0 ? styles.emptyContent : undefined}
      />

      {/* Search Action Bar - shows when search has no results */}
      <SearchActionBar
        visible={hasSearched && discs.length === 0 && !loading}
        onClear={clearSearch}
        onAddDisc={() => navigation.navigate('SubmitDiscScreen')}
      />

      {/* Filter Panel */}
      <FilterPanel
        visible={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Sort Panel */}
      <SortPanel
        visible={showSortPanel}
        onClose={() => setShowSortPanel(false)}
        onApplySort={handleApplySort}
        currentSort={sort}
      />

    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.select({
      ios: spacing.md,
      android: spacing.sm, // Less padding on Android
    }),
    paddingBottom: Platform.select({
      ios: 0,
      android: spacing.xs, // Add small bottom padding on Android
    }),
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
  },
  filterSortContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    // Takes full width of flex container
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44, // Minimum touch target
    minWidth: 44,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  sortBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  sortBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsText: {
    ...typography.caption,
    color: colors.textLight,
  },
  discItem: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.select({
      ios: spacing.lg,
      android: spacing.md, // Less vertical padding on Android for better density
    }),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  discContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discInfoContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  discInfo: {
    marginBottom: spacing.sm,
  },
  discNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  discName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    flex: 0,
  },
  discBrand: {
    ...typography.body2,
    color: colors.textLight,
    fontWeight: '500',
    fontStyle: 'italic',
    fontSize: 14,
    flex: 0,
  },
  flightNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  flightNumber: {
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flex: 1,
  },
  speedNumber: {
    backgroundColor: `${colors.success}20`, // 20% opacity
    borderColor: colors.success,
  },
  glideNumber: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  turnNumber: {
    backgroundColor: `${colors.warning}20`,
    borderColor: colors.warning,
  },
  fadeNumber: {
    backgroundColor: `${colors.error}20`,
    borderColor: colors.error,
  },
  flightLabel: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 10,
  },
  flightNumberText: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  // Add to Bag styles - positioned to the right, vertically centered
  addToBagButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    minWidth: 64,
    minHeight: 64,
  },
  addToBagButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body2,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statusToggleContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Platform.select({
      ios: 12,
      android: 16,
    }),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusToggleActive: {
    borderColor: colors.primary,
    backgroundColor: Platform.select({
      ios: `${colors.primary}10`,
      android: `${colors.primary}15`,
    }),
  },
  statusToggleText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusToggleTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Platform.select({
      ios: 8,
      android: 10,
    }),
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.xs,
  },
  actionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: Platform.select({
      ios: `${colors.primary}08`,
      android: `${colors.primary}12`,
    }),
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: '500',
    fontSize: 12,
  },
  actionButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  crossTabContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  viewBagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  viewBagsButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
});

DiscSearchScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      mode: PropTypes.string,
      bagId: PropTypes.string,
      bagName: PropTypes.string,
    }),
  }),
};

DiscSearchScreen.defaultProps = {
  route: { params: {} },
};

export default DiscSearchScreen;
