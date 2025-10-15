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
import NavigationHeader from '../../components/NavigationHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import CourseSelectionModal from '../../components/CourseSelectionModal';
import PlayerSelectionModal from '../../components/modals/PlayerSelectionModal';
import { createRound, addPlayersToRound } from '../../services/roundService';

function CreateRoundScreen({ navigation }) {
  const colors = useThemeColors();
  const [roundName, setRoundName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [guests, setGuests] = useState([]);

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

      // Add participants if any selected
      if (selectedFriends.length > 0 || guests.some((g) => g.name && g.name.trim())) {
        try {
          const players = [
            ...selectedFriends.map((friend) => ({ userId: friend.id })),
            ...guests
              .filter((guest) => guest.name && guest.name.trim())
              .map((guest) => ({ guestName: guest.name.trim() })),
          ];

          await addPlayersToRound(newRound.id, players);
        } catch (participantError) {
          // Don't block navigation if participant addition fails
          Alert.alert(
            'Round Created',
            'Round was created successfully, but some participants could not be added. You can add them later from the round details.',
            [{ text: 'OK' }],
          );
        }
      }

      // Clear form first
      setRoundName('');
      setSelectedCourse(null);
      setSelectedFriends([]);
      setGuests([]);

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
  }, [roundName, selectedCourse, isLoading, navigation, selectedFriends, guests]);

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

  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [navigation]);

  const handlePlayerConfirm = useCallback((selectedPlayers) => {
    // selectedPlayers format: [{ userId: 'x' }, { guestName: 'John' }]

    // Extract friends (items with userId)
    const friendIds = selectedPlayers
      .filter((p) => p.userId)
      .map((p) => p.userId);

    // Extract guests (items with guestName)
    const newGuests = selectedPlayers
      .filter((p) => p.guestName)
      .map((p) => ({
        id: `guest-${Date.now()}-${Math.random()}`,
        name: p.guestName,
      }));

    // Merge with existing state (avoid duplicates)
    // For now, we'll just replace with new selections
    // In a real scenario, you might want to merge intelligently
    setSelectedFriends((prev) => {
      // Find friend objects by ID (assuming friends loaded from somewhere)
      // For now, just create minimal friend objects
      const newFriends = friendIds.map((id) => ({
        id,
        username: `user-${id}`, // Placeholder - would normally fetch from API
        full_name: `User ${id}`, // Placeholder
      }));

      // Merge without duplicates
      const existingIds = new Set(prev.map((f) => f.id));
      const toAdd = newFriends.filter((f) => !existingIds.has(f.id));

      return [...prev, ...toAdd];
    });

    setGuests((prev) => {
      // Merge guests
      const existingNames = new Set(prev.map((g) => g.name));
      const toAdd = newGuests.filter((g) => !existingNames.has(g.name));

      return [...prev, ...toAdd];
    });

    // Close modal
    setShowPlayerModal(false);
  }, []);

  return (
    <StatusBarSafeView testID="create-round-screen" style={styles.container}>
      <AppContainer>
        <NavigationHeader
          title="Create New Round"
          onBack={handleBack}
          backAccessibilityLabel="Cancel round creation"
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={styles.dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

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
                  accessibilityLabel="Select course for round"
                  accessibilityHint="Choose which disc golf course to play"
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

              {/* Participants Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon
                    name="people-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Players</Text>
                </View>
                <TouchableOpacity
                  testID="add-players-button"
                  style={styles.courseButton}
                  onPress={() => setShowPlayerModal(true)}
                  accessibilityLabel="Add players to round"
                  accessibilityHint="Choose friends or add guests to play with"
                >
                  <View style={styles.courseButtonContent}>
                    <Text style={styles.courseButtonText}>
                      {(() => {
                        const totalParticipants = selectedFriends.length + guests.length;
                        if (totalParticipants === 0) {
                          return 'Add Players';
                        }
                        return `${totalParticipants} Player${totalParticipants === 1 ? '' : 's'} Added`;
                      })()}
                    </Text>
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
                  accessibilityLabel="Round name"
                  accessibilityHint="Enter a name for your disc golf round"
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
        </TouchableWithoutFeedback>
      </AppContainer>

      {/* Course Selection Modal */}
      <CourseSelectionModal
        visible={showCourseModal}
        onClose={handleCloseCourseModal}
        onSelectCourse={handleCourseSelect}
      />

      {/* Player Selection Modal */}
      <PlayerSelectionModal
        visible={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onConfirm={handlePlayerConfirm}
        existingPlayers={[
          ...selectedFriends.map((friend) => ({ userId: friend.id })),
          ...guests.map((guest) => ({ guestName: guest.name })),
        ]}
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
