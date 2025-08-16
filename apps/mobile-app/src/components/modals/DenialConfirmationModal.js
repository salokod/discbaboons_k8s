/**
 * DenialConfirmationModal Component
 * Modal for confirming disc denial with optional reason
 * Follows design system patterns with professional polish
 */

import { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Button from '../Button';

function DenialConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  disc,
}) {
  const colors = useThemeColors();
  const [reason, setReason] = useState('');

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
    reasonSection: {
      marginBottom: spacing.lg,
    },
    reasonLabel: {
      ...typography.overline,
      color: colors.text,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    reasonInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Platform.select({ ios: 8, android: 12 }),
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.select({ ios: spacing.sm, android: spacing.md }),
      backgroundColor: colors.background,
      color: colors.text,
      ...typography.body,
      minHeight: 80,
      textAlignVertical: 'top',
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
    buttonFlex: {
      flex: 1,
    },
  });

  const handleConfirm = useCallback(() => {
    onConfirm(reason.trim());
  }, [reason, onConfirm]);

  const handleCancel = useCallback(() => {
    setReason(''); // Reset reason when canceling
    onCancel();
  }, [onCancel]);

  if (!disc) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Deny Disc Submission</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <Icon name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Disc Preview */}
            <View style={styles.discPreview}>
              <View style={styles.discInfo}>
                <Text style={styles.discName}>{disc.model}</Text>
                <Text style={styles.discBrand}>
                  by
                  {' '}
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

            {/* Reason Input */}
            <View style={styles.reasonSection}>
              <Text style={styles.reasonLabel}>Reason for Denial</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Explain why this disc is being denied (optional)..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textLight}
                maxLength={500}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={handleCancel}
              style={styles.buttonFlex}
            />
            <Button
              title="Deny Disc"
              variant="destructive"
              onPress={handleConfirm}
              style={styles.buttonFlex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

DenialConfirmationModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disc: PropTypes.shape({
    id: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    speed: PropTypes.number.isRequired,
    glide: PropTypes.number.isRequired,
    turn: PropTypes.number.isRequired,
    fade: PropTypes.number.isRequired,
  }),
};

DenialConfirmationModal.defaultProps = {
  disc: null,
};

export default DenialConfirmationModal;
