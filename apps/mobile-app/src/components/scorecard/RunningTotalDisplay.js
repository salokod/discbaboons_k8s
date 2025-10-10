import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';

function RunningTotalDisplay({ runningTotal }) {
  const colors = useThemeColors();

  // Handle null/undefined case - show placeholder
  if (runningTotal === null || runningTotal === undefined) {
    const styles = StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: colors.surface,
      },
      placeholder: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textSecondary,
      },
    });

    return (
      <View testID="running-total-display" style={styles.container}>
        <Text style={styles.placeholder}>-</Text>
      </View>
    );
  }

  // runningTotal is ALREADY the relative score (cumulative score - par)
  // No need to subtract par again
  const relativeScore = runningTotal;

  // Format relative score: positive "+3", negative "-2", zero "E"
  let displayText;
  if (relativeScore > 0) {
    displayText = `+${relativeScore}`;
  } else if (relativeScore < 0) {
    displayText = `${relativeScore}`;
  } else {
    displayText = 'E';
  }

  // Color coding: green for under par, red for over par, gray for even
  const getScoreColor = () => {
    if (relativeScore < 0) return colors.success; // Green for under par
    if (relativeScore > 0) return colors.error; // Red for over par
    return colors.textSecondary; // Gray for even
  };

  // Accessibility label
  const getAccessibilityLabel = () => {
    if (relativeScore === 0) return 'Even par';
    const direction = relativeScore > 0 ? 'over par' : 'under par';
    return `${Math.abs(relativeScore)} ${direction}`;
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      backgroundColor: colors.surface,
    },
    relativeText: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
  });

  return (
    <View
      testID="running-total-display"
      style={styles.container}
      accessibilityLabel={getAccessibilityLabel()}
    >
      <Text style={[styles.relativeText, { color: getScoreColor() }]}>
        {displayText}
      </Text>
    </View>
  );
}

RunningTotalDisplay.propTypes = {
  runningTotal: PropTypes.number,
};

RunningTotalDisplay.defaultProps = {
  runningTotal: null,
};

RunningTotalDisplay.displayName = 'RunningTotalDisplay';

export default memo(RunningTotalDisplay);
