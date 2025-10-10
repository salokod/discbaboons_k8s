/**
 * PlayerStandingsCard Component
 * Adaptive player display that responds to different player counts
 */

import { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';
import RankIndicator from '../../design-system/components/RankIndicator';

function PlayerStandingsCard({
  players,
  showContext = false,
  loading = false,
  error = null,
  onRetry = null,
  showRoundState = false,
}) {
  const colors = useThemeColors();
  const isCompactLayout = players.length <= 4;
  const layoutTestId = isCompactLayout ? 'compact-layout' : 'expanded-layout';

  const formatScore = (score) => {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : `${score}`;
  };

  const formatScoreWithContext = (player) => {
    const baseScore = formatScore(player.total_score);

    if (!showContext || !player.round_par) {
      return baseScore;
    }

    const parDiff = Math.abs(player.total_score);
    if (player.total_score === 0) {
      return `${baseScore} (at par)`;
    }

    const parText = player.total_score < 0
      ? `${parDiff} under par`
      : `${parDiff} over par`;

    return `${baseScore} (${parText})`;
  };

  const formatProgress = (player) => {
    if (!showContext || !player.holes_completed || !player.round_par) {
      return null;
    }

    const totalHoles = player.round_par / 3; // Assuming par 3 average per hole
    if (player.holes_completed < totalHoles) {
      return `${player.holes_completed}/${totalHoles} holes`;
    }

    return null;
  };

  const getRoundStatus = () => {
    if (!showRoundState || players.length === 0) {
      return null;
    }

    const firstPlayer = players[0];
    return firstPlayer.round_status === 'completed' ? 'FINAL' : 'LIVE';
  };

  const getLastUpdated = () => {
    if (!showRoundState || players.length === 0 || !players[0].last_updated) {
      return null;
    }

    const timestamp = new Date(players[0].last_updated);
    const now = new Date();
    const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));

    if (diffMinutes < 1) return 'Last updated just now';
    if (diffMinutes < 60) return `Last updated ${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Last updated ${diffHours}h ago`;

    return `Last updated ${timestamp.toLocaleDateString()}`;
  };

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    layout: {
      gap: spacing.md,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    playerName: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    playerScore: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      minWidth: 40,
      textAlign: 'right',
    },
    playerInfo: {
      flex: 1,
    },
    progressText: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: 2,
    },
    loadingSkeleton: {
      gap: spacing.md,
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    skeletonCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.border,
    },
    skeletonText: {
      height: 16,
      backgroundColor: colors.border,
      borderRadius: 4,
      flex: 1,
    },
    skeletonScore: {
      width: 40,
      height: 16,
      backgroundColor: colors.border,
      borderRadius: 4,
    },
    errorState: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    errorText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
    },
    retryButtonText: {
      ...typography.body,
      color: colors.background,
      fontWeight: '600',
    },
    roundStateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    roundStatusIndicator: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    roundStatusText: {
      ...typography.caption,
      color: colors.background,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    lastUpdatedText: {
      ...typography.caption,
      color: colors.textLight,
    },
  }), [colors]);

  // Loading state
  if (loading) {
    return (
      <View testID="player-standings-card" style={styles.card}>
        <View testID="loading-skeleton" style={styles.loadingSkeleton}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonText} />
            <View style={styles.skeletonScore} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonText} />
            <View style={styles.skeletonScore} />
          </View>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonText} />
            <View style={styles.skeletonScore} />
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View testID="player-standings-card" style={styles.card}>
        <View testID="error-state" style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry && (
            <TouchableOpacity testID="retry-button" style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Normal state
  const roundStatus = getRoundStatus();
  const lastUpdated = getLastUpdated();

  return (
    <View testID="player-standings-card" style={styles.card}>
      {roundStatus && (
        <View testID="round-status-indicator" style={styles.roundStateHeader}>
          <View style={styles.roundStatusIndicator}>
            <Text style={styles.roundStatusText}>{roundStatus}</Text>
          </View>
          {lastUpdated && <Text style={styles.lastUpdatedText}>{lastUpdated}</Text>}
        </View>
      )}
      <View testID={layoutTestId} style={styles.layout}>
        {players.map((player) => {
          const progress = formatProgress(player);
          return (
            <View key={player.id} style={styles.playerRow}>
              <RankIndicator rank={player.position} totalPlayers={players.length} />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.display_name || player.username}</Text>
                {progress && <Text style={styles.progressText}>{progress}</Text>}
              </View>
              <Text style={styles.playerScore}>{formatScoreWithContext(player)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

PlayerStandingsCard.propTypes = {
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    display_name: PropTypes.string,
    position: PropTypes.number.isRequired,
    total_score: PropTypes.number.isRequired,
    holes_completed: PropTypes.number,
    round_par: PropTypes.number,
    round_status: PropTypes.string,
    last_updated: PropTypes.string,
  })).isRequired,
  showContext: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  showRoundState: PropTypes.bool,
};

PlayerStandingsCard.defaultProps = {
  showContext: false,
  loading: false,
  error: null,
  onRetry: null,
  showRoundState: false,
};

export default PlayerStandingsCard;
