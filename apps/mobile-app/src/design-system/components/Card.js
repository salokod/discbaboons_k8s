/**
 * Card Component
 */

import { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../spacing';

function Card({ children }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      padding: spacing.md,
      ...Platform.select({
        android: {
          elevation: 2,
        },
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }),
    },
  });

  return (
    <View testID="card" style={styles.card}>
      {children}
    </View>
  );
}

Card.propTypes = {
  children: PropTypes.node,
};

Card.defaultProps = {
  children: null,
};

// Add display name for React DevTools
Card.displayName = 'Card';

export default memo(Card);
