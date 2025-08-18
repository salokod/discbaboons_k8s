/**
 * SelectableDiscRow Component
 * Wrapper around SwipeableDiscRow with multi-select functionality
 * Following TDD methodology for thin slice implementation
 */

import { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import SwipeableDiscRow from './SwipeableDiscRow';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';

function SelectableDiscRow({
  disc, bagId, bagName, isMultiSelectMode, isSelected, onToggleSelection,
  onSwipeRight, onSwipeLeft, actions,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    discRowContainer: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      {isMultiSelectMode && (
        <TouchableOpacity
          testID="selection-checkbox"
          style={styles.checkbox}
          onPress={() => onToggleSelection(disc.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`Select ${disc.model || disc.disc_master?.model || 'disc'}`}
          accessibilityHint={isSelected ? 'Double tap to deselect' : 'Double tap to select'}
        >
          <Icon
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? colors.primary : colors.border}
          />
        </TouchableOpacity>
      )}
      <View style={styles.discRowContainer}>
        <SwipeableDiscRow
          disc={disc}
          bagId={bagId}
          bagName={bagName}
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
          actions={actions}
          hideFlightPath={isMultiSelectMode}
        />
      </View>
    </View>
  );
}

SelectableDiscRow.propTypes = {
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
    custom_name: PropTypes.string,
    notes: PropTypes.string,
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
  bagId: PropTypes.string.isRequired,
  bagName: PropTypes.string.isRequired,
  isMultiSelectMode: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelection: PropTypes.func.isRequired,
  onSwipeRight: PropTypes.func,
  onSwipeLeft: PropTypes.func,
  actions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onPress: PropTypes.func,
  })),
};

SelectableDiscRow.defaultProps = {
  onSwipeRight: undefined,
  onSwipeLeft: undefined,
  actions: undefined,
};

SelectableDiscRow.displayName = 'SelectableDiscRow';

export default memo(SelectableDiscRow);
