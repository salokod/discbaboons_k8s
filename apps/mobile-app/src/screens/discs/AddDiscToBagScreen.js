/**
 * AddDiscToBagScreen Component
 * Full screen for customizing disc properties before adding to bag
 * Following CreateBagScreen design patterns
 */

import { memo, useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DiscCard from '../../components/DiscCard';
import { addDiscToBag } from '../../services/bagService';
import ColorPicker from '../../design-system/components/ColorPicker';

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New', icon: 'sparkles-outline' },
  { value: 'good', label: 'Good', icon: 'thumbs-up-outline' },
  { value: 'worn', label: 'Worn', icon: 'time-outline' },
  { value: 'beat-in', label: 'Beat-in', icon: 'fitness-outline' },
];

function AddDiscToBagScreen({ navigation, route }) {
  const colors = useThemeColors();
  const { disc, bagId, bagName } = route?.params || {};

  // Form state - initialize with disc master values
  const [customProps, setCustomProps] = useState({
    notes: '',
    weight: '',
    condition: '',
    plastic_type: '',
    color: '',
    // Flight numbers - start with disc master values
    speed: disc?.speed?.toString() || '',
    glide: disc?.glide?.toString() || '',
    turn: disc?.turn?.toString() || '',
    fade: disc?.fade?.toString() || '',
    // Brand/model overrides
    brand: disc?.brand || '',
    model: disc?.model || '',
  });

  const [isAdding, setIsAdding] = useState(false);

  // Refs for auto-focus flow
  const notesInputRef = useRef(null);
  const weightInputRef = useRef(null);

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
    quickAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      gap: spacing.sm,
    },
    quickAddButtonText: {
      ...typography.body,
      color: colors.surface,
      fontWeight: '700',
      fontSize: 14,
    },

    // Disc Preview Section
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
    discPreviewContainer: {
      marginBottom: 0,
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
    inputDescription: {
      ...typography.caption,
      color: colors.textLight,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    flightNumbersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.lg,
    },
    flightNumberInput: {
      flex: 1,
      minWidth: 120,
    },
    flightNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    flightNumberTextInput: {
      flex: 1,
      ...typography.body,
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.sm,
      color: colors.text,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
    flightAdjustButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 40,
    },
    flightAdjustButtonDisabled: {
      opacity: 0.3,
    },
    conditionButtons: {
      marginTop: spacing.sm,
    },
    conditionButtonRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    conditionButton: {
      flex: 1,
      aspectRatio: 1.8, // Wider than tall for better text fit
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    conditionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    conditionButtonText: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 12,
    },
    conditionButtonTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },

    // Action buttons
    actionContainer: {
      marginTop: spacing.xl * 2,
      paddingTop: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      marginHorizontal: -spacing.lg,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      borderWidth: 2,
      borderColor: colors.border,
    },
    cancelButtonText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      gap: spacing.sm,
    },
    addButtonDisabled: {
      opacity: 0.6,
    },
    addButtonText: {
      ...typography.body,
      color: colors.surface,
      fontWeight: '700',
      fontSize: 16,
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

  // Handle input changes
  const handleInputChange = (field, value) => {
    setCustomProps((prev) => ({ ...prev, [field]: value }));
  };

  // Handle condition selection
  const handleConditionSelect = (condition) => {
    setCustomProps((prev) => ({
      ...prev,
      condition: prev.condition === condition ? '' : condition,
    }));
  };

  // Validate flight numbers
  const validateFlightNumber = (value, field) => {
    if (!value) return true; // Empty is allowed (uses disc master)

    const num = parseInt(value, 10);
    if (Number.isNaN(num)) return false;

    switch (field) {
      case 'speed': return num >= 1 && num <= 15;
      case 'glide': return num >= 1 && num <= 7;
      case 'turn': return num >= -5 && num <= 2;
      case 'fade': return num >= 0 && num <= 5;
      default: return true;
    }
  };

  // Get flight number bounds
  const getFlightNumberBounds = (field) => {
    switch (field) {
      case 'speed': return { min: 1, max: 15 };
      case 'glide': return { min: 1, max: 7 };
      case 'turn': return { min: -5, max: 2 };
      case 'fade': return { min: 0, max: 5 };
      default: return { min: 0, max: 100 };
    }
  };

  // Adjust flight number with +/- buttons
  const adjustFlightNumber = (field, delta) => {
    const currentValue = customProps[field];
    const currentNum = currentValue ? parseInt(currentValue, 10) : (disc[field] || 0);
    const { min, max } = getFlightNumberBounds(field);

    const newValue = Math.max(min, Math.min(max, currentNum + delta));
    handleInputChange(field, newValue.toString());
  };

  // Check if adjustment buttons should be disabled
  const isAdjustmentDisabled = (field, delta) => {
    const currentValue = customProps[field];
    const currentNum = currentValue ? parseInt(currentValue, 10) : (disc[field] || 0);
    const { min, max } = getFlightNumberBounds(field);

    if (delta > 0) return currentNum >= max;
    if (delta < 0) return currentNum <= min;
    return false;
  };

  // Handle adding disc to bag
  const handleAddToBag = async () => {
    if (isAdding) return;

    // Validate flight numbers
    const flightFields = ['speed', 'glide', 'turn', 'fade'];
    const invalidField = flightFields.find((field) => (
      customProps[field] && !validateFlightNumber(customProps[field], field)
    ));
    if (invalidField) {
      Alert.alert(
        'Invalid Flight Number',
        `${invalidField.charAt(0).toUpperCase() + invalidField.slice(1)} must be within valid range.`,
        [{ text: 'OK' }],
      );
      return;
    }

    setIsAdding(true);

    try {
      // Build disc data with only non-empty values
      const discData = {
        disc_id: disc.id,
      };

      // Add custom properties if provided
      Object.entries(customProps).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          if (['speed', 'glide', 'turn', 'fade'].includes(key)) {
            discData[key] = parseInt(value, 10);
          } else if (key === 'weight') {
            const weightNum = parseFloat(value);
            if (!Number.isNaN(weightNum)) {
              discData[key] = weightNum;
            }
          } else {
            discData[key] = value.toString().trim();
          }
        }
      });

      await addDiscToBag(bagId, discData);

      Alert.alert(
        'Disc Added!',
        `${disc.model} has been added to ${bagName}.`,
        [
          {
            text: 'Add Another',
            style: 'default',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'View Bag',
            style: 'default',
            onPress: () => navigation.navigate('BagDetail', { bagId }),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to Add Disc',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsAdding(false);
    }
  };

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
    <SafeAreaView testID="add-disc-to-bag-screen" style={styles.container}>
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
                Add to
                {` ${bagName}`}
              </Text>
              <Text style={styles.headerSubtitle}>
                Customize this disc&apos;s properties for your bag
              </Text>

              {/* Quick Add Button */}
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={handleAddToBag}
                disabled={isAdding}
              >
                <Icon name="flash-outline" size={20} color={colors.surface} />
                <Text style={styles.quickAddButtonText}>
                  Quick Add with Defaults
                </Text>
              </TouchableOpacity>
            </View>

            {/* Disc Preview Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="disc-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Disc Preview</Text>
              </View>

              <DiscCard
                disc={{
                  model: customProps.model || disc.model,
                  brand: customProps.brand || disc.brand,
                  speed: parseInt(customProps.speed || disc.speed || 0, 10),
                  glide: parseInt(customProps.glide || disc.glide || 0, 10),
                  turn: parseInt(customProps.turn || disc.turn || 0, 10),
                  fade: parseInt(customProps.fade || disc.fade || 0, 10),
                  color: customProps.color,
                  weight: customProps.weight,
                  condition: customProps.condition,
                }}
                style={styles.discPreviewContainer}
              />
            </View>

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

              <View style={styles.flightNumbersGrid}>
                <View style={styles.flightNumberInput}>
                  <Text style={styles.inputLabel}>Speed (1-15)</Text>
                  <View style={styles.flightNumberContainer}>
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('speed', -1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('speed', -1)}
                      disabled={isAdjustmentDisabled('speed', -1)}
                    >
                      <Icon name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.flightNumberTextInput}
                      value={customProps.speed}
                      onChangeText={(value) => handleInputChange('speed', value)}
                      keyboardType="number-pad"
                      placeholder={disc.speed?.toString()}
                      placeholderTextColor={colors.textLight}
                    />
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('speed', 1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('speed', 1)}
                      disabled={isAdjustmentDisabled('speed', 1)}
                    >
                      <Icon name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.flightNumberInput}>
                  <Text style={styles.inputLabel}>Glide (1-7)</Text>
                  <View style={styles.flightNumberContainer}>
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('glide', -1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('glide', -1)}
                      disabled={isAdjustmentDisabled('glide', -1)}
                    >
                      <Icon name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.flightNumberTextInput}
                      value={customProps.glide}
                      onChangeText={(value) => handleInputChange('glide', value)}
                      keyboardType="number-pad"
                      placeholder={disc.glide?.toString()}
                      placeholderTextColor={colors.textLight}
                    />
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('glide', 1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('glide', 1)}
                      disabled={isAdjustmentDisabled('glide', 1)}
                    >
                      <Icon name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.flightNumberInput}>
                  <Text style={styles.inputLabel}>Turn (-5 to 2)</Text>
                  <View style={styles.flightNumberContainer}>
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('turn', -1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('turn', -1)}
                      disabled={isAdjustmentDisabled('turn', -1)}
                    >
                      <Icon name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.flightNumberTextInput}
                      value={customProps.turn}
                      onChangeText={(value) => handleInputChange('turn', value)}
                      keyboardType="number-pad"
                      placeholder={disc.turn?.toString()}
                      placeholderTextColor={colors.textLight}
                    />
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('turn', 1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('turn', 1)}
                      disabled={isAdjustmentDisabled('turn', 1)}
                    >
                      <Icon name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.flightNumberInput}>
                  <Text style={styles.inputLabel}>Fade (0-5)</Text>
                  <View style={styles.flightNumberContainer}>
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('fade', -1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('fade', -1)}
                      disabled={isAdjustmentDisabled('fade', -1)}
                    >
                      <Icon name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.flightNumberTextInput}
                      value={customProps.fade}
                      onChangeText={(value) => handleInputChange('fade', value)}
                      keyboardType="number-pad"
                      placeholder={disc.fade?.toString()}
                      placeholderTextColor={colors.textLight}
                    />
                    <TouchableOpacity
                      style={[
                        styles.flightAdjustButton,
                        isAdjustmentDisabled('fade', 1) && styles.flightAdjustButtonDisabled,
                      ]}
                      onPress={() => adjustFlightNumber('fade', 1)}
                      disabled={isAdjustmentDisabled('fade', 1)}
                    >
                      <Icon name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
                Add physical details and personal notes about this specific disc
              </Text>

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
                <View style={styles.conditionButtons}>
                  <View style={styles.conditionButtonRow}>
                    {CONDITION_OPTIONS.slice(0, 2).map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.conditionButton,
                          customProps.condition === option.value && styles.conditionButtonActive,
                        ]}
                        onPress={() => handleConditionSelect(option.value)}
                      >
                        <Icon
                          name={option.icon}
                          size={18}
                          color={
                            customProps.condition === option.value
                              ? colors.primary
                              : colors.textLight
                          }
                        />
                        <Text
                          style={[
                            styles.conditionButtonText,
                            customProps.condition === option.value
                              && styles.conditionButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.conditionButtonRow}>
                    {CONDITION_OPTIONS.slice(2, 4).map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.conditionButton,
                          customProps.condition === option.value && styles.conditionButtonActive,
                        ]}
                        onPress={() => handleConditionSelect(option.value)}
                      >
                        <Icon
                          name={option.icon}
                          size={18}
                          color={
                            customProps.condition === option.value
                              ? colors.primary
                              : colors.textLight
                          }
                        />
                        <Text
                          style={[
                            styles.conditionButtonText,
                            customProps.condition === option.value
                              && styles.conditionButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
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
                  placeholder={disc.brand}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Model</Text>
                <Input
                  value={customProps.model}
                  onChangeText={(value) => handleInputChange('model', value)}
                  placeholder={disc.model}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, styles.flexOne]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addButton, styles.flexOne, isAdding && styles.addButtonDisabled]}
                  onPress={handleAddToBag}
                  disabled={isAdding}
                >
                  <Icon
                    name={isAdding ? 'hourglass-outline' : 'add-circle-outline'}
                    size={20}
                    color={colors.surface}
                  />
                  <Text style={styles.addButtonText}>
                    {isAdding ? 'Adding...' : 'Add to Bag'}
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

AddDiscToBagScreen.propTypes = {
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

export default memo(AddDiscToBagScreen);
