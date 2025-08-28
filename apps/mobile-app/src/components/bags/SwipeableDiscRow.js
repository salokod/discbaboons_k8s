/**
 * SwipeableDiscRow Component
 * Wrapper around DiscRow with swipe gesture support
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Platform, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { Swipeable } from 'react-native-gesture-handler';
import HapticFeedback from 'react-native-haptic-feedback';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import DiscRow from './DiscRow';

const SwipeableDiscRow = React.forwardRef(({
  disc, onSwipeRight, onSwipeLeft, actions, bagId, bagName, onLongPress,
  hideFlightPath, showCompactFlightPath, testID,
}, ref) => {
  const navigation = useNavigation();
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
      flexDirection: 'row',
      backgroundColor: 'transparent',
    },
    leftActions: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
    },
    actionButton: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      minWidth: 100,
      minHeight: 44, // Ensure minimum touch target size
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
    },
    editButton: {
      backgroundColor: colors.primary,
    },
    moveButton: {
      backgroundColor: colors.info,
    },
    markLostButton: {
      backgroundColor: '#FF9500', // Orange theme color for lost disc state
    },
    removeButton: {
      backgroundColor: colors.error,
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

  const renderRightActions = onSwipeRight ? () => {
    const swipeActions = onSwipeRight(disc);

    if (!swipeActions || !Array.isArray(swipeActions)) {
      return null;
    }

    const editAction = swipeActions.find((action) => action.id === 'edit');
    const markLostAction = swipeActions.find((action) => action.id === 'mark-lost');
    const deleteAction = swipeActions.find((action) => action.id === 'delete');

    return (
      <View testID="right-actions" style={styles.rightActions}>
        {editAction && (
          <TouchableOpacity
            testID="edit-button"
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              navigation.navigate('EditDiscScreen', {
                disc,
                bagId,
                bagName,
              });
            }}
            activeOpacity={0.8}
          >
            <Icon
              name="create-outline"
              size={24}
              color={colors.surface}
            />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
        {markLostAction && (
          <TouchableOpacity
            testID="mark-lost-button"
            style={[styles.actionButton, styles.markLostButton]}
            onPress={markLostAction.onPress}
            activeOpacity={0.8}
          >
            <Icon
              name="alert-circle-outline"
              size={24}
              color={colors.surface}
            />
            <Text style={styles.actionText}>Mark Lost</Text>
          </TouchableOpacity>
        )}
        {/* Move action is excluded from right swipe - now only available on left swipe */}
        {deleteAction && (
          <TouchableOpacity
            testID="remove-button"
            style={[styles.actionButton, styles.removeButton]}
            onPress={deleteAction.onPress}
            activeOpacity={0.8}
          >
            <Icon
              name="trash-outline"
              size={24}
              color={colors.surface}
            />
            <Text style={styles.actionText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  } : undefined;

  const renderLeftActions = onSwipeLeft ? () => {
    const swipeActions = onSwipeLeft(disc);

    if (!swipeActions || !Array.isArray(swipeActions)) {
      return null;
    }

    const moveAction = swipeActions.find((action) => action.id === 'move');

    return (
      <View testID="left-actions" style={styles.leftActions}>
        {moveAction && (
          <TouchableOpacity
            testID="move-button"
            style={[styles.actionButton, styles.moveButton]}
            onPress={moveAction.onPress}
            activeOpacity={0.8}
          >
            <Icon
              name="swap-horizontal-outline"
              size={24}
              color={colors.surface}
            />
            <Text style={styles.actionText}>Move</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  } : undefined;

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
    } else if (direction === 'left' && onSwipeLeft) {
      // Trigger haptic feedback
      HapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

      // Visual feedback
      setIsSwipeActive(false);
      onSwipeLeft(disc);
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
    <View testID={testID || 'swipeable-disc-row'} style={styles.container}>
      {/* Debug indicator */}
      {isSwipeActive && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>SWIPING</Text>
        </View>
      )}

      <Swipeable
        ref={ref}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        rightThreshold={40}
        leftThreshold={40}
        onSwipeableOpen={handleSwipeableOpen}
        onSwipeableBeginDrag={handleSwipeableBeginDrag}
        onSwipeableClose={handleSwipeableClose}
        friction={2}
        overshootFriction={8}
      >
        <DiscRow
          disc={disc}
          onLongPress={onLongPress}
          hideFlightPath={hideFlightPath}
          showCompactFlightPath={showCompactFlightPath}
        />
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
  onSwipeLeft: PropTypes.func,
  actions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onPress: PropTypes.func,
  })),
  bagId: PropTypes.string.isRequired,
  bagName: PropTypes.string.isRequired,
  onLongPress: PropTypes.func,
  hideFlightPath: PropTypes.bool,
  showCompactFlightPath: PropTypes.bool,
  testID: PropTypes.string,
};

SwipeableDiscRow.defaultProps = {
  onSwipeRight: undefined,
  onSwipeLeft: undefined,
  actions: undefined,
  onLongPress: undefined,
  hideFlightPath: false,
  showCompactFlightPath: false,
  testID: undefined,
};

SwipeableDiscRow.displayName = 'SwipeableDiscRow';

export default React.memo(SwipeableDiscRow);
