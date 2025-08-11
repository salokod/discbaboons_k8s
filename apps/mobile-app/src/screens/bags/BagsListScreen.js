/**
 * BagsListScreen Component
 */

import {
  memo, useState, useEffect, useCallback,
} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import EmptyBagsScreen from './EmptyBagsScreen';
import BagCard from '../../components/bags/BagCard';
import { getBags } from '../../services/bagService';

function BagsListScreen({ navigation }) {
  const colors = useThemeColors();
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load bags from API
  const loadBags = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await getBags();
      setBags(response.bags || []);
    } catch (err) {
      // Error handling could be added here if needed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load bags on mount
  useEffect(() => {
    loadBags();
  }, [loadBags]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadBags(true);
  }, [loadBags]);

  // Navigate to create bag
  const handleCreateFirstBag = useCallback(() => {
    navigation?.navigate('CreateBag');
  }, [navigation]);

  // Navigate to bag detail
  const handleBagPress = useCallback((bag) => {
    navigation?.navigate('BagDetail', { bagId: bag.id });
  }, [navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    bagCount: {
      ...typography.body,
      color: colors.textLight,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
    },
    createButton: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.lg,
      backgroundColor: colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    createButtonText: {
      fontSize: 24,
      color: colors.surface,
    },
  });

  // Show loading state on first load
  if (loading && !refreshing && bags.length === 0) {
    return (
      <SafeAreaView testID="bags-list-screen" style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.bagCount, { marginTop: spacing.md }]}>Loading bags...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if no bags
  if (!loading && bags.length === 0) {
    return <EmptyBagsScreen navigation={navigation} onCreateFirstBag={handleCreateFirstBag} />;
  }

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Your Bags</Text>
      <Text style={styles.bagCount}>
        {bags.length}
        {' '}
        bag
        {bags.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  // Render bag item
  const renderBagItem = ({ item }) => (
    <BagCard
      bag={item}
      onPress={() => handleBagPress(item)}
    />
  );

  return (
    <SafeAreaView testID="bags-list-screen" style={styles.container}>
      <FlatList
        data={bags}
        renderItem={renderBagItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        )}
      />
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation?.navigate('CreateBag')}
      >
        <Text style={styles.createButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

BagsListScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};

BagsListScreen.defaultProps = {
  navigation: null,
};

// Add display name for React DevTools
BagsListScreen.displayName = 'BagsListScreen';

export default memo(BagsListScreen);
