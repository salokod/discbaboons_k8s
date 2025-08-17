/**
 * SwipeActionMenu Component
 * Animated menu that appears when swiping disc rows
 */

import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  icon: {
    marginBottom: 4,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

function SwipeActionMenu({ actions, progress, deviceWidth }) {
  // Check that actions array has items before rendering menu
  if (!actions || actions.length === 0) {
    return null;
  }

  // Calculate responsive button width based on device width
  const getButtonWidth = () => {
    if (!deviceWidth) return 80; // Default width
    const availableWidth = deviceWidth * 0.4; // Use 40% of screen width
    return Math.max(availableWidth / actions.length, 70); // Minimum 70px per button
  };

  return (
    <View style={[styles.container, { opacity: progress || 1 }]}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[
            styles.actionButton,
            { width: getButtonWidth(), backgroundColor: action.color },
          ]}
          onPress={action.onPress}
          accessibilityLabel={`${action.label} action`}
          accessibilityRole="button"
          accessibilityHint={`Performs ${action.label.toLowerCase()} action on this disc`}
        >
          {action.icon && (
            <Icon
              name={action.icon}
              size={20}
              color="white"
              style={styles.icon}
            />
          )}
          <Text style={styles.actionText}>{action.label}</Text>
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
    icon: PropTypes.string,
  })),
  progress: PropTypes.number,
  deviceWidth: PropTypes.number,
};

SwipeActionMenu.defaultProps = {
  actions: [],
  progress: 0,
  deviceWidth: null,
};

SwipeActionMenu.displayName = 'SwipeActionMenu';

export default SwipeActionMenu;
