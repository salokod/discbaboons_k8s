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

function BagCard({ bag, onPress }) {
  const colors = useThemeColors();

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
    },
    bagName: {
      ...typography.h3,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    privacyIcon: {
      marginLeft: spacing.sm,
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
  });

  const handlePress = () => {
    onPress?.(bag);
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
              name={PRIVACY_ICONS[bag.privacy] || PRIVACY_ICONS.private}
              size={16}
              color={colors.textLight}
              style={styles.privacyIcon}
            />
          </View>

          {bag.description && (
            <Text style={styles.description} numberOfLines={2}>
              {bag.description}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.discCount}>
              {getDiscCountText(bag.discCount || 0)}
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
    privacy: PropTypes.oneOf(['private', 'friends', 'public']),
    discCount: PropTypes.number,
  }).isRequired,
  onPress: PropTypes.func,
};

BagCard.defaultProps = {
  onPress: () => {},
};

// Add display name for React DevTools
BagCard.displayName = 'BagCard';

export default memo(BagCard);
