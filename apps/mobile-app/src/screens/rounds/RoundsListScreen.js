/**
 * RoundsListScreen Component
 */

import {
  memo, useState, useEffect, useCallback,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import EmptyRoundsScreen from './EmptyRoundsScreen';
import { getRounds } from '../../services/roundService';
import RoundCard from '../../components/rounds/RoundCard';
import RoundsListHeader from '../../components/rounds/RoundsListHeader';

function RoundsListScreen({ navigation }) {
  const colors = useThemeColors();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load rounds from API
  const loadRounds = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const result = await getRounds({ limit: 20, offset: 0 });
      setRounds(result.rounds || []);
    } catch (error) {
      // For now, just log error and show empty state
      // Log error for debugging but don't expose to user in production
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to load rounds:', error);
      }
      setRounds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load rounds on mount
  useEffect(() => {
    loadRounds();
  }, [loadRounds]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButton: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.lg,
      backgroundColor: colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    createButtonText: {
      fontSize: 24,
      color: colors.surface,
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100, // Space for FAB
    },
  });

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadRounds(true);
  }, [loadRounds]);

  // Navigate to create round
  const handleCreateFirstRound = useCallback(() => {
    navigation?.navigate('CreateRound');
  }, [navigation]);

  // Render header
  const renderHeader = useCallback(() => (
    <RoundsListHeader roundCount={rounds.length} />
  ), [rounds.length]);

  // Render individual round item
  const renderRoundItem = useCallback(({ item: round }) => (
    <RoundCard
      round={round}
      onPress={() => navigation?.navigate('RoundDetail', { roundId: round.id })}
    />
  ), [navigation]);

  // Render empty list item when no rounds
  const renderEmptyComponent = useCallback(() => (
    <EmptyRoundsScreen
      navigation={navigation}
      onCreateFirstRound={handleCreateFirstRound}
    />
  ), [navigation, handleCreateFirstRound]);

  // Show loading state on first load
  if (loading && rounds.length === 0) {
    return (
      <StatusBarSafeView testID="rounds-list-screen" style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.textLight, marginTop: spacing.md }]}>
            Loading rounds...
          </Text>
        </View>
      </StatusBarSafeView>
    );
  }

  // Show rounds list with header
  return (
    <StatusBarSafeView testID="rounds-list-screen" style={styles.container}>
      <FlatList
        testID="rounds-list"
        data={rounds}
        renderItem={renderRoundItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        accessibilityLabel="Rounds list"
        accessibilityHint="Swipe down to refresh the list of rounds"
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            accessibilityLabel="Pull to refresh rounds"
          />
        )}
      />

      <TouchableOpacity
        testID="rounds-fab-button"
        style={styles.createButton}
        onPress={() => navigation?.navigate('CreateRound')}
      >
        <Text style={styles.createButtonText}>+</Text>
      </TouchableOpacity>
    </StatusBarSafeView>
  );
}

RoundsListScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};

RoundsListScreen.defaultProps = {
  navigation: null,
};

// Add display name for React DevTools
RoundsListScreen.displayName = 'RoundsListScreen';

const MemoizedRoundsListScreen = memo(RoundsListScreen);
MemoizedRoundsListScreen.displayName = 'RoundsListScreen';

export default MemoizedRoundsListScreen;
