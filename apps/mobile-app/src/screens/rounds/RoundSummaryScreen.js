/**
 * RoundSummaryScreen Component
 * Shows summary of a completed round
 */

import {
  memo, useCallback, useMemo, useState, useEffect,
} from 'react';
import {
  StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import NavigationHeader from '../../components/NavigationHeader';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import { getRoundDetails, getRoundLeaderboard } from '../../services/roundService';
import PlayerStandingsCard from '../../components/rounds/PlayerStandingsCard';

function RoundSummaryScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { roundId } = route?.params || {};

  // State
  const [round, setRound] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch round details and leaderboard
  const fetchData = useCallback(async () => {
    if (!roundId) {
      setLoading(false);
      return;
    }

    try {
      const [roundData, leaderboardData] = await Promise.all([
        getRoundDetails(roundId),
        getRoundLeaderboard(roundId),
      ]);
      setRound(roundData);
      setLeaderboard(leaderboardData.players || []);
    } catch (error) {
      // Log error for debugging but don't expose to user in production
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to load round data:', error);
      }
    }
  }, [roundId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    // Parse date as local time to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    metadataCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    roundName: {
      ...typography.h2,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    courseName: {
      ...typography.body,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    dateText: {
      ...typography.caption,
      color: colors.textLight,
    },
    viewDetailsButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    viewDetailsButtonText: {
      ...typography.body,
      color: colors.surface,
      fontWeight: '600',
    },
  }), [colors]);

  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleViewDetails = useCallback(() => {
    if (navigation?.navigate && roundId) {
      navigation.navigate('RoundDetail', { roundId });
    }
  }, [navigation, roundId]);

  return (
    <StatusBarSafeView testID="round-summary-screen" style={styles.container}>
      <AppContainer>
        <NavigationHeader
          testID="round-summary-header"
          title="Round Summary"
          onBack={handleBack}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            testID="round-summary-scrollview"
            style={styles.content}
            refreshControl={(
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            )}
          >
            {round && (
              <View style={styles.metadataCard}>
                <Text style={styles.roundName}>{round.name}</Text>
                <Text style={styles.courseName}>{round.course_name}</Text>
                <Text style={styles.dateText}>{formatDate(round.date)}</Text>
              </View>
            )}

            {leaderboard.length > 0 && (
              <PlayerStandingsCard players={leaderboard} />
            )}

            <TouchableOpacity
              testID="view-details-button"
              style={styles.viewDetailsButton}
              onPress={handleViewDetails}
            >
              <Text style={styles.viewDetailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </AppContainer>
    </StatusBarSafeView>
  );
}

RoundSummaryScreen.propTypes = {
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

RoundSummaryScreen.defaultProps = {
  route: null,
  navigation: null,
};

// Add display name for React DevTools
RoundSummaryScreen.displayName = 'RoundSummaryScreen';

const MemoizedRoundSummaryScreen = memo(RoundSummaryScreen);
MemoizedRoundSummaryScreen.displayName = 'RoundSummaryScreen';

export default MemoizedRoundSummaryScreen;
