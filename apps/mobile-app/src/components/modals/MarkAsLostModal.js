/**
 * MarkAsLostModal Component
 * Modal for marking selected discs as lost
 */

import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useBagRefreshContext } from '../../context/BagRefreshContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { markDiscAsLost, bulkMarkDiscsAsLost } from '../../services/bagService';
import { triggerSuccessHaptic, triggerErrorHaptic } from '../../services/hapticService';
import Button from '../Button';

function MarkAsLostModal({
  visible,
  onClose,
  discs,
  onSuccess,
  currentBagId,
}) {
  const colors = useThemeColors();
  const { triggerBagRefresh, triggerBagListRefresh } = useBagRefreshContext();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!visible) return null;

  // Handle mark as lost action
  const handleMarkAsLost = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      if (discs.length === 1) {
        // Single disc
        await markDiscAsLost(discs[0].id, true, notes);
      } else {
        // Multiple discs - use bulk API
        const contentIds = discs.map((disc) => disc.id);
        await bulkMarkDiscsAsLost(contentIds, true, notes);
      }

      // Trigger refresh for source bag after successful mark lost
      triggerBagRefresh(currentBagId);

      // Trigger bag list refresh to update disc counts
      triggerBagListRefresh();

      // Success - trigger haptic feedback and callbacks
      triggerSuccessHaptic();
      onSuccess();
      onClose();
    } catch (error) {
      // Error handling - trigger error haptic and show alert
      triggerErrorHaptic();
      Alert.alert(
        'Mark as Lost Failed',
        'Unable to mark discs as lost. Please try again.',
        [{ text: 'OK', style: 'default' }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get dynamic button text
  const getButtonText = () => {
    if (isLoading) return 'Marking as Lost...';
    return 'Mark as Lost';
  };

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

    // Disc Showcase Section - matching existing form patterns
    discShowcaseSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    sectionTitle: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
    },
    sectionDescription: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    discList: {
      gap: spacing.sm,
    },
    discItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: spacing.sm,
    },
    discInfo: {
      flex: 1,
    },
    discModel: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '700',
      marginBottom: 2,
    },
    discBrand: {
      ...typography.body2,
      color: colors.textLight,
      fontWeight: '500',
      fontStyle: 'italic',
    },
    flightNumbers: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    flightNumber: {
      width: 28,
      height: 28,
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
      color: colors.textSecondary,
      fontSize: 8,
      lineHeight: 10,
    },
    flightNumberText: {
      ...typography.caption,
      fontWeight: '800',
      color: colors.text,
      fontSize: 12,
      lineHeight: 14,
    },

    notesSection: {
      marginBottom: spacing.lg,
    },
    notesLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    notesInputContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    notesInput: {
      ...typography.body,
      color: colors.text,
      minHeight: 80,
      padding: spacing.md,
      textAlignVertical: 'top',
    },
    characterCount: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: spacing.xs,
    },
    characterCountOver: {
      color: colors.error,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    buttonFlex: {
      flex: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={styles.modalContent}
          testID="modal-content"
        >
          {/* Header */}
          <View style={styles.modalHeader} testID="modal-header">
            <Text style={styles.modalTitle}>
              Mark Discs as Lost (
              {discs.length}
              )
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              testID="close-button"
              accessibilityLabel="Close mark discs as lost modal"
              accessibilityRole="button"
              accessibilityHint="Closes the modal without marking any discs as lost"
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody} testID="modal-body">
            {/* Disc Showcase Section */}
            <View style={styles.discShowcaseSection}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="warning-outline"
                  size={20}
                  color={colors.error}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>
                  Mark
                  {' '}
                  {discs.length}
                  {' '}
                  Disc
                  {discs.length > 1 ? 's' : ''}
                  {' '}
                  as Lost
                </Text>
              </View>
              <Text style={styles.sectionDescription}>
                {discs.length > 1
                  ? 'These discs will be moved to your lost items:'
                  : 'This disc will be moved to your lost items:'}
              </Text>

              {/* Disc List */}
              <View style={styles.discList}>
                {discs.map((disc, index) => (
                  <View key={disc.id} style={styles.discItem} testID={`disc-item-${index}`}>
                    <View style={styles.discInfo}>
                      <Text style={styles.discModel}>{disc.model}</Text>
                      <Text style={styles.discBrand}>{disc.brand}</Text>
                    </View>
                    {disc.speed && disc.glide && disc.turn !== undefined
                    && disc.fade !== undefined && (
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
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="document-text-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Add optional details about when and where the disc was lost
              </Text>
              <View style={styles.notesInputContainer}>
                <TextInput
                  testID="notes-input"
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add optional notes about when and where the disc was lost..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={500}
                  accessibilityLabel="Notes input for marking discs as lost"
                  accessibilityHint="Optional field to add details about when and where the disc was lost"
                />
              </View>
              <Text
                style={[
                  styles.characterCount,
                  notes.length > 500 && styles.characterCountOver,
                ]}
                testID="character-count"
              >
                {notes.length}
                /500
              </Text>
            </View>

            <View
              testID="mark-as-lost-modal"
              accessibilityLabel={`Mark ${discs.length} discs as lost`}
              accessibilityRole="dialog"
            >
              {/* Modal content will be implemented in next slice */}
              {onSuccess && <View testID="success-callback-ready" />}
            </View>
          </View>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.buttonFlex}
              disabled={isLoading}
            />
            <Button
              title={getButtonText()}
              variant="primary"
              onPress={handleMarkAsLost}
              disabled={isLoading}
              style={styles.buttonFlex}
              testID="mark-lost-button"
              accessibilityLabel={`Mark ${discs.length} disc${discs.length > 1 ? 's' : ''} as lost`}
              accessibilityHint="Marks the selected discs as lost and moves them to lost items"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

MarkAsLostModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  discs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
  })).isRequired,
  currentBagId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default MarkAsLostModal;
