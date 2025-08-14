/**
 * AddDiscToBagModal Component
 * Modal for editing disc properties before adding to bag
 * Follows design system patterns with professional polish
 */

import { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Button from '../Button';

function AddDiscToBagModal({
  visible,
  onClose,
  disc,
  bagName,
  onConfirm,
}) {
  const colors = useThemeColors();

  // State for custom disc properties
  const [customProps, setCustomProps] = useState({
    notes: '',
    weight: '',
    condition: '',
    plastic_type: '',
    color: '',
  });

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
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },

    // Disc Preview Section
    discPreview: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    discInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    discName: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      marginRight: spacing.sm,
    },
    discBrand: {
      ...typography.body,
      color: colors.textLight,
      fontStyle: 'italic',
    },
    flightNumbers: {
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    flightNumber: {
      width: 32,
      height: 32,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    speedNumber: {
      backgroundColor: `${colors.error}15`,
      borderColor: colors.error,
    },
    glideNumber: {
      backgroundColor: `${colors.primary}15`,
      borderColor: colors.primary,
    },
    turnNumber: {
      backgroundColor: `${colors.warning}15`,
      borderColor: colors.warning,
    },
    fadeNumber: {
      backgroundColor: `${colors.success}15`,
      borderColor: colors.success,
    },
    flightLabel: {
      ...typography.captionSmall,
      fontWeight: '700',
      color: colors.textLight,
    },
    flightNumberText: {
      ...typography.caption,
      fontWeight: '800',
      color: colors.text,
    },

    // Form Section
    formSection: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    inputLabel: {
      ...typography.overline,
      color: colors.text,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Platform.select({ ios: 8, android: 12 }),
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.select({ ios: spacing.sm, android: spacing.md }),
      backgroundColor: colors.background,
      color: colors.text,
      ...typography.body,
    },
    textInputFocused: {
      borderColor: colors.primary,
    },
    conditionButtons: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    conditionButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    conditionButtonActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    conditionButtonText: {
      ...typography.caption,
      color: colors.textLight,
      fontWeight: '600',
    },
    conditionButtonTextActive: {
      color: colors.primary,
    },

    // Actions
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    // Dynamic styles for inline replacements
    scrollContainer: {
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    formSectionWithBackground: {
      backgroundColor: colors.background,
    },
    sectionDescription: {
      ...typography.caption,
      color: colors.textLight,
      marginBottom: spacing.sm,
    },
    buttonFlex: {
      flex: 1,
    },
  });

  const conditions = ['new', 'good', 'worn', 'beat-in'];

  const handleInputChange = useCallback((field, value) => {
    setCustomProps((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleConditionSelect = useCallback((condition) => {
    setCustomProps((prev) => ({
      ...prev,
      condition: prev.condition === condition ? '' : condition,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!disc || !disc.id) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('No disc selected for adding to bag');
      }
      return;
    }

    const discData = {
      disc_id: disc.id,
      ...Object.fromEntries(
        Object.entries(customProps).filter(([, value]) => value.trim() !== ''),
      ),
    };

    // Convert weight to number if provided
    if (discData.weight) {
      const weightNum = parseFloat(discData.weight);
      if (Number.isNaN(weightNum)) {
        Alert.alert('Invalid Weight', 'Please enter a valid weight in grams.');
        return;
      }
      discData.weight = weightNum;
    }

    onConfirm(discData);
  }, [disc, customProps, onConfirm]);

  if (!disc) return null;

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
            <Text style={styles.modalTitle}>
              Add to
              {bagName}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator
            bounces={false}
          >
            <View style={styles.scrollContent}>
              {/* Disc Preview */}
              <View style={styles.discPreview}>
                <View style={styles.discInfo}>
                  <Text style={styles.discName}>{disc.model}</Text>
                  <Text style={styles.discBrand}>
                    by
                    {disc.brand}
                  </Text>
                </View>

                <View style={styles.flightNumbers}>
                  <View style={[styles.flightNumber, styles.speedNumber]}>
                    <Text style={styles.flightLabel}>S</Text>
                    <Text style={styles.flightNumberText}>{disc.speed}</Text>
                  </View>
                  <View style={[styles.flightNumber, styles.glideNumber]}>
                    <Text style={styles.flightLabel}>G</Text>
                    <Text style={styles.flightNumberText}>{disc.glide}</Text>
                  </View>
                  <View style={[styles.flightNumber, styles.turnNumber]}>
                    <Text style={styles.flightLabel}>T</Text>
                    <Text style={styles.flightNumberText}>{disc.turn}</Text>
                  </View>
                  <View style={[styles.flightNumber, styles.fadeNumber]}>
                    <Text style={styles.flightLabel}>F</Text>
                    <Text style={styles.flightNumberText}>{disc.fade}</Text>
                  </View>
                </View>
              </View>

              {/* Custom Properties Form */}
              <View style={[styles.formSection, styles.formSectionWithBackground]}>
                <Text style={styles.sectionTitle}>Customize Your Disc</Text>
                <Text style={styles.sectionDescription}>
                  Add custom properties to personalize this disc in your bag
                </Text>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Add your notes about this disc..."
                    value={customProps.notes}
                    onChangeText={(value) => handleInputChange('notes', value)}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Weight */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Weight (grams)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="175"
                    value={customProps.weight}
                    onChangeText={(value) => handleInputChange('weight', value)}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Color */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Color</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Red, Blue, Orange..."
                    value={customProps.color}
                    onChangeText={(value) => handleInputChange('color', value)}
                  />
                </View>

                {/* Plastic Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Plastic Type</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Champion, Star, DX..."
                    value={customProps.plastic_type}
                    onChangeText={(value) => handleInputChange('plastic_type', value)}
                  />
                </View>

                {/* Condition */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Condition</Text>
                  <View style={styles.conditionButtons}>
                    {conditions.map((condition) => (
                      <TouchableOpacity
                        key={condition}
                        style={[
                          styles.conditionButton,
                          customProps.condition === condition && styles.conditionButtonActive,
                        ]}
                        onPress={() => handleConditionSelect(condition)}
                      >
                        <Text
                          style={[
                            styles.conditionButtonText,
                            customProps.condition === condition && styles.conditionButtonTextActive,
                          ]}
                        >
                          {condition}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.buttonFlex}
            />
            <Button
              title="Add to Bag"
              variant="primary"
              onPress={handleConfirm}
              style={styles.buttonFlex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

AddDiscToBagModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  disc: PropTypes.shape({
    id: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    speed: PropTypes.number.isRequired,
    glide: PropTypes.number.isRequired,
    turn: PropTypes.number.isRequired,
    fade: PropTypes.number.isRequired,
  }),
  bagName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

AddDiscToBagModal.defaultProps = {
  disc: null,
};

export default AddDiscToBagModal;
