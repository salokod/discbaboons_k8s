/**
 * RoundsListScreen Component
 * Displays a list of user's rounds
 */

import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, FlatList, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import SkeletonCard from '../../components/rounds/SkeletonCard';
import RoundCard from '../../components/rounds/RoundCard';
import EmptyState from '../../design-system/components/EmptyState';
import { getRounds } from '../../services/roundService';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

const createStyles = (colors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  roundCount: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  createRoundButton: {
    width: 44,
    height: 44,
    borderRadius: Platform.OS === 'ios' ? 12 : 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});

function RoundsListScreen({ navigation: navigationProp }) {
  const hookNavigation = useNavigation();
  const navigation = navigationProp || hookNavigation;
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const result = await getRounds();
        setRounds(result.rounds);
      } catch (err) {
        setError(err.message || 'Unable to load rounds. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await getRounds();
      setRounds(result.rounds);
    } catch (err) {
      // Silent failure - keep existing rounds visible
      // Error is intentionally not shown to avoid disrupting user experience
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRounds();
      setRounds(result.rounds);
    } catch (err) {
      setError(err.message || 'Unable to load rounds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoundPress = (round) => {
    if (round.status === 'in_progress') {
      navigation.navigate('ScorecardRedesign', { roundId: round.id });
    } else if (round.status === 'completed') {
      navigation.navigate('RoundSummary', { roundId: round.id });
    } else {
      navigation.navigate('RoundDetail', { roundId: round.id });
    }
  };

  if (loading) {
    return (
      <StatusBarSafeView>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </StatusBarSafeView>
    );
  }

  const renderRoundCard = ({ item }) => (
    <RoundCard round={item} onPress={handleRoundPress} />
  );

  const roundCount = rounds.length;
  const roundText = roundCount === 1 ? 'round' : 'rounds';

  const styles = createStyles(colors);

  if (error) {
    return (
      <StatusBarSafeView>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Your Rounds</Text>
            <Text style={styles.roundCount}>
              {roundCount}
              {' '}
              {roundText}
            </Text>
          </View>
          <TouchableOpacity
            testID="create-round-header-button"
            onPress={() => navigation.navigate('CreateRound')}
            style={styles.createRoundButton}
            accessibilityLabel="Create new round"
            accessibilityHint="Start a new round of disc golf"
            accessibilityRole="button"
          >
            <Icon name="add-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View testID="error-state" style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            testID="error-retry-button"
            onPress={handleRetry}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </StatusBarSafeView>
    );
  }

  return (
    <StatusBarSafeView>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Rounds</Text>
          <Text style={styles.roundCount}>
            {roundCount}
            {' '}
            {roundText}
          </Text>
        </View>
        <TouchableOpacity
          testID="create-round-header-button"
          onPress={() => navigation.navigate('CreateRound')}
          style={styles.createRoundButton}
          accessibilityLabel="Create new round"
          accessibilityHint="Start a new round of disc golf"
          accessibilityRole="button"
        >
          <Icon name="add-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      {rounds.length === 0 ? (
        <EmptyState
          title="No Active Rounds"
          subtitle="Start a new round to track your game"
          actionLabel="Create New Round"
          onAction={() => navigation.navigate('CreateRound')}
        />
      ) : (
        <FlatList
          testID="rounds-flatlist"
          data={rounds}
          renderItem={renderRoundCard}
          keyExtractor={(item) => item.id}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          )}
        />
      )}
    </StatusBarSafeView>
  );
}

export default RoundsListScreen;
