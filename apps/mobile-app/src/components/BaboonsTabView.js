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
  ScrollView,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { useFriends } from '../context/FriendsContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { friendService } from '../services/friendService';
import FriendCard from './FriendCard';
import IncomingRequestCard from './IncomingRequestCard';
import OutgoingRequestCard from './OutgoingRequestCard';
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

  // Load friend requests on component mount
  useEffect(() => {
    const loadRequests = async () => {
      try {
        dispatch({ type: 'FETCH_REQUESTS_START' });

        // Load incoming and outgoing requests separately
        const [incomingResponse, outgoingResponse] = await Promise.all([
          friendService.getRequests('incoming'),
          friendService.getRequests('outgoing'),
        ]);

        dispatch({
          type: 'FETCH_REQUESTS_SUCCESS',
          payload: {
            incoming: incomingResponse.requests,
            outgoing: outgoingResponse.requests,
          },
        });
      } catch (error) {
        // Handle error silently for now to not break friends loading
        dispatch({
          type: 'FETCH_REQUESTS_SUCCESS',
          payload: {
            incoming: [],
            outgoing: [],
          },
        });
      }
    };

    loadRequests();
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
      ...Platform.select({
        android: {
          // Ensure proper elevation and touch targets on Android
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
      }),
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      ...Platform.select({
        android: {
          // Ensure minimum touch target size for Android accessibility
          minHeight: 48,
        },
        ios: {
          minHeight: 44,
        },
      }),
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
    requestsList: {
      flex: 1,
    },
    requestsScrollView: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    sectionHeader: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
      marginTop: spacing.md,
    },
    firstSectionHeader: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
      marginTop: 0,
    },
    fab: {
      position: 'absolute',
      bottom: spacing.lg,
      right: spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: 32,
      width: 64,
      height: 64,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.4,
      shadowRadius: 8,
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

  const handleAcceptRequest = async (requestId) => {
    try {
      dispatch({
        type: 'ACCEPT_REQUEST_START',
        payload: { requestId },
      });

      await friendService.respondToRequest(requestId, 'accept');

      dispatch({
        type: 'ACCEPT_REQUEST_SUCCESS',
        payload: { requestId },
      });
    } catch (error) {
      dispatch({
        type: 'ACCEPT_REQUEST_ERROR',
        payload: { requestId, error: error.message },
      });
    }
  };

  const handleDenyRequest = async (requestId) => {
    try {
      dispatch({
        type: 'DENY_REQUEST_START',
        payload: { requestId },
      });

      await friendService.respondToRequest(requestId, 'deny');

      dispatch({
        type: 'DENY_REQUEST_SUCCESS',
        payload: { requestId },
      });
    } catch (error) {
      dispatch({
        type: 'DENY_REQUEST_ERROR',
        payload: { requestId, error: error.message },
      });
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      dispatch({
        type: 'CANCEL_REQUEST_START',
        payload: { requestId },
      });

      await friendService.cancelRequest(requestId);

      dispatch({
        type: 'CANCEL_REQUEST_SUCCESS',
        payload: { requestId },
      });
    } catch (error) {
      dispatch({
        type: 'CANCEL_REQUEST_ERROR',
        payload: { requestId, error: error.message },
      });
    }
  };

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
                  title="No Baboons in Your Troop Yet"
                  subtitle="Start building your disc golf community by adding baboons to your troop!"
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
      case 'requests': {
        if (requests.loading) {
          return (
            <View testID="requests-tab" style={styles.content}>
              <Text style={styles.placeholderText}>Loading invites...</Text>
            </View>
          );
        }

        const hasIncoming = requests.incoming.length > 0;
        const hasOutgoing = requests.outgoing.length > 0;

        if (!hasIncoming && !hasOutgoing) {
          return (
            <View testID="requests-tab" style={styles.content}>
              <View testID="requests-empty-state">
                <EmptyState
                  title="No Pending Invites"
                  subtitle="Your troop invites will appear here. Send invites to grow your baboon community!"
                />
              </View>
            </View>
          );
        }

        return (
          <View testID="requests-tab" style={styles.requestsList}>
            <ScrollView style={styles.requestsScrollView} showsVerticalScrollIndicator={false}>
              {hasIncoming && (
                <View>
                  <Text style={styles.firstSectionHeader}>Troop Requests</Text>
                  {requests.incoming.map((request) => (
                    <IncomingRequestCard
                      key={request.id}
                      request={request}
                      onAccept={handleAcceptRequest}
                      onDeny={handleDenyRequest}
                    />
                  ))}
                </View>
              )}

              {hasOutgoing && (
                <View>
                  <Text style={hasIncoming ? styles.sectionHeader : styles.firstSectionHeader}>
                    Pending Invites
                  </Text>
                  {requests.outgoing.map((request) => (
                    <OutgoingRequestCard
                      key={request.id}
                      request={request}
                      onCancel={handleCancelRequest}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const handleFindBaboons = () => {
    navigation.navigate('BaboonSearch');
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
            Troop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
          testID="requests-tab-button"
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Invites
          </Text>
          {renderBadge()}
        </TouchableOpacity>
      </View>

      {renderContent()}

      {/* Search FAB - only show on friends tab */}
      {activeTab === 'friends' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFindBaboons}
          testID="find-baboons-button"
          accessibilityLabel="Find baboons to join your troop"
        >
          <Icon name="people-outline" size={28} color={colors.surface} />
        </TouchableOpacity>
      )}
    </View>
  );
}

BaboonsTabView.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default memo(BaboonsTabView);
