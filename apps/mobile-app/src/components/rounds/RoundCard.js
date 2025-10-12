/**
 * RoundCard Component
 */

import { memo } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Card from '../../design-system/components/Card';

function RoundCard({ round, onPress }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    cardTouchable: {
      marginBottom: spacing.sm + 4, // 8px + 4px = 12px for card spacing
    },
    cardContainer: {
      marginBottom: spacing.sm + 4, // 8px + 4px = 12px for card spacing
    },
    cardContent: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    titleSection: {
      flex: 1,
      marginRight: spacing.sm,
    },
    roundName: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    courseName: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.xs,
    },
    startTime: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    statusSection: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: colors.primary,
    },
    statusText: {
      ...typography.caption,
      color: colors.surface,
      fontWeight: '600',
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    footerItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
  });

  const handlePress = () => {
    onPress?.(round);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
        return 'play-circle';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const formatStartTime = (startTime) => {
    const date = new Date(startTime);
    return date.toLocaleDateString();
  };

  const getPlayerCountText = (count) => {
    if (count === 1) {
      return '1 player';
    }
    return `${count} players`;
  };

  const getSkinsDisplay = () => {
    if (round.skins_enabled) {
      return round.skins_value ? `Skins $${round.skins_value}` : 'Skins On';
    }
    return 'Skins Off';
  };

  const getRoundDisplayName = (name) => (name && name.trim() !== '' ? name : 'Unnamed Round');

  const renderCardContent = () => (
    <Card>
      <View style={styles.cardContent} testID="round-card-content">
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.roundName} testID="round-name" numberOfLines={1}>
              {getRoundDisplayName(round.name)}
            </Text>
            <Text style={styles.courseName} testID="course-name" numberOfLines={1}>
              {round.course_name}
            </Text>
            <Text style={styles.startTime} testID="start-time">
              {formatStartTime(round.start_time)}
            </Text>
          </View>
          <View style={styles.statusSection}>
            <View style={styles.statusBadge} testID="status-badge">
              <Icon
                name={getStatusIcon(round.status)}
                size={12}
                color={colors.surface}
              />
              <Text style={styles.statusText}>
                {round.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Icon
              name="people"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.footerText} testID="player-count">
              {getPlayerCountText(round.player_count)}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Icon
              name={round.skins_enabled ? 'cash' : 'close-circle'}
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.footerText} testID="skins-info">
              {getSkinsDisplay()}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        testID="round-card-touchable"
        style={styles.cardTouchable}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel={`${round.name} round card`}
        accessibilityRole="button"
        accessibilityHint="Tap to view round details"
      >
        {renderCardContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.cardContainer} testID="round-card-container">
      {renderCardContent()}
    </View>
  );
}

RoundCard.propTypes = {
  round: PropTypes.shape({
    name: PropTypes.string.isRequired,
    course_id: PropTypes.string,
    course_name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    start_time: PropTypes.string.isRequired,
    player_count: PropTypes.number.isRequired,
    skins_enabled: PropTypes.bool,
    skins_value: PropTypes.number,
    is_private: PropTypes.bool,
  }).isRequired,
  onPress: PropTypes.func,
};

RoundCard.defaultProps = {
  onPress: undefined,
};

// Add display name for React DevTools
RoundCard.displayName = 'RoundCard';

export default memo(RoundCard);
