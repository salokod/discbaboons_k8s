/**
 * ScoreSummaryCard Component
 * Displays round statistics: best hole, worst hole, scoring average
 */

import { useMemo } from 'react';
import {
  View, Text, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';

function ScoreSummaryCard({ leaderboard }) {
  const colors = useThemeColors();

  const calculateStats = () => {
    if (!leaderboard || leaderboard.length === 0) {
      return {
        bestHole: 'N/A',
        worstHole: 'N/A',
        average: 'N/A',
      };
    }

    const allScores = [];
    const holeScores = {};

    // Aggregate all hole scores
    leaderboard.forEach((player) => {
      if (player.hole_scores) {
        Object.entries(player.hole_scores).forEach(([hole, score]) => {
          if (!holeScores[hole]) {
            holeScores[hole] = [];
          }
          holeScores[hole].push(score);
          allScores.push(score);
        });
      }
    });

    if (allScores.length === 0) {
      return {
        bestHole: 'N/A',
        worstHole: 'N/A',
        average: 'N/A',
      };
    }

    // Calculate average scores per hole
    const holeAverages = Object.entries(holeScores).map(([hole, scores]) => ({
      hole: parseInt(hole, 10),
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    }));

    // Find best and worst holes
    const sortedHoles = holeAverages.sort((a, b) => a.average - b.average);
    const bestHole = sortedHoles[0];
    const worstHole = sortedHoles[sortedHoles.length - 1];

    // Calculate overall scoring average
    const totalAverage = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;

    return {
      bestHole: `Hole ${bestHole.hole} (${bestHole.average.toFixed(1)})`,
      worstHole: `Hole ${worstHole.hole} (${worstHole.average.toFixed(1)})`,
      average: totalAverage.toFixed(2),
    };
  };

  const stats = calculateStats();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    statsContainer: {
      gap: spacing.md,
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    statLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    statLabel: {
      ...typography.body,
      color: colors.textLight,
      flex: 1,
    },
    statValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
  }), [colors]);

  return (
    <View testID="score-summary-card" style={styles.card}>
      <Text style={styles.title}>Round Statistics</Text>
      <View style={styles.statsContainer}>
        <View testID="best-hole-stat" style={styles.statRow}>
          <View style={styles.statLeft}>
            <Icon name="trophy-outline" size={20} color={colors.success} />
            <Text style={styles.statLabel}>Best Hole</Text>
          </View>
          <Text style={styles.statValue}>{stats.bestHole}</Text>
        </View>

        <View testID="worst-hole-stat" style={styles.statRow}>
          <View style={styles.statLeft}>
            <Icon name="alert-circle-outline" size={20} color={colors.error} />
            <Text style={styles.statLabel}>Worst Hole</Text>
          </View>
          <Text style={styles.statValue}>{stats.worstHole}</Text>
        </View>

        <View testID="scoring-average-stat" style={styles.statRow}>
          <View style={styles.statLeft}>
            <Icon name="analytics-outline" size={20} color={colors.primary} />
            <Text style={styles.statLabel}>Scoring Average</Text>
          </View>
          <Text style={styles.statValue}>{stats.average}</Text>
        </View>
      </View>
    </View>
  );
}

ScoreSummaryCard.propTypes = {
  leaderboard: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    display_name: PropTypes.string,
    position: PropTypes.number.isRequired,
    total_score: PropTypes.number.isRequired,
    hole_scores: PropTypes.objectOf(PropTypes.number),
  })).isRequired,
};

export default ScoreSummaryCard;
