/**
 * SwipeActionMenu Component
 * Animated menu that appears when swiping disc rows
 */

import { View, Text, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

function SwipeActionMenu({ actions, progress }) {
  // Check that actions array has items before rendering menu
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <View style={{ flexDirection: 'row', height: '100%', opacity: progress || 1 }}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            minWidth: 80,
            backgroundColor: action.color,
          }}
          onPress={action.onPress}
          accessibilityLabel={`${action.label} action`}
          accessibilityRole="button"
          accessibilityHint={`Performs ${action.label.toLowerCase()} action on this disc`}
        >
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

SwipeActionMenu.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onPress: PropTypes.func,
  })),
  progress: PropTypes.number,
};

SwipeActionMenu.defaultProps = {
  actions: [],
  progress: 0,
};

SwipeActionMenu.displayName = 'SwipeActionMenu';

export default SwipeActionMenu;
