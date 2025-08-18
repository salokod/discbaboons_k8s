/**
 * BulkMoveModal Component
 * Modal for selecting which bag to move multiple selected discs to
 * Based on MoveDiscModal but handles multiple discs
 */

import {
  useState,
  useEffect,
} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { getBags, moveDiscBetweenBags } from '../../services/bagService';
import { useBagRefreshContext } from '../../context/BagRefreshContext';
import Button from '../Button';

function BulkMoveModal({
  visible,
  onClose,
  selectedDiscIds,
  currentBagId,
  currentBagName,
  onSuccess,
}) {
  const colors = useThemeColors();
  const { triggerBagRefresh, triggerBagListRefresh } = useBagRefreshContext();

  // State management
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBagId, setSelectedBagId] = useState(null);
  const [moving, setMoving] = useState(false);

  // Load bags when modal opens
  useEffect(() => {
    if (!visible) return;

    const loadBags = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getBags();
        // Filter out current bag
        const availableBags = response.bags.filter((bag) => bag.id !== currentBagId);
        setBags(availableBags);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBags();
  }, [visible, currentBagId]);

  // Handle move operation
  const handleMove = async () => {
    if (!selectedBagId || selectedDiscIds.length === 0) return;

    setMoving(true);
    try {
      await moveDiscBetweenBags(currentBagId, selectedBagId, selectedDiscIds);

      // Trigger refresh for source bag after successful move
      triggerBagRefresh(currentBagId);

      // Trigger refresh for destination bag after successful move
      triggerBagRefresh(selectedBagId);

      // Trigger bag list refresh to update disc counts
      triggerBagListRefresh();

      onSuccess();
      onClose();
    } catch (moveError) {
      setError(moveError.message);
    } finally {
      setMoving(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
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
    // Current Bag Section
    currentBagInfo: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
      marginLeft: spacing.sm,
    },
    errorContainer: {
      backgroundColor: colors.errorBackground || `${colors.error}15`,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
    },
    bagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    bagItemSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    bagItemContent: {
      flex: 1,
    },
    bagName: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
    },
    bagDiscCount: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
    },
    selectionIndicator: {
      marginLeft: spacing.sm,
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View testID="bulk-move-modal" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Move
              {' '}
              {selectedDiscIds.length}
              {' '}
              Discs
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Current Bag Info */}
            <Text style={styles.currentBagInfo}>
              Moving
              {' '}
              {selectedDiscIds.length}
              {' '}
              discs from:
              {' '}
              {currentBagName}
            </Text>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading bags...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load bags</Text>
              </View>
            )}

            {!loading && !error && bags.length > 0 && bags.map((bag) => (
              <TouchableOpacity
                key={bag.id}
                testID={`bag-item-${bag.id}`}
                style={[
                  styles.bagItem,
                  selectedBagId === bag.id && styles.bagItemSelected,
                ]}
                onPress={() => setSelectedBagId(bag.id)}
              >
                <View style={styles.bagItemContent}>
                  <Text style={styles.bagName}>{bag.name}</Text>
                  <Text style={styles.bagDiscCount}>
                    {bag.disc_count}
                    {' '}
                    discs
                  </Text>
                </View>
                {selectedBagId === bag.id && (
                  <View style={styles.selectionIndicator} testID={`selected-bag-${bag.id}`}>
                    <Icon name="checkmark-circle" size={24} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.buttonFlex}
            />
            <Button
              title={(() => {
                if (moving) return 'Moving...';
                if (selectedBagId) {
                  const selectedBag = bags.find((bag) => bag.id === selectedBagId);
                  return `Move to ${selectedBag?.name || 'Selected Bag'}`;
                }
                return 'Select Bag';
              })()}
              variant="primary"
              onPress={handleMove}
              disabled={!selectedBagId || moving}
              style={styles.buttonFlex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

BulkMoveModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDiscIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentBagId: PropTypes.string.isRequired,
  currentBagName: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default BulkMoveModal;
