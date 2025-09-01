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
  Platform,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useBagRefreshContext } from '../../context/BagRefreshContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import EmptyBagsScreen from './EmptyBagsScreen';
import BagCard from '../../components/bags/BagCard';
import BagActionsMenu from '../../components/bags/BagActionsMenu';
import { getBags, deleteBag } from '../../services/bagService';

function BagsListScreen({ navigation }) {
  const colors = useThemeColors();
  const { addBagListListener } = useBagRefreshContext();
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBag, setSelectedBag] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

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

  // Handle menu button press
  const handleMenuPress = useCallback((bag) => {
    setSelectedBag(bag);
    setShowActionsMenu(true);
  }, []);

  // Handle menu close
  const handleMenuClose = useCallback(() => {
    setShowActionsMenu(false);
    setSelectedBag(null);
  }, []);

  // Handle edit bag
  const handleEditBag = useCallback(() => {
    if (selectedBag) {
      navigation?.navigate('EditBag', { bag: selectedBag });
    }
    handleMenuClose();
  }, [selectedBag, navigation, handleMenuClose]);

  // Handle delete bag
  const handleDeleteBag = useCallback(() => {
    if (!selectedBag) return;

    Alert.alert(
      'Delete Bag',
      `Are you sure you want to delete '${selectedBag.name}'? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBag(selectedBag.id);
              // Reload bags after successful deletion
              loadBags();
            } catch (error) {
              // Handle different error types
              if (error.message?.includes('contains discs') || error.message?.includes('Cannot delete')) {
                Alert.alert(
                  'Cannot Delete Bag',
                  `Cannot delete '${selectedBag.name}' because it contains discs. Please move or remove all discs first.`,
                );
              } else if (error.message?.includes('not found') && error.status === 404) {
                // 404 means bag was already deleted - silently refresh the list
                loadBags();
              } else if (error.message?.includes('internet') || error.message?.includes('connection') || error.message?.includes('connect')) {
                Alert.alert(
                  'Delete Failed',
                  'Unable to delete bag. Please check your connection and try again.',
                );
              } else {
                Alert.alert(
                  'Delete Failed',
                  error.message || 'Something went wrong. Please try again.',
                );
              }
            }
            handleMenuClose();
          },
        },
      ],
    );
  }, [selectedBag, loadBags, handleMenuClose]);

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
    <BagCard
      bag={item}
      onPress={() => handleBagPress(item)}
      onMenuPress={handleMenuPress}
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

      <BagActionsMenu
        visible={showActionsMenu}
        onClose={handleMenuClose}
        onEdit={handleEditBag}
        onDelete={handleDeleteBag}
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
