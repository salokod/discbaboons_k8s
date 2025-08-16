/**
 * SwipeableDiscRow Component
 * Wrapper around DiscRow with swipe gesture support
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { Swipeable } from 'react-native-gesture-handler';
import HapticFeedback from 'react-native-haptic-feedback';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import DiscRow from './DiscRow';

const SwipeableDiscRow = React.forwardRef(({ disc, onSwipeRight, actions }, ref) => {
  const colors = useThemeColors();
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const placeholderActions = actions;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isSwipeActive ? `${colors.primary}10` : 'transparent',
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      overflow: 'hidden',
    },
    rightActions: {
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      minWidth: 100,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
    },
    actionText: {
      ...typography.caption,
      color: colors.surface,
      fontWeight: '700',
      fontSize: 12,
      marginTop: spacing.xs,
    },
    debugContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 4,
      zIndex: 1000,
    },
    debugText: {
      ...typography.caption,
      color: colors.surface,
      fontSize: 10,
      fontWeight: '700',
    },
  });

  const renderRightActions = onSwipeRight ? () => (
    <View testID="right-actions" style={styles.rightActions}>
      <Icon
        name="trash-outline"
        size={24}
        color={colors.surface}
      />
      <Text style={styles.actionText}>Remove</Text>
    </View>
  ) : undefined;

  const handleSwipeableOpen = (direction) => {
    if (direction === 'right' && onSwipeRight) {
      // Trigger haptic feedback
      HapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

      // Visual feedback
      setIsSwipeActive(false);
      onSwipeRight(disc);
    }
  };

  const handleSwipeableBeginDrag = () => {
    setIsSwipeActive(true);

    // Light haptic feedback on start
    HapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const handleSwipeableClose = () => {
    setIsSwipeActive(false);
  };

  return (
    <View testID="swipeable-disc-row" style={styles.container}>
      {/* Debug indicator */}
      {isSwipeActive && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>SWIPING</Text>
        </View>
      )}

      <Swipeable
        ref={ref}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableBeginDrag={handleSwipeableBeginDrag}
        onSwipeableClose={handleSwipeableClose}
        friction={2}
        overshootFriction={8}
      >
        <DiscRow disc={disc} />
      </Swipeable>
    </View>
  );
});

SwipeableDiscRow.propTypes = {
  disc: PropTypes.shape({
    id: PropTypes.string,
    model: PropTypes.string,
    brand: PropTypes.string,
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
    color: PropTypes.string,
    weight: PropTypes.string,
    condition: PropTypes.string,
    disc_master: PropTypes.shape({
      model: PropTypes.string,
      brand: PropTypes.string,
      speed: PropTypes.number,
      glide: PropTypes.number,
      turn: PropTypes.number,
      fade: PropTypes.number,
      color: PropTypes.string,
    }),
  }).isRequired,
  onSwipeRight: PropTypes.func,
  actions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onPress: PropTypes.func,
  })),
};

SwipeableDiscRow.defaultProps = {
  onSwipeRight: undefined,
  actions: undefined,
};

SwipeableDiscRow.displayName = 'SwipeableDiscRow';

export default React.memo(SwipeableDiscRow);
