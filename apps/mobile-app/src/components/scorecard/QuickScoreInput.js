import {
  useState,
} from 'react';
import {
  View, Pressable, Text, StyleSheet, Animated,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, shadows, borderRadius } from '../../design-system/tokens';

export default function QuickScoreInput({
  score, par, onIncrement, onDecrement,
}) {
  const colors = useThemeColors();
  const [minusScale] = useState(new Animated.Value(1));
  const [plusScale] = useState(new Animated.Value(1));

  const handleIncrement = () => {
    if (!onIncrement) return;

    if (score === null && par !== null) {
      onIncrement(par);
    } else if (score !== null) {
      onIncrement(score + 1);
    } else {
      onIncrement();
    }
  };

  const handleDecrement = () => {
    if (!onDecrement) return;

    if (score === null && par !== null) {
      onDecrement(par - 1);
    } else if (score !== null) {
      onDecrement(score - 1);
    } else {
      onDecrement();
    }
  };

  // Calculate score color based on performance relative to par
  const getScoreColor = () => {
    if (score === null || par === null) {
      return colors.text;
    }

    const relativeToPar = score - par;

    if (relativeToPar <= -1) {
      // Birdie or better (eagle, albatross, etc.)
      return colors.success;
    }
    if (relativeToPar === 0) {
      // Par
      return colors.text;
    }
    if (relativeToPar === 1) {
      // Bogey
      return colors.warning;
    }
    // Double bogey or worse
    return colors.error;
  };

  const animatePress = (scaleValue, callback) => {
    // Scale down on press
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (callback) callback();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    button: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.md,
    },
    buttonText: {
      fontSize: 20,
      color: colors.primary,
      fontWeight: 'bold',
    },
    scoreDisplay: {
      marginHorizontal: spacing.lg,
      minWidth: 40,
      alignItems: 'center',
    },
    scoreText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: getScoreColor(),
    },
  });

  const displayScore = score === null ? '—' : String(score);

  return (
    <View testID="quick-score-input" style={styles.container}>
      <Pressable
        testID="quick-score-minus"
        onPress={() => animatePress(minusScale, handleDecrement)}
        accessibilityLabel="Decrease score"
        accessibilityRole="button"
      >
        <Animated.View style={[styles.button, { transform: [{ scale: minusScale }] }]}>
          <Text style={styles.buttonText}>−</Text>
        </Animated.View>
      </Pressable>

      <View style={styles.scoreDisplay}>
        <Text testID="quick-score-display" style={styles.scoreText}>
          {displayScore}
        </Text>
      </View>

      <Pressable
        testID="quick-score-plus"
        onPress={() => animatePress(plusScale, handleIncrement)}
        accessibilityLabel="Increase score"
        accessibilityRole="button"
      >
        <Animated.View style={[styles.button, { transform: [{ scale: plusScale }] }]}>
          <Text style={styles.buttonText}>+</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

QuickScoreInput.propTypes = {
  score: PropTypes.number,
  par: PropTypes.number,
  onIncrement: PropTypes.func,
  onDecrement: PropTypes.func,
};

QuickScoreInput.defaultProps = {
  score: null,
  par: null,
  onIncrement: () => {},
  onDecrement: () => {},
};
