/**
 * BaboonsTabView Component
 * Tab navigation for Friends and Requests
 */

import { memo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { useFriends } from '../context/FriendsContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { friendService } from '../services/friendService';
import FriendCard from './FriendCard';
import EmptyState from '../design-system/components/EmptyState';

function BaboonsTabView({ navigation }) {
  const colors = useThemeColors();
  const { friends, requests, dispatch } = useFriends();
  const [activeTab, setActiveTab] = useState('friends');

  // Load friends data on component mount
  useEffect(() => {
    const loadFriends = async () => {
      try {
        dispatch({ type: 'FETCH_FRIENDS_START' });
        const response = await friendService.getFriends({ limit: 20, offset: 0 });
        dispatch({
          type: 'FETCH_FRIENDS_SUCCESS',
          payload: {
            friends: response.friends,
            pagination: response.pagination,
          },
        });
      } catch (error) {
        dispatch({
          type: 'FETCH_FRIENDS_ERROR',
          payload: { message: error.message },
        });
      }
    };

    loadFriends();
  }, [dispatch]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...typography.body2,
      fontWeight: '600',
      color: colors.textLight,
    },
    activeTabText: {
      color: colors.primary,
    },
    badge: {
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacing.xs,
    },
    badgeText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      ...typography.body,
      color: colors.textLight,
    },
    friendsList: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
  });

  const renderBadge = () => {
    if (requests.badge > 0) {
      return (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {requests.badge > 99 ? '99+' : requests.badge}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderFriendCard = ({ item }) => (
    <FriendCard friend={item} navigation={navigation} />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'friends':
        if (friends.loading) {
          return (
            <View testID="friends-tab" style={styles.content}>
              <Text style={styles.placeholderText}>Loading friends...</Text>
            </View>
          );
        }

        if (friends.error) {
          return (
            <View testID="friends-tab" style={styles.content}>
              <View testID="friends-empty-state">
                <EmptyState
                  title="Something went wrong"
                  subtitle={friends.error}
                />
              </View>
            </View>
          );
        }

        if (friends.list.length === 0) {
          return (
            <View testID="friends-tab" style={styles.content}>
              <View testID="friends-empty-state">
                <EmptyState
                  title="No Friends Yet"
                  subtitle="Start building your disc golf community by adding friends!"
                />
              </View>
            </View>
          );
        }

        return (
          <View testID="friends-tab" style={styles.friendsList}>
            <FlatList
              testID="friends-list"
              data={friends.list}
              renderItem={renderFriendCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );
      case 'requests':
        return (
          <View testID="requests-tab" style={styles.content}>
            <Text style={styles.placeholderText}>Requests list coming soon</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
          testID="friends-tab-button"
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
          testID="requests-tab-button"
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
          {renderBadge()}
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
}

BaboonsTabView.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default memo(BaboonsTabView);
