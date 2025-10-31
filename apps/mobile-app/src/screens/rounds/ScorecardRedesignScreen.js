import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';
import {
  getRoundDetails, submitScores,
} from '../../services/roundService';
import { useThemeColors } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { typography } from '../../design-system/typography';
import { spacing, borderRadius } from '../../design-system/tokens';
import PlayerScoreRow from '../../components/scorecard/PlayerScoreRow';
import NavigationHeader from '../../components/NavigationHeader';
import SkeletonLoader from '../../components/settings/SkeletonLoader';
import HoleHeroCard from '../../components/scorecard/HoleHeroCard';
import OfflineIndicator from '../../components/OfflineIndicator';
import CollapsibleSection from '../../components/scorecard/CollapsibleSection';
import { addToQueue, processQueue } from '../../services/offlineQueue';
import useNetworkStatus from '../../hooks/useNetworkStatus';

function ScorecardRedesignScreen({ route, navigation }) {
  const { roundId } = route?.params || {};
  const colors = useThemeColors();
  const { show: showToast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [roundData, setRoundData] = useState(null);
  const [error, setError] = useState(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved');
  const [submittingRound, setSubmittingRound] = useState(false);

  useEffect(() => {
    const fetchRoundDetails = async () => {
      try {
        setLoading(true);
        const data = await getRoundDetails(roundId);
        setRoundData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoundDetails();
  }, [roundId]);

  // Load scores from AsyncStorage on mount
  useEffect(() => {
    const loadScores = async () => {
      try {
        const storageKey = `scorecard_${roundId}`;
        const savedScores = await AsyncStorage.getItem(storageKey);
        if (savedScores) {
          const parsed = JSON.parse(savedScores);

          // Migration: detect old flat format
          if (parsed && typeof parsed === 'object' && !Object.values(parsed).some((v) => typeof v === 'object')) {
            // Old format detected: { playerId: score }
            // Migrate to new format: { currentHole: { playerId: score } }
            const migrated = { [currentHole]: parsed };
            setScores(migrated);
            // Save migrated format back to AsyncStorage
            await AsyncStorage.setItem(storageKey, JSON.stringify(migrated));
          } else {
            // New format already, use as-is
            setScores(parsed);
          }
        }
      } catch (err) {
        // Silent fail - if loading fails, just start with empty scores
      }
    };

    if (roundId) {
      loadScores();
    }
  }, [roundId, currentHole]);

  // Create debounced save function (600ms delay)
  const debouncedSaveRef = useRef(null);

  const saveScoresToStorage = useCallback(async (scoresToSave) => {
    try {
      const storageKey = `scorecard_${roundId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(scoresToSave));
      setSaveStatus('saved');
      showToast('Score saved', 'success', 2000);
    } catch (err) {
      // If saving fails, show error status
      setSaveStatus('error');
      showToast('Failed to save score', 'error', 2000);
    }
  }, [roundId, showToast]);

  useEffect(() => {
    // Initialize debounced save function
    debouncedSaveRef.current = debounce(saveScoresToStorage, 600);

    // Cleanup on unmount
    return () => {
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [saveScoresToStorage]);

  // Save scores to AsyncStorage with debounce whenever they change
  useEffect(() => {
    if (roundId && Object.keys(scores).length > 0 && debouncedSaveRef.current) {
      setSaveStatus('saving');
      debouncedSaveRef.current(scores);
    }
  }, [scores, roundId]);

  // Process offline queue when coming back online
  useEffect(() => {
    if (isOnline) {
      // Process any pending operations in the queue
      const handleQueueProcessing = async () => {
        try {
          await processQueue(async (operation) => {
            if (operation.type === 'SUBMIT_SCORES') {
              const { roundId: opRoundId, scores: opScores } = operation.data;
              await submitScores(opRoundId, opScores);
            }
          });
        } catch (queueError) {
          // Silently handle queue processing errors
        }
      };

      handleQueueProcessing();
    }
  }, [isOnline]);

  const par = roundData?.course?.holes?.[currentHole - 1]?.par || 3;

  const totalHoles = roundData?.course?.holes?.length || 18;
  const isPrevDisabled = currentHole === 1;
  const isNextDisabled = currentHole === totalHoles;

  const handlePrevHole = () => {
    if (currentHole > 1) {
      // Flush debounced save before navigation
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.flush();
      }
      setCurrentHole(currentHole - 1);
    }
  };

  const handleSubmitScores = async () => {
    try {
      setSubmittingRound(true);
      // Get all players from roundData
      const players = roundData?.players || [];
      const currentHoleScores = scores[currentHole] || {};

      // Check if all players have scores for the current hole
      const allPlayersHaveScores = players.every((player) => {
        const score = currentHoleScores[player.id];
        return score !== null && score !== undefined;
      });

      // Only submit if all players have scores
      if (allPlayersHaveScores && players.length > 0) {
        // Build scores array for submission
        const scoresArray = players.map((player) => ({
          playerId: player.id,
          holeNumber: currentHole,
          strokes: currentHoleScores[player.id],
        }));

        // Check network status and either submit or queue
        if (isOnline) {
          // Submit scores to backend when online
          await submitScores(roundId, scoresArray);
        } else {
          // Add to offline queue when offline
          await addToQueue({
            type: 'SUBMIT_SCORES',
            data: {
              roundId,
              scores: scoresArray,
            },
          });
        }
      }
    } catch (submitError) {
      // Silently handle error - don't block navigation
      // Error is logged but not displayed to user
      // Future: Could show a retry option
    } finally {
      setSubmittingRound(false);
    }
  };

  const handleNextHole = () => {
    if (currentHole < totalHoles) {
      // Flush debounced save before navigation
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.flush();
      }
      // Submit scores in background (don't await)
      handleSubmitScores();
      // Navigate immediately
      setCurrentHole(currentHole + 1);
    }
  };

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const { velocityX, translationX } = event;
      // Require minimum swipe distance
      if (Math.abs(translationX) < 50) {
        return;
      }
      // Swipe right (positive velocity) = previous hole
      if (velocityX > 0 && currentHole > 1) {
        runOnJS(handlePrevHole)();
      }
      // Swipe left (negative velocity) = next hole
      if (velocityX < 0 && currentHole < totalHoles) {
        runOnJS(handleNextHole)();
      }
    });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenTitle: {
      ...typography.h2,
      color: colors.text,
      fontWeight: 'bold',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    playersSection: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    navButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    navButtonDisabled: {
      backgroundColor: colors.border,
    },
    navButtonText: {
      ...typography.button,
      color: colors.buttonText,
    },
    navButtonTextDisabled: {
      color: colors.textSecondary,
    },
    completeButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.success || colors.primary,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    completeButtonText: {
      ...typography.button,
      color: colors.buttonText,
      fontWeight: 'bold',
    },
    shimmerPlayerRowContainer: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    shimmerPlayerRowContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    collapsibleSectionsContainer: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    roundInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    roundInfoLabel: {
      ...typography.body,
      color: colors.textLight,
    },
    roundInfoValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    leaderboardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leaderboardRowLast: {
      borderBottomWidth: 0,
    },
    leaderboardRank: {
      ...typography.body,
      color: colors.textLight,
      width: 30,
    },
    leaderboardName: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    leaderboardScore: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    sideBetRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sideBetRowLast: {
      borderBottomWidth: 0,
    },
    sideBetName: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    sideBetAmount: {
      ...typography.body,
      color: colors.success || colors.primary,
      fontWeight: '600',
    },
    emptyText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <SafeAreaView testID="scorecard-redesign-screen" style={styles.container}>
        <View style={styles.container}>
          <Text testID="screen-title" style={styles.screenTitle}>
            Scorecard
          </Text>
          <HoleHeroCard
            holeNumber={1}
            par={3}
            saveStatus="saved"
            currentHole={1}
            totalHoles={18}
          />
          <View style={styles.playersSection}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                testID={`shimmer-player-row-${index}`}
                style={styles.shimmerPlayerRowContainer}
              >
                <View style={styles.shimmerPlayerRowContent}>
                  <SkeletonLoader width="40%" height={20} borderRadius={4} />
                  <SkeletonLoader width={80} height={36} borderRadius={8} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView testID="scorecard-redesign-screen" style={styles.container}>
        <View style={styles.container}>
          <Text>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const players = roundData?.players || [];

  const handleScoreChange = (playerId) => (newScore) => {
    setScores((prev) => ({
      ...prev,
      [currentHole]: {
        ...(prev[currentHole] || {}),
        [playerId]: newScore,
      },
    }));
  };

  const calculateRunningTotal = (playerId) => {
    // Calculate cumulative relative score (score - par) across ALL holes with scores
    let relativeTotal = 0;
    let hasAnyScore = false;

    // Iterate through ALL holes in the scores object (not just up to currentHole)
    Object.keys(scores).forEach((holeNum) => {
      const holeScores = scores[holeNum] || {};
      const playerScore = holeScores[playerId];

      // If player has a score for this hole, calculate relative to par
      if (playerScore !== null && playerScore !== undefined) {
        const holePar = roundData?.course?.holes?.[holeNum - 1]?.par || 3;
        relativeTotal += (playerScore - holePar);
        hasAnyScore = true;
      }
    });

    // Only return null if NO holes have any scores (to show placeholder)
    if (!hasAnyScore) {
      return null;
    }

    return relativeTotal;
  };

  const renderPlayerRow = ({ item: player }) => {
    const currentHoleScores = scores[currentHole] || {};
    const playerScore = currentHoleScores[player.id] || null;

    return (
      <PlayerScoreRow
        playerName={player.display_name || player.username || 'Guest'}
        score={playerScore}
        par={par}
        runningTotal={calculateRunningTotal(player.id)}
        onScoreChange={handleScoreChange(player.id)}
      />
    );
  };

  const isLastHole = currentHole === totalHoles;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView testID="scorecard-redesign-screen" style={styles.container}>
        <NavigationHeader
          title={roundData?.course?.name || roundData?.name || 'Scorecard'}
          onBack={() => navigation.goBack()}
          backAccessibilityLabel="Go back to round details"
          rightComponent={<OfflineIndicator />}
        />
        <GestureDetector testID="gesture-detector" gesture={panGesture}>
          <View style={styles.container}>
            <ScrollView testID="scorecard-scrollview">
              <HoleHeroCard
                holeNumber={currentHole}
                par={par}
                saveStatus={saveStatus}
                currentHole={currentHole}
                totalHoles={totalHoles}
              />

              <View style={styles.playersSection}>
                <FlatList
                  testID="players-flatlist"
                  data={players}
                  keyExtractor={(player) => player.id}
                  renderItem={renderPlayerRow}
                  scrollEnabled={false}
                />
              </View>

              <View style={styles.collapsibleSectionsContainer}>
                <CollapsibleSection title="Round Info">
                  <View>
                    <View style={styles.roundInfoRow}>
                      <Text style={styles.roundInfoLabel}>Course</Text>
                      <Text style={styles.roundInfoValue}>{roundData?.course?.name || 'N/A'}</Text>
                    </View>
                    {roundData?.course?.location && (
                      <View style={styles.roundInfoRow}>
                        <Text style={styles.roundInfoLabel}>Location</Text>
                        <Text style={styles.roundInfoValue}>{roundData.course.location}</Text>
                      </View>
                    )}
                    <View style={styles.roundInfoRow}>
                      <Text style={styles.roundInfoLabel}>Holes</Text>
                      <Text style={styles.roundInfoValue}>
                        {roundData?.course?.holes?.length || 0}
                        {' '}
                        Holes
                      </Text>
                    </View>
                    {roundData?.status && (
                      <View style={styles.roundInfoRow}>
                        <Text style={styles.roundInfoLabel}>Status</Text>
                        <Text style={styles.roundInfoValue}>{formatStatus(roundData.status)}</Text>
                      </View>
                    )}
                    {roundData?.created_at && (
                      <View style={styles.roundInfoRow}>
                        <Text style={styles.roundInfoLabel}>Date</Text>
                        <Text style={styles.roundInfoValue}>
                          {formatDate(roundData.created_at)}
                        </Text>
                      </View>
                    )}
                  </View>
                </CollapsibleSection>

                <CollapsibleSection title="Leaderboard">
                  <View>
                    {players.map((player, index) => {
                      const runningTotal = calculateRunningTotal(player.id);
                      const displayScore = runningTotal === null ? '--' : runningTotal;
                      return (
                        <View
                          key={player.id}
                          style={[
                            styles.leaderboardRow,
                            index === players.length - 1 && styles.leaderboardRowLast,
                          ]}
                        >
                          <Text style={styles.leaderboardRank}>{index + 1}</Text>
                          <Text style={styles.leaderboardName}>
                            {player.display_name || player.username || 'Guest'}
                          </Text>
                          <Text style={styles.leaderboardScore}>{displayScore}</Text>
                        </View>
                      );
                    })}
                  </View>
                </CollapsibleSection>

                <CollapsibleSection title="Side Bets">
                  <View>
                    {(roundData?.side_bets || []).length === 0 ? (
                      <Text style={styles.emptyText}>No side bets for this round</Text>
                    ) : (
                      (roundData?.side_bets || []).map((bet, index) => (
                        <View
                          key={bet.id}
                          style={[
                            styles.sideBetRow,
                            index === (roundData?.side_bets || []).length - 1
                              && styles.sideBetRowLast,
                          ]}
                        >
                          <Text style={styles.sideBetName}>{bet.name}</Text>
                          <Text style={styles.sideBetAmount}>
                            $
                            {bet.amount}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </CollapsibleSection>
              </View>
            </ScrollView>
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                testID="prev-hole-button"
                style={[styles.navButton, isPrevDisabled && styles.navButtonDisabled]}
                onPress={handlePrevHole}
                disabled={isPrevDisabled}
                accessibilityLabel="Previous hole"
                accessibilityHint="Navigate to the previous hole"
                accessibilityRole="button"
                accessibilityState={{ disabled: isPrevDisabled }}
              >
                <Text
                  style={[styles.navButtonText, isPrevDisabled && styles.navButtonTextDisabled]}
                >
                  Previous
                </Text>
              </TouchableOpacity>
              {isLastHole ? (
                <TouchableOpacity
                  testID="complete-round-button"
                  style={[styles.completeButton, submittingRound && styles.navButtonDisabled]}
                  onPress={handleSubmitScores}
                  disabled={submittingRound}
                  accessibilityRole="button"
                  accessibilityLabel="Complete round"
                  accessibilityHint="Submit all scores and complete the round"
                  accessibilityState={{ disabled: submittingRound }}
                >
                  {submittingRound ? (
                    <ActivityIndicator testID="complete-round-loading" color={colors.buttonText} />
                  ) : (
                    <Text style={styles.completeButtonText}>
                      Complete Round
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="next-hole-button"
                  style={[styles.navButton, isNextDisabled && styles.navButtonDisabled]}
                  onPress={handleNextHole}
                  disabled={isNextDisabled}
                  accessibilityLabel="Next hole"
                  accessibilityHint="Navigate to the next hole"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isNextDisabled }}
                >
                  <Text
                    style={[styles.navButtonText, isNextDisabled && styles.navButtonTextDisabled]}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GestureDetector>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

ScorecardRedesignScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      roundId: PropTypes.string,
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }).isRequired,
};

export default ScorecardRedesignScreen;
