import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/tokens';
import QuickScoreInput from './QuickScoreInput';
import RunningTotalDisplay from './RunningTotalDisplay';

function PlayerScoreRow({
  playerName, score, par, runningTotal, onScoreChange,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    playerNameSection: {
      flex: 1,
      minWidth: 0,
      paddingRight: spacing.sm,
    },
    playerNameText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    scoreSection: {
      width: 184,
      alignItems: 'center',
    },
    totalSection: {
      width: 72,
      alignItems: 'center',
    },
  });

  return (
    <View testID="player-score-row" style={styles.container}>
      <View style={styles.playerNameSection}>
        <Text testID="player-name" style={styles.playerNameText} numberOfLines={1} ellipsizeMode="tail">
          {playerName}
        </Text>
      </View>

      <View style={styles.scoreSection}>
        <QuickScoreInput
          score={score}
          par={par}
          onIncrement={onScoreChange}
          onDecrement={onScoreChange}
        />
      </View>

      <View style={styles.totalSection}>
        <RunningTotalDisplay runningTotal={runningTotal} />
      </View>
    </View>
  );
}

// PropTypes defined for future implementation

PlayerScoreRow.propTypes = {
  playerName: PropTypes.string.isRequired,
  score: PropTypes.number,
  par: PropTypes.number.isRequired,
  runningTotal: PropTypes.number,
  onScoreChange: PropTypes.func.isRequired,
};

PlayerScoreRow.defaultProps = {
  score: null,
  runningTotal: null,
};

PlayerScoreRow.displayName = 'PlayerScoreRow';

export default memo(PlayerScoreRow);
