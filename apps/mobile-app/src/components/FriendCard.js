/**
 * FriendCard Component
 * Displays individual friend information with bag statistics
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import Card from '../design-system/components/Card';

function FriendCard({ friend, navigation }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    content: {
      flexDirection: 'row',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    friendInfo: {
      flex: 1,
    },
    username: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    friendshipDate: {
      ...typography.caption,
      color: colors.textLight,
      marginBottom: spacing.xs,
    },
    bagStats: {
      ...typography.body2,
      color: colors.textLight,
    },
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePress = () => {
    navigation.navigate('FriendProfile', {
      friendId: friend.id,
      friend,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="friend-card"
        accessible
        accessibilityLabel={`Friend ${friend.username}, ${friend.bag_stats.total_bags} bags`}
        accessibilityHint="Tap to view profile"
        onPress={handlePress}
      >
        <Card>
          <View style={styles.content}>
            <View testID="friend-profile-image" style={styles.profileImage}>
              <Icon name="person" size={24} color={colors.textLight} />
            </View>

            <View style={styles.friendInfo}>
              <Text style={styles.username}>{friend.username}</Text>
              <Text style={styles.friendshipDate}>
                Friends since
                {' '}
                {formatDate(friend.friendship.created_at)}
              </Text>
              <Text style={styles.bagStats}>
                {friend.bag_stats.total_bags}
                {' '}
                bags (
                {friend.bag_stats.visible_bags}
                {' '}
                visible)
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
}

FriendCard.propTypes = {
  friend: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    friendship: PropTypes.shape({
      id: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
    }).isRequired,
    bag_stats: PropTypes.shape({
      total_bags: PropTypes.number.isRequired,
      visible_bags: PropTypes.number.isRequired,
      public_bags: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default memo(FriendCard);
