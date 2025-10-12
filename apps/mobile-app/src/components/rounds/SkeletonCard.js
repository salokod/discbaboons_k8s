/**
 * SkeletonCard Component
 * Loading skeleton for round cards
 */

import { View, StyleSheet } from 'react-native';
import { spacing } from '../../design-system/spacing';
import Card from '../../design-system/components/Card';
import SkeletonLoader from '../settings/SkeletonLoader';

function SkeletonCard() {
  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.sm + 4, // Match RoundCard spacing (8px + 4px = 12px)
    },
    cardContent: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    titleSection: {
      flex: 1,
      marginRight: spacing.sm,
    },
    statusSection: {
      alignItems: 'flex-end',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
  });

  return (
    <View style={styles.container} testID="skeleton-card">
      <Card>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              {/* Round name skeleton */}
              <SkeletonLoader width="70%" height={24} borderRadius={4} testID="skeleton-loader" />
              <View style={{ height: spacing.xs }} />

              {/* Course name skeleton */}
              <SkeletonLoader width="85%" height={18} borderRadius={4} testID="skeleton-loader" />
              <View style={{ height: spacing.xs }} />

              {/* Start time skeleton */}
              <SkeletonLoader width="50%" height={14} borderRadius={4} testID="skeleton-loader" />
            </View>
            <View style={styles.statusSection}>
              {/* Status badge skeleton */}
              <SkeletonLoader width={80} height={24} borderRadius={16} testID="skeleton-loader" />
            </View>
          </View>

          <View style={styles.footer}>
            {/* Player count skeleton */}
            <SkeletonLoader width="35%" height={14} borderRadius={4} testID="skeleton-loader" />
            {/* Skins info skeleton */}
            <SkeletonLoader width="30%" height={14} borderRadius={4} testID="skeleton-loader" />
          </View>
        </View>
      </Card>
    </View>
  );
}

export default SkeletonCard;
