/**
 * DeleteBagConfirmationModal Component
 * Modal for confirming bag deletion with disc impact warning
 */

import { useCallback, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Button from '../Button';
import {
  getBags, getBag, moveDiscBetweenBags,
} from '../../services/bagService';

function DeleteBagConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  bag,
  loading,
  navigation,
  onMoveComplete,
}) {
  const colors = useThemeColors();

  // Modal state management
  const [modalState, setModalState] = useState('INITIAL');
  const [availableBags, setAvailableBags] = useState([]);
  const [selectedTargetBagId, setSelectedTargetBagId] = useState(null);
  const [moveProgress, setMoveProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

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
    moveSection: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    moveButton: {
      width: '100%',
    },
    bottomActions: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
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
    bagSelectionContainer: {
      marginTop: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    bagOption: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedBag: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    bagOptionText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    bagOptionMeta: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
    },
    createNewBagOption: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    createNewBagText: {
      ...typography.body,
      color: colors.surface,
      fontWeight: '600',
    },
    movingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    movingTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    movingText: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    errorContainer: {
      backgroundColor: `${colors.error}15`,
      borderRadius: 8,
      padding: spacing.md,
      marginTop: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
    },
    confirmDeleteContainer: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    confirmDeleteTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    confirmDeleteText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
  });

  const handleConfirm = useCallback(() => {
    if (bag) {
      onConfirm(bag);
    }
  }, [bag, onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleMoveDiscsFirst = useCallback(async () => {
    if (!bag?.id) return;
    try {
      setError(null);
      setModalState('CHOOSING_BAG');
      const response = await getBags();
      // Filter out current bag from available bags
      const filteredBags = (response.bags || []).filter((b) => b.id !== bag?.id);
      setAvailableBags(filteredBags);
    } catch (loadError) {
      // eslint-disable-next-line no-console
      console.error('Error loading bags:', loadError);
      setError('Failed to load bags. Please try again.');
      // Stay in current state if loading fails
    }
  }, [bag?.id]);

  const handleBagSelect = useCallback((bagId) => {
    setSelectedTargetBagId(bagId);
  }, []);

  const handleCreateNewBag = useCallback(() => {
    if (navigation && bag?.id) {
      // Close modal and navigate to create bag
      onCancel();
      navigation.navigate('CreateBag', {
        returnToBagsList: true,
        pendingMoveFromBag: bag?.id,
      });
    }
  }, [navigation, onCancel, bag?.id]);

  const handleStartMove = useCallback(async () => {
    if (!selectedTargetBagId || !bag?.id) return;

    try {
      setIsMoving(true);
      setError(null);
      setModalState('MOVING');

      // Get all disc IDs from the bag to be deleted
      const bagData = await getBag(bag?.id);
      const discIds = bagData.bag_contents?.map((disc) => disc.id) || [];

      if (discIds.length === 0) {
        // No discs to move, go straight to delete confirmation
        setModalState('CONFIRMING_DELETE');
        return;
      }

      setMoveProgress({ current: 0, total: discIds.length });

      // Move discs in batches to show progress
      const batchSize = 5;

      for (let i = 0; i < discIds.length; i += batchSize) {
        const batchIds = discIds.slice(i, i + batchSize);
        // eslint-disable-next-line no-await-in-loop
        await moveDiscBetweenBags(bag?.id, selectedTargetBagId, batchIds);
        const currentProgress = Math.min(i + batchSize, discIds.length);
        setMoveProgress({ current: currentProgress, total: discIds.length });
      }

      // Success - proceed to delete confirmation
      setModalState('CONFIRMING_DELETE');

      // Trigger bag list refresh if callback provided
      if (onMoveComplete) {
        onMoveComplete();
      }
    } catch (moveError) {
      // eslint-disable-next-line no-console
      console.error('Error moving discs:', moveError);
      setError(moveError.message || 'Failed to move discs. Please try again.');
      setModalState('CHOOSING_BAG');
    } finally {
      setIsMoving(false);
    }
  }, [selectedTargetBagId, bag?.id, onMoveComplete]);

  const handleConfirmFinalDelete = useCallback(async () => {
    if (!bag) return;
    try {
      // Use the existing delete flow
      await onConfirm(bag);
    } catch (deleteError) {
      // eslint-disable-next-line no-console
      console.error('Error deleting bag:', deleteError);
      setError(deleteError.message || 'Failed to delete bag. Please try again.');
    }
  }, [bag, onConfirm]);

  const handleBackToInitial = useCallback(() => {
    setModalState('INITIAL');
    setSelectedTargetBagId(null);
    setError(null);
    setAvailableBags([]);
    setMoveProgress({ current: 0, total: 0 });
  }, []);

  const getDiscCountText = (count) => (count === 1 ? '1 disc' : `${count} discs`);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setModalState('INITIAL');
      setSelectedTargetBagId(null);
      setError(null);
      setAvailableBags([]);
      setMoveProgress({ current: 0, total: 0 });
      setIsMoving(false);
    }
  }, [visible]);

  // Early return if bag is null to prevent rendering errors
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
            {modalState === 'INITIAL' && (
              <>
                {/* Bag Preview */}
                <View style={styles.bagPreview}>
                  <Text style={styles.bagName}>{bag?.name || 'Unknown Bag'}</Text>
                  <Text style={styles.discCount}>
                    {getDiscCountText(bag?.disc_count || 0)}
                  </Text>
                  {bag?.description && (
                    <Text style={styles.discCount}>
                      {bag?.description}
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
                    {bag?.disc_count && bag?.disc_count > 0 ? (
                      'You must move all discs to another bag before deleting this bag.'
                    ) : (
                      'This bag will be permanently deleted from your account.'
                    )}
                  </Text>
                </View>
              </>
            )}

            {modalState === 'CHOOSING_BAG' && (
              <View style={styles.bagSelectionContainer}>
                <Text style={styles.sectionTitle}>Choose destination bag:</Text>

                {availableBags.length === 0 ? (
                  <TouchableOpacity
                    style={styles.createNewBagOption}
                    onPress={handleCreateNewBag}
                    disabled={!navigation}
                  >
                    <Icon name="add" size={24} color={colors.surface} />
                    <Text style={styles.createNewBagText}>Create New Bag</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    {availableBags.map((availableBag) => (
                      <TouchableOpacity
                        key={availableBag.id}
                        style={[
                          styles.bagOption,
                          selectedTargetBagId === availableBag.id && styles.selectedBag,
                        ]}
                        onPress={() => handleBagSelect(availableBag.id)}
                      >
                        <Text style={styles.bagOptionText}>{availableBag.name}</Text>
                        <Text style={styles.bagOptionMeta}>
                          {getDiscCountText(availableBag.disc_count || 0)}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.createNewBagOption}
                      onPress={handleCreateNewBag}
                      disabled={!navigation}
                    >
                      <Icon name="add" size={20} color={colors.surface} />
                      <Text style={styles.createNewBagText}>Create New Bag</Text>
                    </TouchableOpacity>
                  </>
                )}

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            )}

            {modalState === 'MOVING' && (
              <View style={styles.movingContainer}>
                <Text style={styles.movingTitle}>Moving Discs</Text>
                <Text style={styles.movingText}>
                  Moving
                  {' '}
                  {moveProgress.current}
                  {' '}
                  of
                  {' '}
                  {moveProgress.total}
                  {' '}
                  discs...
                </Text>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            {modalState === 'CONFIRMING_DELETE' && (
              <View style={styles.confirmDeleteContainer}>
                <Icon name="checkmark-circle" size={48} color={colors.success} />
                <Text style={styles.confirmDeleteTitle}>Discs Moved Successfully</Text>
                <Text style={styles.confirmDeleteText}>
                  All discs have been moved to their new bag.
                  You can now safely delete the original bag.
                </Text>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Move Section - only show for bags with discs in INITIAL state */}
          {modalState === 'INITIAL' && bag?.disc_count && bag.disc_count > 0 && (
            <View style={styles.moveSection}>
              <Button
                title="🔄 Move Discs First"
                variant="primary"
                onPress={handleMoveDiscsFirst}
                style={styles.moveButton}
                disabled={loading}
              />
            </View>
          )}

          {/* Actions */}
          <View style={modalState === 'INITIAL' ? styles.bottomActions : styles.modalActions}>
            {modalState === 'INITIAL' && (
              <>
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
                  disabled={bag?.disc_count && bag.disc_count > 0}
                />
              </>
            )}

            {modalState === 'CHOOSING_BAG' && (
              <>
                <Button
                  title="Back"
                  variant="secondary"
                  onPress={handleBackToInitial}
                  style={styles.buttonFlex}
                  disabled={isMoving}
                />
                <Button
                  title={`Move ${bag?.disc_count || 0} Discs`}
                  variant="primary"
                  onPress={handleStartMove}
                  style={styles.buttonFlex}
                  disabled={!selectedTargetBagId || isMoving}
                  loading={isMoving}
                />
              </>
            )}

            {modalState === 'MOVING' && (
              <Button
                title="Moving..."
                variant="primary"
                style={styles.buttonFlex}
                disabled
                loading
              />
            )}

            {modalState === 'CONFIRMING_DELETE' && (
              <>
                <Button
                  title="Keep Bag"
                  variant="secondary"
                  onPress={handleCancel}
                  style={styles.buttonFlex}
                  disabled={loading}
                />
                <Button
                  title="Delete Empty Bag"
                  variant="destructive"
                  onPress={handleConfirmFinalDelete}
                  style={styles.buttonFlex}
                  loading={loading}
                />
              </>
            )}
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
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
  onMoveComplete: PropTypes.func,
};

DeleteBagConfirmationModal.defaultProps = {
  bag: null,
  loading: false,
  navigation: null,
  onMoveComplete: null,
};

export default DeleteBagConfirmationModal;
