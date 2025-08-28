/**
 * EditDiscScreen Component
 * Full screen for editing disc properties with form fields
 * Following AddDiscToBagScreen design patterns
 */

import {
  memo, useState, useRef, useCallback,
} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
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
import Input from '../../components/Input';
import Button from '../../components/Button';
import ColorPicker from '../../design-system/components/ColorPicker';
import DiscPreviewSection from '../../components/shared/DiscPreviewSection';
import FlightNumberSection from '../../components/shared/FlightNumberSection';
import ConditionSelector from '../../components/shared/ConditionSelector';
import { updateDiscInBag } from '../../services/bagService';
import { useBagRefreshContext } from '../../context/BagRefreshContext';

function EditDiscScreen({ navigation, route }) {
  const colors = useThemeColors();
  const { disc, bagId, bagName } = route?.params || {};

  // Get refresh trigger function from context
  const { triggerBagRefresh } = useBagRefreshContext();

  // Form state - initialize with existing disc values
  const [customProps, setCustomProps] = useState({
    notes: disc?.notes || '',
    weight: disc?.weight?.toString() || '',
    condition: disc?.condition || '',
    plastic_type: disc?.plastic_type || '',
    color: disc?.color || '',
    // Flight numbers - use disc values or disc master values as fallback
    speed: disc?.speed?.toString() || disc?.disc_master?.speed?.toString() || '',
    glide: disc?.glide?.toString() || disc?.disc_master?.glide?.toString() || '',
    turn: disc?.turn?.toString() || disc?.disc_master?.turn?.toString() || '',
    fade: disc?.fade?.toString() || disc?.disc_master?.fade?.toString() || '',
    // Brand/model overrides - use disc values or disc master values as fallback
    brand: disc?.brand || disc?.disc_master?.brand || '',
    model: disc?.model || disc?.disc_master?.model || '',
    custom_name: disc?.custom_name || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Refs for auto-focus flow
  const notesInputRef = useRef(null);
  const weightInputRef = useRef(null);

  // Basic component structure with navigation setup
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setCustomProps((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save with two-tier strategy: optimistic updates + API persistence
  const handleSave = useCallback(async () => {
    if (!disc || !bagId || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      // Prepare update data - only include changed fields
      const updates = {};

      // Check each field for changes and add to updates if different
      if (customProps.custom_name !== (disc.custom_name || '')) {
        updates.custom_name = customProps.custom_name.trim();
      }
      if (customProps.condition !== (disc.condition || '')) {
        updates.condition = customProps.condition;
      }
      if (customProps.notes !== (disc.notes || '')) {
        updates.notes = customProps.notes.trim();
      }
      if (customProps.weight !== (disc.weight?.toString() || '')) {
        updates.weight = customProps.weight ? parseFloat(customProps.weight) : null;
      }
      if (customProps.color !== (disc.color || '')) {
        updates.color = customProps.color;
      }
      if (customProps.plastic_type !== (disc.plastic_type || '')) {
        updates.plastic_type = customProps.plastic_type;
      }

      // Flight numbers - check for changes
      const currentSpeed = disc.speed || disc.disc_master?.speed;
      const currentGlide = disc.glide || disc.disc_master?.glide;
      const currentTurn = disc.turn || disc.disc_master?.turn;
      const currentFade = disc.fade || disc.disc_master?.fade;

      if (customProps.speed !== (currentSpeed?.toString() || '')) {
        updates.speed = customProps.speed ? parseInt(customProps.speed, 10) : null;
      }
      if (customProps.glide !== (currentGlide?.toString() || '')) {
        updates.glide = customProps.glide ? parseInt(customProps.glide, 10) : null;
      }
      if (customProps.turn !== (currentTurn?.toString() || '')) {
        updates.turn = customProps.turn ? parseInt(customProps.turn, 10) : null;
      }
      if (customProps.fade !== (currentFade?.toString() || '')) {
        updates.fade = customProps.fade ? parseInt(customProps.fade, 10) : null;
      }

      // Brand/model overrides
      if (customProps.brand !== (disc.brand || disc.disc_master?.brand || '')) {
        updates.brand = customProps.brand;
      }
      if (customProps.model !== (disc.model || disc.disc_master?.model || '')) {
        updates.model = customProps.model;
      }

      // If no changes, just go back
      if (Object.keys(updates).length === 0) {
        navigation.goBack();
        return;
      }

      // Call API to persist changes
      await updateDiscInBag(bagId, disc.id, updates);

      // Trigger bag refresh after successful save
      triggerBagRefresh(bagId);

      // On successful save, navigate back
      navigation.goBack();
    } catch (error) {
      // Show error to user
      Alert.alert(
        'Save Failed',
        error.message || 'Failed to save disc changes. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsSaving(false);
    }
  }, [disc, bagId, customProps, navigation, isSaving, triggerBagRefresh]);

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
      marginBottom: spacing.xl,
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
      marginBottom: spacing.lg,
    },
    // Section styles (copied from AddDiscToBagScreen)
    section: {
      marginBottom: spacing.xl * 1.5,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
    },
    inputDescription: {
      ...typography.caption,
      color: colors.textLight,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    // Form Sections
    inputGroup: {
      marginBottom: spacing.xl,
    },
    inputLabel: {
      ...typography.overline,
      color: colors.text,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      fontWeight: '600',
      fontSize: 12,
    },
    // Action buttons
    actionContainer: {
      marginTop: spacing.xl * 2,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      marginHorizontal: -spacing.lg,
      backgroundColor: colors.background,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg + 2,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 14,
        android: 18,
      }),
      borderWidth: 2,
      borderColor: colors.border,
      minHeight: 52,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cancelButtonText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      fontSize: 17,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg + 2,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: Platform.select({
        ios: 14,
        android: 18,
      }),
      minHeight: 52,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      gap: spacing.sm,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      ...typography.body,
      color: colors.surface,
      fontWeight: '700',
      fontSize: 17,
    },
    // Dynamic styles for inline replacements
    centeredContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    flexOne: {
      flex: 1,
    },
  });

  if (!disc) {
    return (
      <SafeAreaView style={styles.container}>
        <AppContainer>
          <View style={[styles.scrollContent, styles.centeredContainer]}>
            <Text style={typography.h3}>No disc selected</Text>
            <Button title="Go Back" onPress={() => navigation.goBack()} />
          </View>
        </AppContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="edit-disc-screen" style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={styles.dismissKeyboard}>
        <AppContainer>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                Edit
                {disc ? ` ${disc.model || disc.disc_master?.model || 'Disc'}` : ' Disc'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Update your disc&apos;s properties and details for
                {' '}
                {bagName || 'your bag'}
              </Text>
            </View>

            {/* Disc Preview Section */}
            <DiscPreviewSection
              disc={{
                ...disc,
                color: customProps.color,
                weight: customProps.weight,
                custom_name: customProps.custom_name,
              }}
              flightNumbers={{
                speed: customProps.speed ? parseInt(customProps.speed, 10) : null,
                glide: customProps.glide ? parseInt(customProps.glide, 10) : null,
                turn: customProps.turn ? parseInt(customProps.turn, 10) : null,
                fade: customProps.fade ? parseInt(customProps.fade, 10) : null,
              }}
              masterFlightNumbers={{
                speed: disc?.speed || disc?.disc_master?.speed,
                glide: disc?.glide || disc?.disc_master?.glide,
                turn: disc?.turn || disc?.disc_master?.turn,
                fade: disc?.fade || disc?.disc_master?.fade,
              }}
              customName={customProps.model}
              condition={customProps.condition}
              showCustomFields
            />

            {/* Flight Numbers Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="trending-up-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Flight Numbers</Text>
              </View>

              <Text style={styles.inputDescription}>
                Override the disc&apos;s default flight characteristics based on your experience
              </Text>

              <FlightNumberSection
                flightNumbers={{
                  speed: customProps.speed,
                  glide: customProps.glide,
                  turn: customProps.turn,
                  fade: customProps.fade,
                }}
                onFlightNumberChange={handleInputChange}
                masterFlightNumbers={{
                  speed: disc?.speed || disc?.disc_master?.speed,
                  glide: disc?.glide || disc?.disc_master?.glide,
                  turn: disc?.turn || disc?.disc_master?.turn,
                  fade: disc?.fade || disc?.disc_master?.fade,
                }}
              />
            </View>

            {/* Disc Properties Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="construct-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Disc Properties</Text>
              </View>

              <Text style={styles.inputDescription}>
                Update physical details and personal notes about this specific disc
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Custom Name</Text>
                <Input
                  value={customProps.custom_name}
                  onChangeText={(value) => handleInputChange('custom_name', value)}
                  placeholder="Enter custom name for this disc..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <Input
                  ref={notesInputRef}
                  value={customProps.notes}
                  onChangeText={(value) => handleInputChange('notes', value)}
                  placeholder="Add your notes about this disc..."
                  multiline
                  numberOfLines={3}
                  returnKeyType="next"
                  onSubmitEditing={() => weightInputRef.current?.focus()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (grams)</Text>
                <Input
                  ref={weightInputRef}
                  value={customProps.weight}
                  onChangeText={(value) => handleInputChange('weight', value)}
                  keyboardType="decimal-pad"
                  placeholder="175"
                  returnKeyType="done"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Disc Color</Text>
                <Text style={styles.inputDescription}>
                  Select the color of your disc
                </Text>
                <ColorPicker
                  selectedColor={customProps.color}
                  onColorSelect={(color) => handleInputChange('color', color)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Plastic Type</Text>
                <Input
                  value={customProps.plastic_type}
                  onChangeText={(value) => handleInputChange('plastic_type', value)}
                  placeholder="Champion, Star, DX..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Condition</Text>
                <Text style={styles.inputDescription}>
                  Rate the physical condition of this disc
                </Text>
                <ConditionSelector
                  condition={customProps.condition}
                  onConditionChange={(value) => handleInputChange('condition', value)}
                />
              </View>
            </View>

            {/* Brand/Model Override Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="create-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Brand & Model Override</Text>
              </View>

              <Text style={styles.inputDescription}>
                Override the brand/model if this disc differs from the master entry
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand</Text>
                <Input
                  value={customProps.brand}
                  onChangeText={(value) => handleInputChange('brand', value)}
                  placeholder={disc?.brand || disc?.disc_master?.brand}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model</Text>
                <Input
                  value={customProps.model}
                  onChangeText={(value) => handleInputChange('model', value)}
                  placeholder={disc?.model || disc?.disc_master?.model}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, styles.flexOne]}
                  onPress={handleGoBack}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="save-button"
                  style={[styles.saveButton, styles.flexOne, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Icon
                    name={isSaving ? 'hourglass-outline' : 'checkmark-circle-outline'}
                    size={20}
                    color={colors.surface}
                  />
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </AppContainer>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

EditDiscScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      disc: PropTypes.shape({
        id: PropTypes.string.isRequired,
        model: PropTypes.string.isRequired,
        brand: PropTypes.string.isRequired,
        speed: PropTypes.number.isRequired,
        glide: PropTypes.number.isRequired,
        turn: PropTypes.number.isRequired,
        fade: PropTypes.number.isRequired,
      }).isRequired,
      bagId: PropTypes.string.isRequired,
      bagName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default memo(EditDiscScreen);
