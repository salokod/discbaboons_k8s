/**
 * MoveDiscModal Component
 * Modal for selecting which bag to move a disc to
 * Follows design system patterns with professional polish
 */

import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useBagRefreshContext } from '../../context/BagRefreshContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Button from '../Button';
import { getBags, moveDiscBetweenBags } from '../../services/bagService';

function MoveDiscModal({
  visible,
  onClose,
  disc,
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
    if (!selectedBagId || !disc.id) return;

    setMoving(true);
    try {
      await moveDiscBetweenBags(currentBagId, selectedBagId, [disc.id]);

      // Trigger refresh for source bag after successful move
      triggerBagRefresh(currentBagId);

      // Trigger refresh for destination bag after successful move
      triggerBagRefresh(selectedBagId);

      // Trigger bag list refresh to update disc counts
      triggerBagListRefresh();

      onSuccess();
      onClose();
    } catch (moveError) {
      Alert.alert('Error', moveError.message);
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

    // Current Bag Section
    currentBagInfo: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.md,
      textAlign: 'center',
    },

    // Bag List Section
    bagListSection: {
      marginBottom: spacing.lg,
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
    emptyContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.body,
      color: colors.textLight,
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
            <Text style={styles.modalTitle}>Move Disc</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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

            {/* Current Bag Info */}
            <Text style={styles.currentBagInfo}>
              Currently in:
              {' '}
              {currentBagName}
            </Text>

            {/* Bag List Section */}
            <View style={styles.bagListSection}>
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

              {!loading && !error && bags.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No other bags available</Text>
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

MoveDiscModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  disc: PropTypes.shape({
    id: PropTypes.string.isRequired, // This is the bag content ID used for moving
    model: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    speed: PropTypes.number.isRequired,
    glide: PropTypes.number.isRequired,
    turn: PropTypes.number.isRequired,
    fade: PropTypes.number.isRequired,
  }).isRequired,
  currentBagId: PropTypes.string.isRequired,
  currentBagName: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default MoveDiscModal;
