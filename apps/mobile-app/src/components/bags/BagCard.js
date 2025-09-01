/**
 * BagCard Component
 */

import { memo } from 'react';
import {
  TouchableOpacity, Text, View, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Card from '../../design-system/components/Card';

const PRIVACY_ICONS = {
  private: 'lock-closed-outline',
  friends: 'people-outline',
  public: 'globe-outline',
};

function BagCard({
  bag, onPress, showMenu = true, onMenuPress,
}) {
  const colors = useThemeColors();

  // Convert API response format to display format
  const getPrivacyType = (bagData) => {
    if (bagData.is_public) return 'public';
    if (bagData.is_friends_visible) return 'friends';
    return 'private';
  };

  const styles = StyleSheet.create({
    cardTouchable: {
      marginBottom: spacing.md,
    },
    cardContent: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
      paddingRight: 40, // Add padding for menu button space
    },
    bagName: {
      ...typography.h3,
      color: colors.text,
      flex: 1,
      marginRight: spacing.xs, // Reduce margin since we have padding
    },
    privacyIcon: {
      marginRight: spacing.xs, // Add margin to separate from edge
    },
    description: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.sm,
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    discCount: {
      ...typography.caption,
      color: colors.textLight,
      fontWeight: '600',
    },
    menuButton: {
      position: 'absolute',
      top: spacing.sm, // Slightly lower than current
      right: spacing.sm, // Keep consistent spacing
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      zIndex: 1, // Ensure it's above other elements
    },
  });

  const handlePress = () => {
    onPress?.(bag);
  };

  const handleMenuPress = (event) => {
    event?.stopPropagation?.();
    onMenuPress?.(bag);
  };

  const getDiscCountText = (count) => (count === 1 ? '1 disc' : `${count} discs`);

  return (
    <TouchableOpacity
      testID="bag-card"
      style={styles.cardTouchable}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Card>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.bagName} numberOfLines={1}>
              {bag.name}
            </Text>
            <Icon
              name={PRIVACY_ICONS[getPrivacyType(bag)] || PRIVACY_ICONS.private}
              size={16}
              color={colors.textLight}
              style={styles.privacyIcon}
            />
          </View>

          {showMenu && (
            <TouchableOpacity
              testID="bag-menu-button"
              style={styles.menuButton}
              onPress={handleMenuPress}
              accessibilityLabel="Bag options menu"
              accessibilityRole="button"
              accessibilityHint="Opens menu with bag options"
              activeOpacity={0.7}
            >
              <Icon
                name="ellipsis-horizontal"
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          )}

          {bag.description && (
            <Text style={styles.description} numberOfLines={2}>
              {bag.description}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.discCount}>
              {getDiscCountText(bag.disc_count || 0)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

BagCard.propTypes = {
  bag: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_public: PropTypes.bool,
    is_friends_visible: PropTypes.bool,
    disc_count: PropTypes.number,
  }).isRequired,
  onPress: PropTypes.func,
  showMenu: PropTypes.bool,
  onMenuPress: PropTypes.func,
};

BagCard.defaultProps = {
  onPress: () => {},
  showMenu: true,
  onMenuPress: () => {},
};

// Add display name for React DevTools
BagCard.displayName = 'BagCard';

export default memo(BagCard);
