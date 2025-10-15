import {
  View, Text, Pressable, StyleSheet, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { formatLastPlayed, getCourseInitial } from '../../utils/courseHelpers';
import { useRecentCoursesLayout } from '../../hooks/useRecentCoursesLayout';

function RecentCourseCard({ course, onPress }) {
  const colors = useThemeColors();
  const layout = useRecentCoursesLayout();

  const handlePress = () => {
    onPress(course);
  };

  const initial = getCourseInitial(course.name);
  const lastPlayed = formatLastPlayed(course.last_played_at);

  const styles = StyleSheet.create({
    card: {
      width: layout.cardWidth,
      height: layout.cardHeight,
      padding: spacing.sm,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({ ios: 12, android: 16 }),
      marginRight: layout.gap,
      ...Platform.select({
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    badge: {
      width: layout.badgeSize,
      height: layout.badgeSize,
      borderRadius: layout.badgeSize / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    badgeText: {
      fontSize: layout.badgeSize * 0.5,
      fontWeight: '700',
      color: colors.white,
      textTransform: 'uppercase',
    },
    name: {
      fontSize: layout.nameFontSize,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
      lineHeight: layout.nameFontSize * 1.2,
      textAlign: 'center',
    },
    city: {
      fontSize: layout.cityFontSize,
      fontWeight: '400',
      color: colors.textLight,
      marginBottom: 2,
      lineHeight: layout.cityFontSize * 1.2,
      textAlign: 'center',
    },
    time: {
      fontSize: layout.timeFontSize,
      fontWeight: '600',
      color: colors.primary,
      lineHeight: layout.timeFontSize * 1.2,
    },
  });

  return (
    <Pressable
      testID="recent-course-card"
      style={({ pressed }) => [
        styles.card,
        pressed && {
          transform: [{ scale: 0.96 }],
          opacity: 0.8,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${course.name}, ${course.location}, last played ${lastPlayed}`}
      accessibilityHint="Double tap to select this course"
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{initial}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {course.name}
      </Text>
      <Text style={styles.city} numberOfLines={1} ellipsizeMode="tail">
        {course.location}
      </Text>
      <Text style={styles.time}>{lastPlayed}</Text>
    </Pressable>
  );
}

RecentCourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    last_played_at: PropTypes.string.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

export default RecentCourseCard;
