/**
 * CourseSelectionModal Component
 * Modal for selecting a course when creating a new round
 * Follows design system patterns with professional polish
 */

import {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import CourseCard from './CourseCard';
import SearchBar from '../design-system/components/SearchBar';
import { searchCourses } from '../services/courseService';

function CourseSelectionModal({
  visible,
  onClose,
  onSelectCourse,
}) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [totalCourses, setTotalCourses] = useState(0);

  // Debounce search to avoid too many API calls
  const searchTimeoutRef = useRef(null);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: Platform.select({ ios: 16, android: 20 }),
      margin: spacing.md,
      maxHeight: '90%',
      width: '95%',
      maxWidth: 450,
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      flex: 1,
    },
    closeButton: {
      padding: spacing.xs,
      borderRadius: 20,
    },
    searchContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchFeedback: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    searchFeedbackText: {
      ...typography.caption,
      color: colors.textLight,
    },
    resultCount: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
      minHeight: 200,
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      minHeight: 200,
    },
    errorTitle: {
      ...typography.h4,
      color: colors.error,
      fontWeight: '600',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    errorText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
    },
    retryButtonText: {
      ...typography.button,
      color: colors.white,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      minHeight: 200,
    },
    emptyTitle: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    emptyText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  // Load courses from API
  const loadCourses = useCallback(async (query = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = { limit: 50 };
      if (query && query.trim()) {
        params.q = query.trim();
      }

      const result = await searchCourses(params);
      setCourses(result.courses || []);
      setTotalCourses(result.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load courses');
      setCourses([]);
      setTotalCourses(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load courses when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadCourses();
    }
  }, [visible, loadCourses]);

  // Handle search with debouncing
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    setIsSearching(true);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search API call
    searchTimeoutRef.current = setTimeout(() => {
      loadCourses(text);
      setIsSearching(false);
    }, 500);
  }, [loadCourses]);

  // Clean up timeout on unmount
  useEffect(() => () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const handleCourseSelect = useCallback((course) => {
    onSelectCourse(course);
    onClose();
  }, [onSelectCourse, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Course</Text>
            <TouchableOpacity testID="modal-close-button" style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <SearchBar
              placeholder="Search courses..."
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {isSearching && (
              <View testID="search-feedback-indicator" style={styles.searchFeedback}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.searchFeedbackText}>Searching...</Text>
              </View>
            )}
            {!loading && !error && courses.length > 0 && (
              <Text style={styles.resultCount}>
                Showing
                {' '}
                {courses.length}
                {' '}
                of
                {' '}
                {totalCourses}
                {' '}
                {courses.length === 1 ? 'course' : 'courses'}
              </Text>
            )}
          </View>

          {/* Course List */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            bounces={false}
          >
            {(() => {
              if (loading) {
                return (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading courses...</Text>
                  </View>
                );
              }

              if (error) {
                return (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={48} color={colors.error} />
                    <Text style={styles.errorTitle}>Error loading courses</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => loadCourses(searchQuery)}
                    >
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              if (courses.length === 0) {
                const emptyMessage = searchQuery
                  ? `No courses match "${searchQuery}". Try a different search term.`
                  : 'No courses are available at the moment.';

                return (
                  <View style={styles.emptyContainer}>
                    <Icon name="golf-outline" size={48} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No courses found</Text>
                    <Text style={styles.emptyText}>{emptyMessage}</Text>
                  </View>
                );
              }

              return courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={handleCourseSelect}
                />
              ));
            })()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

CourseSelectionModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectCourse: PropTypes.func.isRequired,
};

export default CourseSelectionModal;
