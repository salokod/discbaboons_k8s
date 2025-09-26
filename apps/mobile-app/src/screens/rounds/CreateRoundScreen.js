/**
 * CreateRoundScreen Component
 */

import { memo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import Input from '../../components/Input';
import Button from '../../components/Button';
import CourseSelectionModal from '../../components/CourseSelectionModal';
import { createRound } from '../../services/roundService';

function CreateRoundScreen({ navigation }) {
  const colors = useThemeColors();
  const [roundName, setRoundName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    dismissKeyboard: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    header: {
      marginBottom: spacing.xl * 1.5,
      alignItems: 'center',
    },
    headerTitle: {
      ...typography.h1,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 22,
    },
    formContainer: {
      flex: 1,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
    },
    buttonContainer: {
      marginTop: 'auto',
      paddingTop: spacing.xl,
    },
    courseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      minHeight: 56,
    },
    courseButtonContent: {
      flex: 1,
    },
    courseButtonText: {
      ...typography.body,
      color: selectedCourse ? colors.text : colors.textLight,
      fontWeight: selectedCourse ? '500' : 'normal',
    },
    courseButtonSubtext: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
    },
    courseButtonIcon: {
      marginLeft: spacing.sm,
    },
  });

  const handleCreateRound = useCallback(async () => {
    if (isLoading || !roundName.trim() || !selectedCourse) {
      return;
    }

    setIsLoading(true);

    try {
      const roundData = {
        courseId: selectedCourse.id,
        name: roundName.trim(),
      };

      const newRound = await createRound(roundData);

      // Clear form first
      setRoundName('');
      setSelectedCourse(null);

      // Navigate to round detail screen with the new round data
      if (navigation?.navigate) {
        navigation.navigate('RoundDetail', {
          roundId: newRound.id,
          round: {
            ...newRound,
            course: selectedCourse, // Include course data for immediate display
          },
        });
      } else {
        // Fallback for when navigation is not available
        Alert.alert('Success', 'Round created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create round. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [roundName, selectedCourse, isLoading, navigation]);

  // Validation helper - disable create button if required fields are missing or loading
  const isCreateDisabled = !roundName.trim() || !selectedCourse || isLoading;

  const handleCourseSelect = useCallback((course) => {
    setSelectedCourse(course);
  }, []);

  const handleOpenCourseModal = useCallback(() => {
    setShowCourseModal(true);
  }, []);

  const handleCloseCourseModal = useCallback(() => {
    setShowCourseModal(false);
  }, []);

  return (
    <StatusBarSafeView testID="create-round-screen" style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={styles.dismissKeyboard}>
        <AppContainer>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create New Round</Text>
              <Text style={styles.headerSubtitle}>
                Start tracking your disc golf round with course selection and round details
              </Text>
            </View>

            {/* Form Container */}
            <View testID="round-form" style={styles.formContainer}>
              {/* Course Selection Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon
                    name="location-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Course</Text>
                </View>
                <TouchableOpacity
                  testID="select-course-button"
                  style={styles.courseButton}
                  onPress={handleOpenCourseModal}
                >
                  <View style={styles.courseButtonContent}>
                    <Text style={styles.courseButtonText}>
                      {selectedCourse ? selectedCourse.name : 'Select Course'}
                    </Text>
                    {selectedCourse && (
                      <Text style={styles.courseButtonSubtext}>
                        {selectedCourse.location}
                        {' '}
                        •
                        {selectedCourse.holes}
                        {' '}
                        holes
                      </Text>
                    )}
                  </View>
                  <Icon
                    name="chevron-forward"
                    size={20}
                    color={colors.textLight}
                    style={styles.courseButtonIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Round Name Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon
                    name="golf-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Round Name</Text>
                </View>
                <Input
                  testID="round-name-input"
                  placeholder="Enter a name for your round"
                  value={roundName}
                  onChangeText={setRoundName}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>

              {/* Create Button */}
              <View style={styles.buttonContainer}>
                <Button
                  testID="create-round-button"
                  title={isLoading ? 'Creating...' : 'Create Round'}
                  onPress={handleCreateRound}
                  disabled={isCreateDisabled}
                />
              </View>
            </View>
          </ScrollView>
        </AppContainer>
      </TouchableWithoutFeedback>

      {/* Course Selection Modal */}
      <CourseSelectionModal
        visible={showCourseModal}
        onClose={handleCloseCourseModal}
        onSelectCourse={handleCourseSelect}
      />
    </StatusBarSafeView>
  );
}

CreateRoundScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }),
};

CreateRoundScreen.defaultProps = {
  navigation: null,
};

// Add display name for React DevTools
CreateRoundScreen.displayName = 'CreateRoundScreen';

export default memo(CreateRoundScreen);
