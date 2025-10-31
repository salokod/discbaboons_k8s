import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, shadows } from '../../design-system/tokens';
import SaveStatusIndicator from './SaveStatusIndicator';

export default function HoleHeroCard({
  holeNumber, par, saveStatus, currentHole, totalHoles,
}) {
  const colors = useThemeColors();
  const progressPercentage = (currentHole / totalHoles) * 100;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
      ...shadows.md,
    },
    holeNumber: {
      fontSize: 64,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    parText: {
      fontSize: 24,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    progressBarContainer: {
      height: 4,
      backgroundColor: colors.border,
      marginTop: spacing.md,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      width: `${progressPercentage}%`,
    },
    statusContainer: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
  });

  return (
    <View testID="hole-hero-card" style={styles.container}>
      <Text testID="hole-number" style={styles.holeNumber}>
        {holeNumber}
      </Text>
      <Text testID="par-text" style={styles.parText}>
        Par
        {' '}
        {par}
      </Text>
      <View testID="progress-bar-container" style={styles.progressBarContainer}>
        <View testID="progress-bar-fill" style={styles.progressBarFill} />
      </View>
      <View style={styles.statusContainer}>
        <SaveStatusIndicator status={saveStatus} />
      </View>
    </View>
  );
}

HoleHeroCard.propTypes = {
  holeNumber: PropTypes.number.isRequired,
  par: PropTypes.number.isRequired,
  saveStatus: PropTypes.oneOf(['saved', 'saving', 'error']).isRequired,
  currentHole: PropTypes.number.isRequired,
  totalHoles: PropTypes.number.isRequired,
};
