/**
 * DeleteBagConfirmationModal Component
 * Modal for confirming bag deletion with disc impact warning
 */

import { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Button from '../Button';

function DeleteBagConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  bag,
  loading,
}) {
  const colors = useThemeColors();

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
    bagPreview: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    bagName: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    discCount: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.sm,
    },
    warningSection: {
      backgroundColor: `${colors.warning}15`,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    warningIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    warningTitle: {
      ...typography.subtitle,
      color: colors.warning,
      fontWeight: '700',
      marginLeft: spacing.sm,
    },
    warningText: {
      ...typography.body,
      color: colors.text,
      lineHeight: 20,
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

  const handleConfirm = useCallback(() => {
    onConfirm(bag);
  }, [bag, onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const getDiscCountText = (count) => (count === 1 ? '1 disc' : `${count} discs`);

  if (!bag) return null;

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
            <Text style={styles.modalTitle}>Delete Bag</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <Icon name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Bag Preview */}
            <View style={styles.bagPreview}>
              <Text style={styles.bagName}>{bag.name}</Text>
              <Text style={styles.discCount}>
                {getDiscCountText(bag.disc_count || 0)}
              </Text>
              {bag.description && (
                <Text style={styles.discCount}>
                  {bag.description}
                </Text>
              )}
            </View>

            {/* Warning Section */}
            <View style={styles.warningSection}>
              <View style={styles.warningIcon}>
                <Icon name="warning" size={20} color={colors.warning} />
                <Text style={styles.warningTitle}>This action cannot be undone</Text>
              </View>
              <Text style={styles.warningText}>
                All discs in this bag will remain in your collection but won&apos;t be organized
                in a bag anymore.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={handleCancel}
              style={styles.buttonFlex}
              disabled={loading}
            />
            <Button
              title="Delete Bag"
              variant="destructive"
              onPress={handleConfirm}
              style={styles.buttonFlex}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

DeleteBagConfirmationModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  bag: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    disc_count: PropTypes.number,
  }),
  loading: PropTypes.bool,
};

DeleteBagConfirmationModal.defaultProps = {
  bag: null,
  loading: false,
};

export default DeleteBagConfirmationModal;
