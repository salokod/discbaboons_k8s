/**
 * LostDiscsScreen Component
 * Shows user's lost discs with orange theming and recovery functionality
 * Following BagDetailScreen design patterns with professional polish
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
  Platform,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import NavigationHeader from '../../components/NavigationHeader';
import SearchBar from '../../design-system/components/SearchBar';
import DiscRow from '../../components/bags/DiscRow';
import RecoverDiscModal from '../../components/modals/RecoverDiscModal';
import { getLostDiscs } from '../../services/bagService';

function LostDiscsScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { sourceBagId, navigationSource } = route?.params || {};

  // Determine back button label based on navigation source
  const getBackButtonLabel = useCallback(() => {
    switch (navigationSource) {
      case 'BagsList':
        return 'Return to Bags';
      case 'BagDetail':
        return 'Return to Bag Detail';
      case 'Settings':
        return 'Return to Settings';
      default:
        return 'Return to Settings'; // Default for backward compatibility
    }
  }, [navigationSource]);

  // State management
  const [lostDiscs, setLostDiscs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Recovery modal state
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [selectedDiscsForRecovery, setSelectedDiscsForRecovery] = useState([]);

  // Navigation handler
  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [navigation]);

  // Load lost discs data function
  const loadLostDiscs = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getLostDiscs({
        limit: 20,
        offset: 0,
        ...(sourceBagId && { sourceBagId }),
      });
      setLostDiscs(response.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load lost discs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sourceBagId]);

  // Load lost discs on mount
  useEffect(() => {
    loadLostDiscs();
  }, [loadLostDiscs]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    loadLostDiscs(true);
  }, [loadLostDiscs]);

  // Handle disc recovery - store disc and show modal
  const handleRecoverDisc = useCallback((disc) => {
    // Store the selected disc for recovery
    setSelectedDiscsForRecovery([disc]);
    setShowRecoverModal(true);
  }, []);

  // Filter discs based on search query
  const filteredDiscs = useMemo(() => {
    if (!searchQuery.trim()) {
      return lostDiscs;
    }

    const query = searchQuery.toLowerCase();
    return lostDiscs.filter((disc) => {
      const brand = (disc.brand || '').toLowerCase();
      const model = (disc.model || '').toLowerCase();
      const bagName = (disc.bag_name || '').toLowerCase();

      return brand.includes(query)
             || model.includes(query)
             || bagName.includes(query);
    });
  }, [lostDiscs, searchQuery]);

  // Create styles with orange theming for lost state
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
    // Orange-themed empty state for lost discs
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
    // Search section
    searchSection: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: `${colors.textLight}20`,
    },
    // Header section with orange accent
    headerSection: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#FF950030', // Orange accent border
    },
    headerText: {
      ...typography.caption,
      color: '#FF9500', // Orange color for lost disc theme
      fontWeight: '600',
      textAlign: 'center',
    },
    // Lost disc specific styles
    lostDiscContainer: {
      marginBottom: spacing.md,
    },
    lostDiscOverlay: {
      backgroundColor: '#FF950010', // Light orange background
      marginHorizontal: spacing.lg,
      marginTop: -spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomLeftRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      borderBottomRightRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      borderLeftWidth: 3,
      borderLeftColor: '#FF9500',
    },
    lostDiscInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    lostIcon: {
      marginRight: spacing.xs,
    },
    lostFromText: {
      ...typography.caption,
      color: '#FF9500',
      fontWeight: '600',
      flex: 1,
    },
    lostNotesText: {
      ...typography.caption,
      color: colors.textLight,
      fontStyle: 'italic',
      marginBottom: spacing.xs,
    },
    lostDateText: {
      ...typography.captionSmall,
      color: colors.textLight,
      fontSize: 11,
    },
    recoverButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF9500',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: Platform.select({
        ios: 6,
        android: 8,
      }),
      alignSelf: 'flex-end',
      marginTop: spacing.xs,
    },
    recoverButtonText: {
      ...typography.captionSmall,
      color: colors.surface,
      fontWeight: '600',
      marginLeft: 4,
      fontSize: 12,
    },
  });

  // Empty state for when no lost discs
  const renderEmptyState = useCallback(() => (
    <View testID="empty-state" style={styles.emptyContainer}>
      <Icon
        name="checkmark-circle-outline"
        size={80}
        color={colors.success}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Lost Discs</Text>
      <Text style={styles.emptySubtitle}>
        Great news! You don&apos;t have any lost discs at the moment.
        All your discs are safely in your bags.
      </Text>
    </View>
  ), [colors.success, styles]);

  // Empty state for when search returns no results
  const renderSearchEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Icon
        name="search-outline"
        size={64}
        color={colors.textLight}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Matching Lost Discs</Text>
      <Text style={styles.emptySubtitle}>
        No lost discs match &quot;
        {searchQuery}
        &quot;. Try adjusting your search terms.
      </Text>
    </View>
  ), [colors.textLight, searchQuery, styles]);

  // Determine which empty state to show
  const renderListEmptyComponent = useCallback(() => {
    if (searchQuery.trim() && lostDiscs.length > 0) {
      return renderSearchEmptyState();
    }
    return renderEmptyState();
  }, [searchQuery, lostDiscs.length, renderSearchEmptyState, renderEmptyState]);

  // Render lost disc item with orange theming and lost disc info
  const renderDiscItem = ({ item }) => (
    <View testID={`lost-disc-${item.id}`} style={styles.lostDiscContainer}>
      <DiscRow
        disc={item}
        hideFlightPath={false}
        showCompactFlightPath={false}
      />

      {/* Lost disc specific information overlay */}
      <View style={styles.lostDiscOverlay}>
        <View style={styles.lostDiscInfo}>
          <Icon
            name="warning-outline"
            size={16}
            color="#FF9500"
            style={styles.lostIcon}
          />
          <Text style={styles.lostFromText}>
            Lost from:
            {' '}
            {item.bag_name}
          </Text>
        </View>

        {item.lost_notes && (
          <Text style={styles.lostNotesText}>
            &quot;
            {item.lost_notes}
            &quot;
          </Text>
        )}

        {item.lost_at && (
          <Text style={styles.lostDateText}>
            Lost on:
            {' '}
            {new Date(item.lost_at).toLocaleDateString()}
          </Text>
        )}

        {/* Recovery button */}
        <TouchableOpacity
          style={styles.recoverButton}
          onPress={() => handleRecoverDisc(item)}
          testID={`recover-button-${item.id}`}
        >
          <Icon name="arrow-undo-outline" size={14} color={colors.surface} />
          <Text style={styles.recoverButtonText}>Recover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView testID="lost-discs-screen" style={styles.container}>
        <AppContainer>
          <NavigationHeader
            title="Lost Discs"
            onBack={handleBack}
            backAccessibilityLabel={getBackButtonLabel()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator testID="loading-indicator" size="large" color="#FF9500" />
            <Text style={styles.loadingText}>Loading lost discs...</Text>
          </View>
        </AppContainer>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView testID="lost-discs-screen" style={styles.container}>
        <AppContainer>
          <NavigationHeader
            title="Lost Discs"
            onBack={handleBack}
            backAccessibilityLabel={getBackButtonLabel()}
          />
          <View style={styles.errorContainer}>
            <Icon
              name="alert-circle-outline"
              size={64}
              color={colors.error}
              style={styles.emptyIcon}
            />
            <Text testID="error-message" style={styles.errorText}>
              {error}
            </Text>
          </View>
        </AppContainer>
      </SafeAreaView>
    );
  }

  // Success state with lost discs data
  return (
    <SafeAreaView testID="lost-discs-screen" style={styles.container}>
      <AppContainer>
        <NavigationHeader
          title="Lost Discs"
          onBack={handleBack}
          backAccessibilityLabel={getBackButtonLabel()}
        />

        {/* Orange-themed header for lost discs */}
        <View style={styles.headerSection}>
          <Text style={styles.headerText}>
            {filteredDiscs.length}
            {' '}
            Lost Disc
            {filteredDiscs.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Search section */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lost discs..."
            showSearchButton={false}
          />
        </View>

        <FlatList
          testID="lost-discs-list"
          data={filteredDiscs}
          renderItem={renderDiscItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderListEmptyComponent}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF9500"
            />
          )}
        />

        {/* Recovery Modal */}
        <RecoverDiscModal
          visible={showRecoverModal}
          discs={selectedDiscsForRecovery}
          onClose={() => setShowRecoverModal(false)}
          onSuccess={() => {
            setShowRecoverModal(false);
            loadLostDiscs(true); // Refresh the lost discs list
          }}
        />
      </AppContainer>
    </SafeAreaView>
  );
}

LostDiscsScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      sourceBagId: PropTypes.string,
      navigationSource: PropTypes.string,
    }),
  }),
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }),
};

LostDiscsScreen.defaultProps = {
  route: null,
  navigation: null,
};

LostDiscsScreen.displayName = 'LostDiscsScreen';

export default memo(LostDiscsScreen);
