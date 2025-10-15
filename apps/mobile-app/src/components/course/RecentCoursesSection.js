import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { useRecentCoursesLayout } from '../../hooks/useRecentCoursesLayout';
import RecentCourseCard from './RecentCourseCard';
import SkeletonCourseCard from './SkeletonCourseCard';

function RecentCoursesSection({
  courses,
  onSelectCourse,
  loading,
  error,
  onRetry,
}) {
  const colors = useThemeColors();
  const layout = useRecentCoursesLayout();

  // Hide section if no courses (empty state)
  if (!loading && !error && courses.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      ...typography.h4,
      color: colors.text,
    },
    scrollContainer: {
      paddingHorizontal: layout.horizontalPadding,
      paddingVertical: spacing.sm,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    errorText: {
      ...typography.caption,
      color: colors.textLight,
    },
    retryButton: {
      paddingHorizontal: spacing.sm,
    },
    retryText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
    },
  });

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Recent Courses
          </Text>
        </View>
        <View testID="recent-courses-error" style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={16} color={colors.textLight} />
          <Text style={styles.errorText}>Unable to load recent courses</Text>
          <TouchableOpacity
            testID="recent-courses-retry"
            onPress={onRetry}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Recent Courses
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          testID="recent-courses-loading"
        >
          <SkeletonCourseCard />
          <SkeletonCourseCard />
          <SkeletonCourseCard />
        </ScrollView>
      </View>
    );
  }

  // Success state with courses
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Recent Courses
        </Text>
      </View>
      <ScrollView
        testID="recent-courses-scroll"
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={layout.cardWidth + layout.gap}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContainer}
      >
        {courses.map((course) => (
          <RecentCourseCard
            key={course.id}
            course={course}
            onPress={onSelectCourse}
          />
        ))}
      </ScrollView>
    </View>
  );
}

RecentCoursesSection.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      last_played_at: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onSelectCourse: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

RecentCoursesSection.defaultProps = {
  error: null,
};

export default RecentCoursesSection;
