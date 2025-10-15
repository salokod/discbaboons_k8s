import { useEffect, useRef } from 'react';
import {
  View, StyleSheet, Platform, Animated,
} from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { useRecentCoursesLayout } from '../../hooks/useRecentCoursesLayout';

function SkeletonCourseCard() {
  const colors = useThemeColors();
  const layout = useRecentCoursesLayout();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const styles = StyleSheet.create({
    card: {
      width: layout.cardWidth,
      height: layout.cardHeight,
      padding: spacing.sm,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({ ios: 12, android: 16 }),
      marginRight: layout.gap,
    },
    badge: {
      width: layout.badgeSize,
      height: layout.badgeSize,
      borderRadius: layout.badgeSize / 2,
      backgroundColor: colors.border,
      marginBottom: spacing.xs,
    },
    text: {
      width: '80%',
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: 4,
    },
    textSmall: {
      width: '60%',
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: 4,
    },
    textTiny: {
      width: '40%',
      height: 9,
      backgroundColor: colors.border,
      borderRadius: 4,
    },
  });

  return (
    <View testID="skeleton-course-card" style={styles.card}>
      <Animated.View style={[styles.badge, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.text, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.textSmall, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.textTiny, { opacity: pulseAnim }]} />
    </View>
  );
}

export default SkeletonCourseCard;
