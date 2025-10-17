/**
 * RoundDetailScreen Component
 * Shows detailed view of a round with course information and players
 */

import {
  memo, useCallback, useState, useEffect, useMemo,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import NavigationHeader from '../../components/NavigationHeader';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import PlayerStandingsCard from '../../components/rounds/PlayerStandingsCard';
import RoundActionsMenu from '../../components/rounds/RoundActionsMenu';
import ScoreSummaryCard from '../../components/rounds/ScoreSummaryCard';
import SideBetsCard from '../../components/rounds/SideBetsCard';
import {
  getRoundDetails, getRoundLeaderboard, pauseRound, completeRound, getRoundSideBets,
} from '../../services/roundService';

function RoundDetailScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { roundId } = route?.params || {};

  // State management for data fetching
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(Boolean(roundId));
  const [error, setError] = useState(null);

  // State management for leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(Boolean(roundId));
  const [leaderboardError, setLeaderboardError] = useState(null);

  // State management for side bets
  const [sideBets, setSideBets] = useState([]);
  const [sideBetsLoading, setSideBetsLoading] = useState(Boolean(roundId));

  // State for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Fetch round data
  const fetchRoundData = useCallback(async () => {
    if (!roundId) return;

    setLoading(true);
    setError(null);

    try {
      const roundData = await getRoundDetails(roundId);
      setRound(roundData);
    } catch (err) {
      setError(err.message || 'Failed to load round details');
    } finally {
      setLoading(false);
    }
  }, [roundId]);

  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(async () => {
    if (!roundId) return;

    setLeaderboardLoading(true);
    setLeaderboardError(null);

    try {
      const leaderboardResponse = await getRoundLeaderboard(roundId);
      setLeaderboard(leaderboardResponse.players || []);
    } catch (err) {
      setLeaderboardError(err.message || 'Failed to load leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  }, [roundId]);

  // Fetch side bets data
  const fetchSideBetsData = useCallback(async () => {
    if (!roundId) return;

    setSideBetsLoading(true);

    try {
      const sideBetsData = await getRoundSideBets(roundId);
      setSideBets(sideBetsData || []);
    } catch (err) {
      // Silently fail - side bets are optional
      setSideBets([]);
    } finally {
      setSideBetsLoading(false);
    }
  }, [roundId]);

  // Fetch data on mount
  useEffect(() => {
    fetchRoundData();
    fetchLeaderboardData();
    fetchSideBetsData();
  }, [fetchRoundData, fetchLeaderboardData, fetchSideBetsData]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    shimmerContainer: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    shimmerCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    shimmerTitle: {
      height: 24,
      backgroundColor: colors.border,
      borderRadius: 4,
      width: '60%',
    },
    shimmerLine: {
      height: 16,
      backgroundColor: colors.border,
      borderRadius: 4,
    },
    shimmerLineShort: {
      height: 16,
      backgroundColor: colors.border,
      borderRadius: 4,
      width: '40%',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
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
      color: colors.white,
      fontWeight: '600',
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    roundCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roundName: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    courseInfo: {
      marginBottom: spacing.md,
    },
    courseName: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    courseDetails: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.sm,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statusIcon: {
      marginRight: spacing.xs,
    },
    statusText: {
      ...typography.body,
      color: colors.success,
      fontWeight: '500',
    },
    dateText: {
      ...typography.caption,
      color: colors.textLight,
    },
    playersSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    playerIcon: {
      marginRight: spacing.sm,
    },
    playerName: {
      ...typography.body,
      color: colors.text,
    },
    enterScoresButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8,
      marginTop: spacing.lg,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: 'center',
    },
    enterScoresButtonText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  }), [colors]);

  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [navigation]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return 'Invalid date';
    }
  }, []);

  const formatStatus = useCallback((status) => {
    if (!status) return 'Unknown';

    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  const handlePauseRound = useCallback(async () => {
    if (!roundId) return;

    try {
      const updatedRound = await pauseRound(roundId);
      setRound(updatedRound);
    } catch (err) {
      setError(err.message || 'Failed to pause round');
    }
  }, [roundId]);

  const handleCompleteRound = useCallback(() => {
    if (!roundId) return;

    Alert.alert(
      'Complete Round',
      'Are you sure you want to complete this round? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRound = await completeRound(roundId);
              setRound(updatedRound);
            } catch (err) {
              setError(err.message || 'Failed to complete round');
            }
          },
        },
      ],
    );
  }, [roundId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRoundData(), fetchLeaderboardData(), fetchSideBetsData()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRoundData, fetchLeaderboardData, fetchSideBetsData]);

  return (
    <StatusBarSafeView testID="round-detail-screen" style={styles.container}>
      <AppContainer>
        <NavigationHeader
          testID="round-detail-header"
          title={round?.name || 'Round Details'}
          onBack={handleBack}
        />

        {loading && (
          <View testID="loading-indicator" style={styles.shimmerContainer}>
            {/* Shimmer for round card */}
            <View style={styles.shimmerCard}>
              <View style={styles.shimmerTitle} />
              <View style={styles.shimmerLine} />
              <View style={styles.shimmerLineShort} />
            </View>

            {/* Shimmer for players section */}
            <View style={styles.shimmerCard}>
              <View style={styles.shimmerTitle} />
              <View style={styles.shimmerLine} />
              <View style={styles.shimmerLine} />
            </View>

            {/* Shimmer for leaderboard */}
            <View style={styles.shimmerCard}>
              <View style={styles.shimmerLine} />
              <View style={styles.shimmerLine} />
              <View style={styles.shimmerLine} />
            </View>
          </View>
        )}

        {!loading && error && (
          <View testID="error-state" style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              testID="retry-button"
              style={styles.retryButton}
              onPress={fetchRoundData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Round Actions Menu */}
            {round && round.status === 'in_progress' && (
              <RoundActionsMenu
                onPause={handlePauseRound}
                onComplete={handleCompleteRound}
              />
            )}

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={(
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  testID="refresh-control"
                />
              )}
            >
              {round && (
              <>
                {/* Round Information Card */}
                <View testID="round-overview-card" style={styles.roundCard}>
                  <Text style={styles.roundName}>{round.name}</Text>

                  {round.course && (
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{round.course.name}</Text>
                    <Text style={styles.courseDetails}>
                      {round.course.location}
                      {' '}
                      •
                      {round.course.holes}
                      {' '}
                      holes
                    </Text>
                  </View>
                  )}

                  <View style={styles.statusContainer}>
                    <Icon
                      name="checkmark-circle-outline"
                      size={16}
                      color={colors.success}
                      style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>
                      {formatStatus(round.status)}
                    </Text>
                  </View>

                  <Text testID="round-date" style={styles.dateText}>
                    Started
                    {' '}
                    {formatDate(round.start_time)}
                  </Text>
                </View>

                {/* Players Section */}
                <View testID="players-section" style={styles.playersSection}>
                  <Text style={styles.sectionTitle}>Players</Text>

                  {round.players && round.players.length > 0 ? (
                    round.players.map((player, index) => (
                      <View key={player.id || index} style={styles.playerRow}>
                        <Icon
                          name="person-outline"
                          size={20}
                          color={colors.primary}
                          style={styles.playerIcon}
                        />
                        <Text style={styles.playerName}>
                          {player.display_name || player.username}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.dateText}>No players yet</Text>
                  )}
                </View>

                {/* Leaderboard Section */}
                <PlayerStandingsCard
                  players={leaderboard}
                  loading={leaderboardLoading}
                  error={leaderboardError}
                  showRoundState
                />

                {/* Side Bets Section */}
                <SideBetsCard
                  testID="side-bets-card"
                  sideBets={sideBets}
                  loading={sideBetsLoading}
                  onAddBet={() => {}}
                />

                {/* Score Summary */}
                {leaderboard && leaderboard.length > 0
                  && (round.status === 'completed' || round.status === 'cancelled') && (
                  <ScoreSummaryCard testID="score-summary-card" leaderboard={leaderboard} />
                )}
              </>
              )}
            </ScrollView>
          </>
        )}
      </AppContainer>
    </StatusBarSafeView>
  );
}

RoundDetailScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      roundId: PropTypes.string,
    }),
  }),
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }),
};

RoundDetailScreen.defaultProps = {
  route: null,
  navigation: null,
};

// Add display name for React DevTools
RoundDetailScreen.displayName = 'RoundDetailScreen';

const MemoizedRoundDetailScreen = memo(RoundDetailScreen);
MemoizedRoundDetailScreen.displayName = 'RoundDetailScreen';

export default MemoizedRoundDetailScreen;
