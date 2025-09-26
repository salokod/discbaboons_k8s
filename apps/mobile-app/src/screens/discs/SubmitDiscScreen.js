/**
 * SubmitDiscScreen
 * Community disc submission form - redesigned to match CreateBagScreen
 */

import { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';

import Input from '../../components/Input';
import Button from '../../components/Button';
import AppContainer from '../../components/AppContainer';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { submitDisc } from '../../services/discService';

// Flight number options
const SPEED_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 1);
const GLIDE_OPTIONS = Array.from({ length: 7 }, (_, i) => i + 1);
const TURN_OPTIONS = Array.from({ length: 8 }, (_, i) => i - 5);
const FADE_OPTIONS = Array.from({ length: 6 }, (_, i) => i);

// Custom Dropdown Component
function FlightNumberDropdown({
  label, value, onValueChange, options, placeholder, icon,
}) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    label: {
      ...typography.caption,
      color: colors.textLight,
      marginBottom: spacing.xs,
      fontWeight: '600',
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      padding: spacing.md,
      borderWidth: 2,
      borderColor: isOpen ? colors.primary : 'transparent',
    },
    dropdownButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    dropdownIcon: {
      marginRight: spacing.sm,
    },
    dropdownText: {
      ...typography.body,
      color: value !== null ? colors.text : colors.textLight,
      flex: 1,
      flexShrink: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: '80%',
      maxHeight: '60%',
      padding: spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
    },
    optionItemSelected: {
      backgroundColor: `${colors.primary}15`,
    },
    optionText: {
      ...typography.body,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    optionTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.dropdownButton}>
        <View style={styles.dropdownButtonContent}>
          <Icon
            name={icon}
            size={20}
            color={value !== null ? colors.primary : colors.textLight}
            style={styles.dropdownIcon}
          />
          <Text style={styles.dropdownText}>
            {value !== null ? value.toString() : placeholder}
          </Text>
        </View>
        <Icon
          name="chevron-down-outline"
          size={20}
          color={colors.textLight}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Icon name="close-outline" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        value === item && styles.optionItemSelected,
                      ]}
                      onPress={() => {
                        onValueChange(item);
                        setIsOpen(false);
                      }}
                    >
                      {value === item && (
                        <Icon name="checkmark" size={20} color={colors.primary} />
                      )}
                      <Text style={[
                        styles.optionText,
                        value === item && styles.optionTextSelected,
                      ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

FlightNumberDropdown.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  onValueChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.number).isRequired,
  placeholder: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
};

FlightNumberDropdown.defaultProps = {
  value: null,
};

function SubmitDiscScreen({ navigation }) {
  const colors = useThemeColors();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [speed, setSpeed] = useState(null);
  const [glide, setGlide] = useState(null);
  const [turn, setTurn] = useState(null);
  const [fade, setFade] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for auto-focus flow
  const brandInputRef = useRef(null);
  const modelInputRef = useRef(null);

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
      paddingTop: Platform.select({
        ios: spacing.xl,
        android: spacing.lg,
      }),
      paddingBottom: spacing.xl * 2,
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
    section: {
      marginBottom: spacing.xl * 1.5,
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
    sectionDescription: {
      ...typography.caption,
      color: colors.textLight,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    flightNumbersGrid: {
      marginTop: spacing.sm,
    },
    flightRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    guidelinesCard: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      borderWidth: 1,
      borderColor: colors.border,
    },
    guidelinesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    guidelinesIcon: {
      marginRight: spacing.sm,
    },
    guidelinesTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    guidelineItem: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    bulletPoint: {
      ...typography.body,
      color: colors.primary,
      marginRight: spacing.sm,
    },
    guidelineText: {
      ...typography.caption,
      color: colors.textLight,
      flex: 1,
      lineHeight: 18,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    inputLabel: {
      ...typography.caption,
      color: colors.textLight,
      marginBottom: spacing.xs,
      fontWeight: '600',
    },
    buttonContainer: {
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
    },
  });

  const validateForm = () => {
    if (!brand.trim()) return 'Brand is required';
    if (!model.trim()) return 'Model is required';
    if (speed === null) return 'Speed is required';
    if (glide === null) return 'Glide is required';
    if (turn === null) return 'Turn is required';
    if (fade === null) return 'Fade is required';
    return null;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Missing Information', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        brand: brand.trim(),
        model: model.trim(),
        speed,
        glide,
        turn,
        fade,
      };

      await submitDisc(submissionData);

      Alert.alert(
        'Success!',
        'Your disc has been submitted for review. We\'ll notify you once it\'s approved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Submission Error', error.message || 'Unable to submit disc. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = brand.trim() && model.trim()
    && speed !== null && glide !== null
    && turn !== null && fade !== null;

  return (
    <StatusBarSafeView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <AppContainer>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Submit New Disc</Text>
              <Text style={styles.headerSubtitle}>
                Help grow our community database by adding a disc that&apos;s not yet listed
              </Text>
            </View>

            {/* Disc Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="disc-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Disc Information</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand</Text>
                <Input
                  ref={brandInputRef}
                  placeholder="Enter the manufacturer name"
                  value={brand}
                  onChangeText={setBrand}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => modelInputRef.current?.focus()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model</Text>
                <Input
                  ref={modelInputRef}
                  placeholder="Enter the disc model name"
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </View>

            {/* Flight Numbers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="analytics-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Flight Numbers</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Select the official flight ratings from the manufacturer
              </Text>

              <View style={styles.flightNumbersGrid}>
                <View style={styles.flightRow}>
                  <FlightNumberDropdown
                    label="Speed"
                    value={speed}
                    onValueChange={setSpeed}
                    options={SPEED_OPTIONS}
                    placeholder="Speed"
                    icon="speedometer-outline"
                  />
                  <FlightNumberDropdown
                    label="Glide"
                    value={glide}
                    onValueChange={setGlide}
                    options={GLIDE_OPTIONS}
                    placeholder="Glide"
                    icon="airplane-outline"
                  />
                </View>

                <View style={styles.flightRow}>
                  <FlightNumberDropdown
                    label="Turn"
                    value={turn}
                    onValueChange={setTurn}
                    options={TURN_OPTIONS}
                    placeholder="Turn"
                    icon="trending-down-outline"
                  />
                  <FlightNumberDropdown
                    label="Fade"
                    value={fade}
                    onValueChange={setFade}
                    options={FADE_OPTIONS}
                    placeholder="Fade"
                    icon="return-down-back-outline"
                  />
                </View>
              </View>
            </View>

            {/* Guidelines Section */}
            <View style={styles.section}>
              <View style={styles.guidelinesCard}>
                <View style={styles.guidelinesHeader}>
                  <Icon
                    name="information-circle-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.guidelinesIcon}
                  />
                  <Text style={styles.guidelinesTitle}>Submission Guidelines</Text>
                </View>

                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>
                    Verify flight numbers match official manufacturer specifications
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>
                    Check that the disc doesn&apos;t already exist in our database
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>
                    All submissions require admin review before becoming public
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.guidelineText}>
                    Duplicate or invalid submissions will be rejected
                  </Text>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <Button
                title={isSubmitting ? 'Submitting...' : 'Submit for Review'}
                onPress={handleSubmit}
                disabled={!isValid || isSubmitting}
                variant="primary"
                loading={isSubmitting}
              />
            </View>
          </ScrollView>
        </AppContainer>
      </TouchableWithoutFeedback>
    </StatusBarSafeView>
  );
}

SubmitDiscScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

// Add display name for React DevTools
SubmitDiscScreen.displayName = 'SubmitDiscScreen';

export default memo(SubmitDiscScreen);
