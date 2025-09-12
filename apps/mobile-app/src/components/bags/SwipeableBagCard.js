/**
 * SwipeableBagCard Component
 * Wrapper around BagCard with swipe gesture support
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import BagCard from './BagCard';

const SwipeableBagCard = forwardRef(({
  bag, onEdit, onDelete, onPress,
}, ref) => {
  const colors = useThemeColors();
  const swipeableRef = useRef();

  useImperativeHandle(ref, () => ({
    close: () => {
      swipeableRef.current?.close();
    },
  }));

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    rightActions: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    actionButton: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      minWidth: 80,
      height: '100%',
      paddingVertical: spacing.sm,
    },
    editButton: {
      backgroundColor: colors.primary,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    actionText: {
      ...typography.caption,
      color: colors.surface,
      fontWeight: '700',
      fontSize: 12,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
  });

  const renderRightActions = () => (
    <View testID="right-actions" style={styles.rightActions}>
      <TouchableOpacity
        testID="edit-button"
        style={[styles.actionButton, styles.editButton]}
        onPress={() => {
          swipeableRef.current?.close();
          onEdit(bag);
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
      <TouchableOpacity
        testID="delete-button"
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(bag);
        }}
        activeOpacity={0.8}
      >
        <Icon
          name="trash-outline"
          size={24}
          color={colors.surface}
        />
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View testID="swipeable-bag-card" style={styles.container}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        friction={2}
        overshootFriction={8}
      >
        <BagCard
          bag={bag}
          onPress={onPress}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Swipeable>
    </View>
  );
});

SwipeableBagCard.propTypes = {
  bag: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_public: PropTypes.bool,
    is_friends_visible: PropTypes.bool,
    disc_count: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onPress: PropTypes.func,
};

SwipeableBagCard.defaultProps = {
  onEdit: () => {},
  onDelete: () => {},
  onPress: () => {},
};

SwipeableBagCard.displayName = 'SwipeableBagCard';

export default React.memo(SwipeableBagCard);
