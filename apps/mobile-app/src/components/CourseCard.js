/**
 * CourseCard Component
 */

import { memo } from 'react';
import {
  Text, TouchableOpacity, View, StyleSheet, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import Card from '../design-system/components/Card';

function CourseCard({ course, onPress }) {
  const colors = useThemeColors();

  if (!course) return null;

  const styles = StyleSheet.create({
    cardTouchable: {
      minHeight: Platform.OS === 'ios' ? 44 : 48,
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
    courseName: {
      ...typography.h3,
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationText: {
      ...typography.body,
      color: colors.textLight,
    },
    holesText: {
      ...typography.caption,
      color: colors.textLight,
      fontWeight: '600',
    },
    userSubmissionIcon: {
      marginLeft: spacing.sm,
    },
  });

  const handlePress = () => {
    onPress?.(course);
  };

  const getLocationText = () => {
    if (course.city && course.state) {
      return `${course.city}, ${course.state}`;
    }
    if (course.city) {
      return course.city;
    }
    if (course.state) {
      return course.state;
    }
    return null;
  };

  const getHolesText = (count) => (count === 1 ? '1 hole' : `${count} holes`);

  const getUserSubmissionIcon = () => {
    if (course.is_user_submitted) {
      return 'person-circle-outline';
    }
    return 'shield-checkmark-outline';
  };

  const getUserSubmissionLabel = () => {
    if (course.is_user_submitted) {
      return 'User-submitted course';
    }
    return 'Official course';
  };

  return (
    <TouchableOpacity
      testID={`course-card-${course.id}`}
      style={styles.cardTouchable}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={`${course.name} course card`}
      accessibilityRole="button"
      accessibilityHint="Tap to select this course"
    >
      <Card>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.courseName} numberOfLines={1}>
              {course.name}
            </Text>
            <Icon
              name={getUserSubmissionIcon()}
              size={16}
              color={colors.textLight}
              style={styles.userSubmissionIcon}
              accessibilityLabel={getUserSubmissionLabel()}
              accessibilityRole="image"
            />
          </View>

          <View style={styles.footer}>
            {getLocationText() && (
              <Text style={styles.locationText}>
                {getLocationText()}
              </Text>
            )}
            {course.holes && (
              <Text style={styles.holesText}>
                {getHolesText(course.holes)}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    city: PropTypes.string,
    state: PropTypes.string,
    holes: PropTypes.number,
    is_user_submitted: PropTypes.bool,
  }).isRequired,
  onPress: PropTypes.func,
};

CourseCard.defaultProps = {
  onPress: () => {},
};

// Add display name for React DevTools
CourseCard.displayName = 'CourseCard';

export default memo(CourseCard);
