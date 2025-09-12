/**
 * BagsListScreen Component
 */

import {
  memo, useState, useEffect, useCallback, useRef,
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
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useBagRefreshContext } from '../../context/BagRefreshContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import EmptyBagsScreen from './EmptyBagsScreen';
import SwipeableBagCard from '../../components/bags/SwipeableBagCard';
import DeleteBagConfirmationModal from '../../components/modals/DeleteBagConfirmationModal';
import { getBags, deleteBag } from '../../services/bagService';

function BagsListScreen({ navigation }) {
  const colors = useThemeColors();
  const { addBagListListener } = useBagRefreshContext();
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bagToDelete, setBagToDelete] = useState(null);
  const [deletingBag, setDeletingBag] = useState(false);
  const swipeableRefs = useRef({});

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

  // Listen for bag list refresh events
  useEffect(() => {
    const cleanup = addBagListListener(() => {
      loadBags();
    });
    return cleanup;
  }, [addBagListListener, loadBags]);

  // Close all swipes when screen gains focus
  useFocusEffect(
    useCallback(() => {
      Object.values(swipeableRefs.current).forEach((ref) => {
        ref?.close?.();
      });
    }, []),
  );

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

  // Navigate to lost discs
  const handleLostDiscsPress = useCallback(() => {
    navigation?.navigate('LostDiscs', { navigationSource: 'BagsList' });
  }, [navigation]);

  // Handle edit bag
  const handleEditBag = useCallback((bag) => {
    navigation?.navigate('EditBag', { bagId: bag.id, bag });
  }, [navigation]);

  // Handle delete bag
  const handleDeleteBag = useCallback((bag) => {
    setBagToDelete(bag);
    setDeleteModalVisible(true);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async (bag) => {
    try {
      setDeletingBag(true);
      await deleteBag(bag.id);
      await loadBags(); // Refresh the list
      setDeleteModalVisible(false);
      setBagToDelete(null);
    } catch (error) {
      // Error handling could be enhanced with toast notifications
      // TODO: Add proper error handling with user feedback
    } finally {
      setDeletingBag(false);
    }
  }, [loadBags]);

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setBagToDelete(null);
  }, []);

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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerContent: {
      flex: 1,
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
    lostDiscsButton: {
      minHeight: 44,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: Platform.select({ ios: 12, android: 16 }),
      backgroundColor: colors.warning,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
    },
    lostDiscsText: {
      color: colors.white,
      fontWeight: '600',
      fontSize: 14,
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
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Your Bags</Text>
        <Text style={styles.bagCount}>
          {bags.length}
          {' '}
          bag
          {bags.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <TouchableOpacity
        testID="lost-discs-header-button"
        style={styles.lostDiscsButton}
        onPress={handleLostDiscsPress}
        accessibilityLabel="Lost Discs - Search for lost discs"
        accessibilityHint="Opens the lost discs screen where you can search for and manage discs that have been marked as lost"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text style={styles.lostDiscsText}>Lost Discs</Text>
        <Icon
          name="search-outline"
          size={24}
          color={colors.white}
        />
      </TouchableOpacity>
    </View>
  );

  // Render bag item
  const renderBagItem = ({ item }) => (
    <SwipeableBagCard
      ref={(ref) => {
        swipeableRefs.current[item.id] = ref;
      }}
      bag={item}
      onPress={() => handleBagPress(item)}
      onEdit={handleEditBag}
      onDelete={handleDeleteBag}
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

      <DeleteBagConfirmationModal
        visible={deleteModalVisible}
        bag={bagToDelete}
        loading={deletingBag}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
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
