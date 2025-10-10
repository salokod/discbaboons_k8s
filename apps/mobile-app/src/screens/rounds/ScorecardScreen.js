/**
 * ScorecardScreen Component
 * Scorecard entry with offline support and UX optimizations
 */

import {
  memo, useState, useEffect, useRef, useMemo,
} from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import NavigationHeader from '../../components/NavigationHeader';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import SkeletonLoader from '../../components/settings/SkeletonLoader';
import { getRoundDetails, getRoundPars, submitScores } from '../../services/roundService';

function ScorecardScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { roundId } = route?.params || {};
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(null);
  const [pars, setPars] = useState({});
  const [currentHole, setCurrentHole] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState({});
  const gestureHandlerRef = useRef(null);
  const scoresRef = useRef({});
  const currentPlayerIndexRef = useRef(0);

  // Fetch round data and pars on mount
  useEffect(() => {
    const loadRoundData = async () => {
      if (!roundId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [roundData, parsData] = await Promise.all([
          getRoundDetails(roundId),
          getRoundPars(roundId),
        ]);
        setRound(roundData);
        setPars(parsData);

        // Load saved scores from AsyncStorage
        const storageKey = `@scorecard_scores_${roundId}`;
        const savedScoresJson = await AsyncStorage.getItem(storageKey);
        if (savedScoresJson) {
          const savedScores = JSON.parse(savedScoresJson);
          scoresRef.current = savedScores;
          setScores(savedScores);
        }
      } catch (error) {
        // Error handling will be added in later slice
        // eslint-disable-next-line no-console
        console.error('Failed to load round data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoundData();
  }, [roundId]);

  const handleScoreInput = async (scoreRelativeToPar) => {
    if (!round || !round.players || !round.players[currentPlayerIndexRef.current]) return;

    const player = round.players[currentPlayerIndexRef.current];
    const par = pars[currentHole] || 3;
    const actualScore = scoreRelativeToPar === 'par' ? par : par + scoreRelativeToPar;

    // Check if score is an outlier (> 10 or > par+5)
    const isOutlier = actualScore > 10 || actualScore > (par + 5);

    const saveScore = async () => {
      // Update scores ref synchronously for immediate checking
      scoresRef.current = {
        ...scoresRef.current,
        [currentHole]: {
          ...(scoresRef.current[currentHole] || {}),
          [player.id]: actualScore,
        },
      };

      // Update scores state
      const newScores = scoresRef.current;
      setScores(newScores);

      // Save scores to AsyncStorage (don't block on this)
      AsyncStorage.setItem(`@scorecard_scores_${roundId}`, JSON.stringify(newScores)).catch(() => {
        // Silently ignore AsyncStorage errors
      });

      // Check if all players have now scored for this hole (using ref for synchronous check)
      const allPlayersHaveScored = round.players.every(
        (p) => scoresRef.current[currentHole]?.[p.id] !== undefined,
      );

      if (allPlayersHaveScored) {
        // All players have scored, submit to backend and advance to next hole
        try {
          const scoresArray = round.players.map((p) => ({
            hole: currentHole,
            player_id: p.id,
            score: scoresRef.current[currentHole][p.id],
          }));

          await submitScores(roundId, scoresArray);

          // Move to next hole after successful submission
          currentPlayerIndexRef.current = 0;
          setCurrentPlayerIndex(0);
          setCurrentHole(currentHole + 1);
        } catch (submitError) {
          Alert.alert(
            'Error',
            'Failed to submit scores. Please try again.',
          );
        }
      } else if (currentPlayerIndexRef.current < round.players.length - 1) {
        // Not all players have scored yet, move to next player
        currentPlayerIndexRef.current += 1;
        setCurrentPlayerIndex(currentPlayerIndexRef.current);
      }
    };

    if (isOutlier) {
      // Show confirmation alert for outlier scores
      Alert.alert(
        'Confirm Score',
        `Score of ${actualScore} on Par ${par}? This seems high.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Do nothing - score not saved
            },
          },
          {
            text: 'Confirm',
            onPress: () => {
              saveScore();
            },
          },
        ],
      );
    } else {
      // Normal score, save immediately
      await saveScore();
    }
  };

  const currentPlayer = round?.players?.[currentPlayerIndex];
  const currentPar = pars[currentHole] || 3;

  // Get score feedback color and icon
  const getScoreFeedback = (score, par) => {
    const relative = score - par;

    if (relative <= -2) {
      // Eagle or better
      return { color: colors.info, icon: '▼', label: 'Eagle' };
    }
    if (relative === -1) {
      // Birdie
      return { color: colors.success, icon: '▼', label: 'Birdie' };
    }
    if (relative === 0) {
      // Par
      return { color: colors.textLight, icon: '●', label: 'Par' };
    }
    if (relative === 1) {
      // Bogey
      return { color: colors.warning, icon: '▲', label: 'Bogey' };
    }
    // Double bogey or worse
    return { color: colors.error, icon: '▲', label: 'Double+' };
  };

  const styles = useMemo(() => StyleSheet.create({
    gestureContainer: {
      flex: 1,
    },
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
    holeInfo: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    holeNumber: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    holePar: {
      ...typography.body,
      color: colors.textLight,
    },
    playerInfo: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      padding: spacing.md,
    },
    playerName: {
      ...typography.h3,
      color: colors.text,
    },
    scoreButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    scoreButton: {
      minWidth: 80,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    scoreButtonText: {
      ...typography.h3,
      color: colors.text,
      fontWeight: 'bold',
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    navButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    navButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    navButtonText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    holeIndicator: {
      ...typography.body,
      color: colors.text,
    },
    scoreHistory: {
      marginTop: spacing.xl,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    scoreHistoryTitle: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    scoreItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    scoreIcon: {
      fontSize: 16,
      fontWeight: 'bold',
      width: 20,
    },
    scoreText: {
      ...typography.body,
    },
    skeletonHoleHeader: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    skeletonPlayerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: spacing.md,
    },
    skeletonSpacer: {
      flex: 1,
    },
    skeletonGap: {
      height: spacing.sm,
    },
  }), [colors]);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handlePreviousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
      currentPlayerIndexRef.current = 0;
      setCurrentPlayerIndex(0);
    }
  };

  const handleNextHole = async () => {
    if (currentHole < 18) {
      // Check if all players have scores for current hole
      const allPlayersScored = round?.players?.every(
        (player) => scores[currentHole]?.[player.id] !== undefined,
      );

      if (allPlayersScored) {
        // Submit scores before navigating
        try {
          const scoresArray = round.players.map((p) => ({
            hole: currentHole,
            player_id: p.id,
            score: scores[currentHole][p.id],
          }));

          await submitScores(roundId, scoresArray);

          // Navigate to next hole after successful submission
          setCurrentHole(currentHole + 1);
          currentPlayerIndexRef.current = 0;
          setCurrentPlayerIndex(0);
        } catch (error) {
          // Show error alert
          Alert.alert(
            'Error',
            'Failed to submit scores. Please try again.',
          );
          // eslint-disable-next-line no-console
          console.error('Failed to submit scores:', error);
        }
      } else {
        // No scores to submit, just navigate
        setCurrentHole(currentHole + 1);
        currentPlayerIndexRef.current = 0;
        setCurrentPlayerIndex(0);
      }
    }
  };

  const handleSwipeGesture = (event) => {
    const { translationX, state } = event.nativeEvent;

    // Only handle gesture when it ends
    if (state === State.END) {
      const SWIPE_THRESHOLD = 50;

      if (translationX < -SWIPE_THRESHOLD) {
        // Swipe left = next hole
        handleNextHole();
      } else if (translationX > SWIPE_THRESHOLD) {
        // Swipe right = previous hole
        handlePreviousHole();
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <StatusBarSafeView testID="scorecard-screen" style={styles.container}>
        <AppContainer>
          <NavigationHeader
            testID="scorecard-header"
            title="Scorecard"
            onBack={handleBack}
          />
          {loading ? (
            <View testID="scorecard-loading" style={styles.content}>
              {/* Hole Header Skeleton */}
              <View testID="skeleton-hole-header" style={styles.skeletonHoleHeader}>
                <SkeletonLoader width="40%" height={40} borderRadius={8} />
                <View style={styles.skeletonGap} />
                <SkeletonLoader width="30%" height={20} borderRadius={4} />
              </View>

              {/* Player Rows Skeleton */}
              {[1, 2, 3, 4].map((index) => (
                <View key={index} testID="skeleton-player-row" style={styles.skeletonPlayerRow}>
                  <SkeletonLoader width="60%" height={24} borderRadius={4} />
                  <View style={styles.skeletonSpacer} />
                  <SkeletonLoader width="15%" height={24} borderRadius={4} />
                </View>
              ))}
            </View>
          ) : (
            <PanGestureHandler
              ref={gestureHandlerRef}
              onGestureEvent={handleSwipeGesture}
              onHandlerStateChange={handleSwipeGesture}
            >
              <View testID="scorecard-swipe-container" style={styles.content}>
                <View style={styles.holeInfo}>
                  <Text testID="current-hole-number" style={styles.holeNumber}>
                    Hole
                    {' '}
                    {currentHole}
                  </Text>
                  <Text testID="current-hole-par" style={styles.holePar}>
                    Par
                    {' '}
                    {currentPar}
                  </Text>
                </View>

                <View style={styles.playerInfo}>
                  <Text testID="current-player-name" style={styles.playerName}>
                    {currentPlayer?.display_name || currentPlayer?.username || 'Player'}
                  </Text>
                </View>

                <View style={styles.scoreButtons}>
                  <TouchableOpacity
                    testID="score-button--2"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput(-2)}
                  >
                    <Text style={styles.scoreButtonText}>-2</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="score-button--1"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput(-1)}
                  >
                    <Text style={styles.scoreButtonText}>-1</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="score-button-par"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput('par')}
                  >
                    <Text style={styles.scoreButtonText}>Par</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="score-button-+1"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput(1)}
                  >
                    <Text style={styles.scoreButtonText}>+1</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="score-button-+2"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput(2)}
                  >
                    <Text style={styles.scoreButtonText}>+2</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="score-button-+3"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput(3)}
                  >
                    <Text style={styles.scoreButtonText}>+3</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="score-button-+6"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput(6)}
                  >
                    <Text style={styles.scoreButtonText}>+6</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="score-button-+8"
                    style={styles.scoreButton}
                    onPress={() => handleScoreInput(8)}
                  >
                    <Text style={styles.scoreButtonText}>+8</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.navigationContainer}>
                  <TouchableOpacity
                    testID="previous-hole-button"
                    style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
                    onPress={handlePreviousHole}
                    disabled={currentHole === 1}
                    accessibilityState={{ disabled: currentHole === 1 }}
                    accessibilityLabel="Previous hole"
                  >
                    <Text style={styles.navButtonText}>Previous</Text>
                  </TouchableOpacity>

                  <Text testID="hole-indicator" style={styles.holeIndicator}>
                    Hole
                    {' '}
                    {currentHole}
                    {' '}
                    of 18
                  </Text>

                  <TouchableOpacity
                    testID="next-hole-button"
                    style={[styles.navButton, currentHole === 18 && styles.navButtonDisabled]}
                    onPress={handleNextHole}
                    disabled={currentHole === 18}
                    accessibilityState={{ disabled: currentHole === 18 }}
                    accessibilityLabel="Next hole"
                  >
                    <Text style={styles.navButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>

                <View testID="score-history" style={styles.scoreHistory}>
                  <Text style={styles.scoreHistoryTitle}>Current Hole Scores</Text>
                  {round?.players?.map((player) => {
                    const playerScore = scores[currentHole]?.[player.id];
                    if (!playerScore) return null;

                    const feedback = getScoreFeedback(playerScore, currentPar);

                    return (
                      <View key={player.id} style={styles.scoreItem}>
                        <Text style={[styles.scoreIcon, { color: feedback.color }]}>
                          {feedback.icon}
                        </Text>
                        <Text style={styles.scoreText}>
                          {player.display_name || player.username}
                          :
                          {' '}
                          {playerScore}
                          {' '}
                          (
                          {feedback.label}
                          )
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </PanGestureHandler>
          )}
        </AppContainer>
      </StatusBarSafeView>
    </GestureHandlerRootView>
  );
}

ScorecardScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      roundId: PropTypes.string,
    }),
  }),
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }),
};

ScorecardScreen.defaultProps = {
  route: null,
  navigation: null,
};

ScorecardScreen.displayName = 'ScorecardScreen';

const MemoizedScorecardScreen = memo(ScorecardScreen);
MemoizedScorecardScreen.displayName = 'ScorecardScreen';

export default MemoizedScorecardScreen;
