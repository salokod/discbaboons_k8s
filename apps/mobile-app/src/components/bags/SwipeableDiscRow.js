/**
 * SwipeableDiscRow Component
 * Wrapper around DiscRow with swipe gesture support
 */

import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { Swipeable } from 'react-native-gesture-handler';
import DiscRow from './DiscRow';

const SwipeableDiscRow = React.forwardRef(({ disc, onSwipeRight, actions }, ref) => {
  // Start with a simple wrapper that just renders DiscRow
  // Gesture handling will be added in future iterations
  // eslint-disable-next-line no-unused-vars
  const placeholderActions = actions;

  const renderRightActions = onSwipeRight ? () => (
    <View testID="right-actions" />
  ) : undefined;

  const handleSwipeableOpen = (direction) => {
    if (direction === 'right' && onSwipeRight) {
      onSwipeRight(disc);
    }
  };

  return (
    <View testID="swipeable-disc-row">
      <Swipeable
        ref={ref}
        renderRightActions={renderRightActions}
        rightThreshold={80}
        onSwipeableOpen={handleSwipeableOpen}
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
