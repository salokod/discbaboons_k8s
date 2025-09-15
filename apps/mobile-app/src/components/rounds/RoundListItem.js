import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Card from '../../design-system/components/Card';
import { getCourseDisplayName } from '../../utils/courseMapper';
import { formatRoundStartTime } from '../../utils/dateFormatter';

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

const getStatusColor = (status, colors) => {
  switch (status) {
    case 'in_progress':
      return colors.primary;
    case 'completed':
      return colors.success;
    case 'cancelled':
      return colors.error;
    default:
      return colors.textLight;
  }
};

const getRoundDisplayName = (name) => (name && name.trim() !== '' ? name : 'Unnamed Round');

const getPlayerCountText = (count) => {
  if (count === 1) {
    return '1 player';
  }
  return `${count} players`;
};

function RoundListItem({ round, onPress }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    cardTouchable: {
      marginVertical: spacing.xs,
      marginHorizontal: spacing.md,
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
      marginBottom: spacing.xs,
    },
    statusText: {
      ...typography.caption,
      color: colors.surface,
      fontWeight: '600',
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    privacyIcon: {
      marginLeft: spacing.xs,
    },
  });

  const handlePress = () => {
    onPress?.(round);
  };

  const getSkinsDisplay = () => {
    if (round.skins_enabled) {
      return round.skins_value ? `$${round.skins_value}` : 'On';
    }
    return 'Off';
  };

  const renderCardContent = () => (
    <Card>
      <View style={styles.cardContent} testID="round-card-container">
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.roundName} numberOfLines={1} testID="round-name">
              {getRoundDisplayName(round.name)}
            </Text>
            <Text style={styles.courseName} numberOfLines={1} testID="course-name">
              {getCourseDisplayName(round.course_id)}
            </Text>
            <Text style={styles.startTime} testID="start-time">
              {formatRoundStartTime(round.start_time)}
            </Text>
          </View>
          <View style={styles.statusSection} testID="badge-container">
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(round.status, colors) },
              ]}
              testID="status-badge"
            >
              <Icon
                name={getStatusIcon(round.status)}
                size={12}
                color={colors.surface}
                testID="status-icon"
              />
              <Text style={styles.statusText}>
                {round.status.replace('_', ' ')}
              </Text>
            </View>
            {round.is_private && (
              <Icon
                name="lock-closed"
                size={14}
                color={colors.textLight}
                style={styles.privacyIcon}
                testID="privacy-indicator"
              />
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem} testID="player-count-badge">
            <Icon
              name="people"
              size={14}
              color={colors.textSecondary}
              testID="player-count-icon"
            />
            <Text style={styles.infoText} testID="player-count-text">
              {getPlayerCountText(round.player_count)}
            </Text>
          </View>
          <View style={styles.infoItem} testID="skins-badge">
            <Icon
              name={round.skins_enabled ? 'cash' : 'close-circle'}
              size={14}
              color={colors.textSecondary}
              testID="skins-icon"
            />
            <Text style={styles.infoText} testID="skins-text">
              Skins
              {' '}
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
        style={styles.cardTouchable}
        activeOpacity={0.7}
        onPress={handlePress}
        testID="touchable-round-card"
        accessibilityLabel={`${getRoundDisplayName(round.name)} round card`}
        accessibilityRole="button"
        accessibilityHint="Tap to view round details"
      >
        {renderCardContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.cardTouchable}>
      {renderCardContent()}
    </View>
  );
}

RoundListItem.propTypes = {
  round: PropTypes.shape({
    id: PropTypes.string.isRequired,
    created_by_id: PropTypes.number,
    course_id: PropTypes.string.isRequired,
    name: PropTypes.string,
    start_time: PropTypes.string.isRequired,
    starting_hole: PropTypes.number,
    is_private: PropTypes.bool,
    skins_enabled: PropTypes.bool,
    skins_value: PropTypes.number,
    status: PropTypes.oneOf(['draft', 'active', 'completed', 'cancelled', 'in_progress']).isRequired,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
    player_count: PropTypes.number.isRequired,
  }).isRequired,
  onPress: PropTypes.func,
};

RoundListItem.defaultProps = {
  onPress: null,
};

// Add display name for React DevTools
RoundListItem.displayName = 'RoundListItem';

// Create memoized component and preserve PropTypes
const MemoizedRoundListItem = React.memo(RoundListItem);
MemoizedRoundListItem.propTypes = RoundListItem.propTypes;
MemoizedRoundListItem.defaultProps = RoundListItem.defaultProps;
MemoizedRoundListItem.displayName = RoundListItem.displayName;

export default MemoizedRoundListItem;
