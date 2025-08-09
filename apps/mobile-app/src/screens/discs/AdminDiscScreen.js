/**
 * AdminDiscScreen
 * Admin-only pending disc review and approval interface
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import PropTypes from 'prop-types';
import { useFocusEffect } from '@react-navigation/native';

import SearchBar from '../../design-system/components/SearchBar';
import FilterChip from '../../design-system/components/FilterChip';
import EmptyState from '../../design-system/components/EmptyState';
import Button from '../../components/Button';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { getPendingDiscs, approveDisc } from '../../services/discService';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Pending', filters: {} },
  { key: 'drivers', label: 'Drivers', filters: { speed: '9-15' } },
  { key: 'mids', label: 'Mids', filters: { speed: '4-6' } },
  { key: 'putters', label: 'Putters', filters: { speed: '1-4' } },
];

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filtersLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.overlay,
  },
  resultsText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  discItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.overlay,
    backgroundColor: colors.surface.primary,
  },
  discHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  discInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  discName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  discBrand: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  flightNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flightNumber: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
    minWidth: 20,
    textAlign: 'center',
  },
  flightSeparator: {
    ...typography.body2,
    color: colors.text.tertiary,
    marginHorizontal: spacing.xs,
  },
  discFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submissionDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  approveButton: {
    paddingHorizontal: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});

function AdminDiscScreen({ navigation }) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDiscs, setPendingDiscs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [approvingDiscs, setApprovingDiscs] = useState(new Set());
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const styles = createStyles(colors);

  const loadPendingDiscs = useCallback(async (filters = {}, isRefresh = false) => {
    if (!isRefresh && loading) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Build search filters
      const searchFilters = {
        limit: 50,
        offset: isRefresh ? 0 : pagination.offset,
        ...filters,
      };

      // Add search query as model filter if provided
      if (searchQuery.trim()) {
        searchFilters.model = searchQuery.trim();
      }

      const result = await getPendingDiscs(searchFilters);

      if (isRefresh) {
        setPendingDiscs(result.discs);
        setPagination(result.pagination);
      } else {
        setPendingDiscs((prevDiscs) => [...prevDiscs, ...result.discs]);
        setPagination(result.pagination);
      }
    } catch (error) {
      // Error loading pending discs
      if (error.message?.includes('Admin access required')) {
        Alert.alert(
          'Access Denied',
          'You need admin privileges to view pending disc submissions.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert('Load Error', error.message || 'Unable to load pending discs');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, pagination.offset, searchQuery, navigation]);

  // Initial load on screen focus
  useFocusEffect(
    useCallback(() => {
      const currentFilter = FILTER_OPTIONS.find((f) => f.key === activeFilter);
      loadPendingDiscs(currentFilter?.filters || {}, true);
    }, [activeFilter, loadPendingDiscs]),
  );

  // Search when query changes (debounced)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        const currentFilter = FILTER_OPTIONS.find((f) => f.key === activeFilter);
        loadPendingDiscs(currentFilter?.filters || {}, true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeFilter, loadPendingDiscs]);

  const handleFilterChange = useCallback((filterKey) => {
    setActiveFilter(filterKey);
    const filter = FILTER_OPTIONS.find((f) => f.key === filterKey);
    loadPendingDiscs(filter?.filters || {}, true);
  }, [loadPendingDiscs]);

  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
      const currentFilter = FILTER_OPTIONS.find((f) => f.key === activeFilter);
      loadPendingDiscs(currentFilter?.filters || {});
    }
  }, [pagination.hasMore, loading, activeFilter, loadPendingDiscs]);

  const handleRefresh = useCallback(() => {
    const currentFilter = FILTER_OPTIONS.find((f) => f.key === activeFilter);
    loadPendingDiscs(currentFilter?.filters || {}, true);
  }, [activeFilter, loadPendingDiscs]);

  const handleApproveDisc = useCallback(async (disc) => {
    if (approvingDiscs.has(disc.id)) return;

    Alert.alert(
      'Approve Disc',
      `Are you sure you want to approve "${disc.model}" by ${disc.brand}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setApprovingDiscs((prev) => new Set([...prev, disc.id]));

              await approveDisc(disc.id);

              // Remove from pending list
              setPendingDiscs((prev) => prev.filter((d) => d.id !== disc.id));

              // Update pagination total
              setPagination((prev) => ({
                ...prev,
                total: prev.total - 1,
              }));

              Alert.alert(
                'Disc Approved',
                `"${disc.model}" is now available in the disc database.`,
              );
            } catch (error) {
              // Error approving disc
              Alert.alert('Approval Error', error.message || 'Unable to approve disc');
            } finally {
              setApprovingDiscs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(disc.id);
                return newSet;
              });
            }
          },
        },
      ],
    );
  }, [approvingDiscs]);

  const renderDiscItem = useCallback(({ item }) => {
    const isApproving = approvingDiscs.has(item.id);

    return (
      <View style={styles.discItem}>
        <View style={styles.discHeader}>
          <View style={styles.discInfo}>
            <Text style={styles.discName}>{item.model}</Text>
            <Text style={styles.discBrand}>
              (
              {item.brand}
              )
            </Text>
          </View>
          <View style={styles.flightNumbers}>
            <Text style={styles.flightNumber}>{item.speed}</Text>
            <Text style={styles.flightSeparator}>|</Text>
            <Text style={styles.flightNumber}>{item.glide}</Text>
            <Text style={styles.flightSeparator}>|</Text>
            <Text style={styles.flightNumber}>{item.turn}</Text>
            <Text style={styles.flightSeparator}>|</Text>
            <Text style={styles.flightNumber}>{item.fade}</Text>
          </View>
        </View>

        <View style={styles.discFooter}>
          <Text style={styles.submissionDate}>
            Submitted
            {' '}
            {new Date(item.created_at).toLocaleDateString()}
          </Text>

          <Button
            title={isApproving ? 'Approving...' : 'Approve'}
            onPress={() => handleApproveDisc(item)}
            loading={isApproving}
            disabled={isApproving}
            size="small"
            variant="primary"
            style={styles.approveButton}
          />
        </View>
      </View>
    );
  }, [styles, approvingDiscs, handleApproveDisc]);

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersLabel}>Filter by Type</Text>
      <View style={styles.filtersRow}>
        {FILTER_OPTIONS.map((filter) => (
          <FilterChip
            key={filter.key}
            label={filter.label}
            selected={activeFilter === filter.key}
            onPress={() => handleFilterChange(filter.key)}
            style={styles.filterChip}
          />
        ))}
      </View>
    </View>
  );

  const renderListHeader = () => (
    <View>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Pending Disc Reviews</Text>
        <Text style={styles.subtitle}>
          Review and approve community-submitted discs
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search pending discs..."
        style={styles.searchBar}
      />

      {renderFilters()}

      {pendingDiscs.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {pagination.total}
            {' '}
            pending disc
            {pagination.total !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );

  const renderListFooter = () => {
    if (!loading || refreshing) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary.default} />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading && pendingDiscs.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.default} />
          <Text style={styles.loadingText}>Loading pending discs...</Text>
        </View>
      );
    }

    return (
      <EmptyState
        title={searchQuery ? 'No Pending Discs Found' : 'All Caught Up!'}
        message={
          searchQuery
            ? `No pending discs match "${searchQuery}".`
            : 'No discs are currently waiting for approval. Great work!'
        }
        actionText={searchQuery ? 'Clear Search' : 'Refresh'}
        onActionPress={() => {
          if (searchQuery) {
            setSearchQuery('');
          } else {
            handleRefresh();
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.primary }]}>
      <FlatList
        data={pendingDiscs}
        renderItem={renderDiscItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.default}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        style={styles.container}
        contentContainerStyle={pendingDiscs.length === 0 ? styles.emptyContent : undefined}
      />
    </SafeAreaView>
  );
}

AdminDiscScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default AdminDiscScreen;
