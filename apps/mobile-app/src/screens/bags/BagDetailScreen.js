/**
 * BagDetailScreen Component
 * Shows detailed view of a bag with disc contents
 * Following CreateBagScreen design patterns and DiscSearchScreen disc display
 */

import { memo, useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import { getBag } from '../../services/bagService';
import DiscRow from '../../components/bags/DiscRow';

function BagDetailScreen({ route }) {
  const colors = useThemeColors();
  const { bagId } = route?.params || {};

  // State management
  const [bag, setBag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    title: {
      ...typography.h1,
      color: colors.text,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...typography.body,
      color: colors.text,
      marginTop: spacing.md,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    bagName: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    header: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    description: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.md,
    },
    discCount: {
      backgroundColor: colors.background,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      marginTop: spacing.md,
    },
    discCountText: {
      ...typography.bodyBold,
      color: colors.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyContent: {
      flexGrow: 1,
    },
    listContent: {
      paddingBottom: spacing.lg,
    },
    emptyText: {
      ...typography.h3,
      color: colors.textLight,
      marginBottom: spacing.sm,
    },
    emptySubtext: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
    },
  });

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
          <View style={styles.content}>
            <Text style={styles.title}>Bag Details</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text>
              Bag ID:
              {bagId}
            </Text>
          </View>
        </AppContainer>
      </SafeAreaView>
    );
  }

  // Success state with bag data
  const renderDiscItem = ({ item }) => <DiscRow disc={item} />;

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.bagName}>{bag?.name || 'Unnamed Bag'}</Text>
      {bag?.description && (
        <Text style={styles.description}>{bag.description}</Text>
      )}
      {bag?.bag_contents?.length > 0 && (
        <View style={styles.discCount}>
          <Text style={styles.discCountText}>
            {bag.bag_contents.length} disc{bag.bag_contents.length !== 1 ? 's' : ''} in bag
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No discs in this bag yet</Text>
      <Text style={styles.emptySubtext}>Add discs to start building your collection</Text>
    </View>
  );

  return (
    <SafeAreaView testID="bag-detail-screen" style={styles.container}>
      <FlatList
        data={bag?.bag_contents || []}
        renderItem={renderDiscItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          !bag?.bag_contents?.length ? styles.emptyContent : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
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
};

BagDetailScreen.defaultProps = {
  route: null,
};

BagDetailScreen.displayName = 'BagDetailScreen';

export default memo(BagDetailScreen);
