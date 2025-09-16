/**
 * FriendsScreen Component
 * Main screen for displaying friends list and managing friendships
 */

import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useEffect, useCallback, useState } from 'react';
import { useThemeColors } from '../../context/ThemeContext';
import { useFriends } from '../../context/FriendsContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import FriendCard from '../../components/FriendCard';
import { friendService } from '../../services/friendService';

function FriendsScreen({ navigation }) {
  const colors = useThemeColors();
  const {
    friends, loading, error, dispatch,
  } = useFriends();
  const [refreshing, setRefreshing] = useState(false);

  // Load friends from API
  const loadFriends = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
        dispatch({ type: 'REFRESH_FRIENDS' });
      } else {
        dispatch({ type: 'FETCH_FRIENDS_START' });
      }

      const response = await friendService.getFriends({ limit: 20, offset: 0 });
      dispatch({
        type: 'FETCH_FRIENDS_SUCCESS',
        payload: {
          friends: response.friends,
          pagination: response.pagination,
        },
      });
    } catch (err) {
      dispatch({
        type: 'FETCH_FRIENDS_ERROR',
        payload: { message: err.message || 'Failed to load friends' },
      });
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Load friends on mount
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadFriends(true);
  }, [loadFriends]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateText: {
      ...typography.body,
      color: colors.textLight,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      marginBottom: spacing.md,
    },
  });

  const renderFriendItem = ({ item }) => (
    <FriendCard friend={item} navigation={navigation} />
  );

  const renderEmptyState = () => (
    <View testID="friends-empty-state" style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>No friends yet</Text>
    </View>
  );

  // Show loading state on first load
  if (loading && !refreshing && friends.list.length === 0) {
    return (
      <AppContainer>
        <SafeAreaView testID="friends-screen" style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyStateText, { marginTop: spacing.md }]}>
              Loading friends...
            </Text>
          </View>
        </SafeAreaView>
      </AppContainer>
    );
  }

  // Show error state when there's an error and no cached data
  if (error && !loading && friends.list.length === 0) {
    return (
      <AppContainer>
        <SafeAreaView testID="friends-screen" style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.emptyStateText}>Pull to refresh</Text>
          </View>
        </SafeAreaView>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <SafeAreaView testID="friends-screen" style={styles.container}>
        <View style={styles.content}>
          <FlatList
            testID="friends-list"
            data={friends.list}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFriendItem}
            ListEmptyComponent={renderEmptyState}
            refreshControl={(
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            )}
          />
        </View>
      </SafeAreaView>
    </AppContainer>
  );
}

FriendsScreen.displayName = 'FriendsScreen';

export default FriendsScreen;
