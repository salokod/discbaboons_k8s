/**
 * AddNotesToDiscModal Component
 * Modal for adding notes to a disc with orange theming
 * Following RecoverDiscModal patterns with professional polish
 */

import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function AddNotesToDiscModal({
  visible, onClose, disc, onSuccess, // eslint-disable-line no-unused-vars
}) {
  const colors = useThemeColors();
  const [notes, setNotes] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: `${colors.text}80`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: Platform.select({ ios: 16, android: 20 }),
      margin: spacing.md,
      width: '95%',
      maxWidth: 450,
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
    modalBody: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    discShowcaseSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: '#FF9500', // Orange theme
    },
    singleDiscDetails: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: spacing.sm,
    },
    discBrand: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
      marginRight: spacing.sm,
    },
    discModel: {
      ...typography.h3,
      color: '#FF9500', // Orange theme for model
      fontWeight: '700',
      flex: 1,
    },
    notesSection: {
      marginVertical: spacing.md,
    },
    notesLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    notesInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: spacing.md,
      ...typography.body,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    notesInputFocused: {
      borderColor: '#FF9500', // Orange theme when focused
      borderWidth: 2,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="add-notes-modal"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              testID="close-button"
              accessibilityLabel="Close add notes modal"
              accessibilityRole="button"
              accessibilityHint="Closes the modal without saving notes"
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Disc Showcase Section */}
            <View style={styles.discShowcaseSection}>
              <View style={styles.singleDiscDetails}>
                <Text testID="disc-brand" style={styles.discBrand}>
                  {disc.brand}
                </Text>
                <Text testID="disc-model" style={styles.discModel}>
                  {disc.model}
                </Text>
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <TextInput
                testID="notes-input"
                style={[styles.notesInput, isFocused && styles.notesInputFocused]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this disc..."
                multiline
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                accessibilityLabel="Notes input"
                accessibilityHint="Enter notes about this disc"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

AddNotesToDiscModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  disc: PropTypes.shape({
    id: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
  }).isRequired,
};

export default AddNotesToDiscModal;
