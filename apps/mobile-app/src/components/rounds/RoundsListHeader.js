/**
 * RoundsListHeader Component
 */

import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function RoundsListHeader({ roundCount }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    header: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    roundCount: {
      ...typography.body,
      color: colors.textLight,
    },
  });

  const getRoundCountText = (count) => {
    if (count === 1) {
      return '1 round';
    }
    return `${count} rounds`;
  };

  return (
    <View
      style={styles.header}
      accessibilityRole="header"
      accessibilityLabel={`My Rounds section${roundCount !== undefined ? `, ${getRoundCountText(roundCount)}` : ''}`}
    >
      <Text style={styles.headerTitle} testID="header-title">My Rounds</Text>
      {roundCount !== undefined && (
        <Text
          style={styles.roundCount}
          testID="header-count"
          accessibilityLabel={`Total rounds: ${getRoundCountText(roundCount)}`}
        >
          {getRoundCountText(roundCount)}
        </Text>
      )}
    </View>
  );
}

RoundsListHeader.propTypes = {
  roundCount: PropTypes.number,
};

RoundsListHeader.defaultProps = {
  roundCount: undefined,
};

// Add display name for React DevTools
RoundsListHeader.displayName = 'RoundsListHeader';

export default memo(RoundsListHeader);
