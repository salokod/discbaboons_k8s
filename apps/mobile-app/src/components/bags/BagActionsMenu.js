/**
 * BagActionsMenu Component
 * Modal-based menu for bag edit and delete actions
 */

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

function BagActionsMenu({
  visible,
  onClose,
  onEdit,
  onDelete,
}) {
  const colors = useThemeColors();

  if (!visible) return null;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: `${colors.text}80`,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    overlayTouchable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: Platform.select({ ios: 16, android: 20 }),
      margin: spacing.md,
      width: '95%',
      maxWidth: 450,
      zIndex: 1,
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
      color: colors.text || '#000000',
      fontWeight: '700',
      fontSize: 18,
    },
    closeButton: {
      padding: spacing.xs,
      borderRadius: 20,
    },
    menuBody: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      marginBottom: spacing.sm,
    },
    menuItemIcon: {
      marginRight: spacing.md,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    menuItemDescription: {
      ...typography.caption,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary || '#666666',
    },
    editItem: {
      backgroundColor: `${colors.primary}08`,
    },
    deleteItem: {
      backgroundColor: `${colors.error}08`,
    },
  });

  const handleEditPress = () => {
    onEdit?.();
    onClose?.();
  };

  const handleDeletePress = () => {
    onDelete?.();
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text || '#000000' }]}>
              Bag Options
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.text || '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Menu Body */}
          <View style={styles.menuBody}>
            {/* Edit Option */}
            <TouchableOpacity
              style={[styles.menuItem, styles.editItem]}
              onPress={handleEditPress}
              activeOpacity={0.7}
            >
              <Icon
                name="create-outline"
                size={20}
                color={colors.primary || '#007AFF'}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemTitle, { color: colors.primary || '#007AFF' }]}>
                  Edit Bag
                </Text>
                <Text style={styles.menuItemDescription}>
                  Change name, description, or privacy
                </Text>
              </View>
            </TouchableOpacity>

            {/* Delete Option */}
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteItem]}
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <Icon
                name="trash-outline"
                size={20}
                color={colors.error || '#FF3B30'}
                style={styles.menuItemIcon}
              />
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemTitle, { color: colors.error || '#FF3B30' }]}>
                  Delete Bag
                </Text>
                <Text style={styles.menuItemDescription}>
                  Permanently remove this bag
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

BagActionsMenu.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// Add display name for React DevTools
BagActionsMenu.displayName = 'BagActionsMenu';

export default BagActionsMenu;
