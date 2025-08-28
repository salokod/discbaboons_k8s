/**
 * RecoverDiscModal Component
 * Modal for selecting which bag to recover lost discs to
 * Follows design system patterns with professional polish
 */

import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  FlatList,
  Animated,
  Vibration,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useBagRefreshContext } from '../../context/BagRefreshContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { getBags, bulkRecoverDiscs } from '../../services/bagService';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../../services/hapticService';
import { formatNumberForScreenReader, formatListForScreenReader } from '../../utils/accessibilityUtils';
import Button from '../Button';

function RecoverDiscModal({
  visible, onClose, onSuccess, discs, targetBagId, // eslint-disable-line no-unused-vars
}) {
  const colors = useThemeColors();
  const { triggerBagRefresh, triggerBagListRefresh } = useBagRefreshContext();
  const [isLoadingBags, setIsLoadingBags] = useState(true);
  const [bags, setBags] = useState([]);
  const [selectedBagId, setSelectedBagId] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorType, setErrorType] = useState(null);

  // Animation values
  const showcaseOpacity = useState(new Animated.Value(0))[0];
  const bagSectionOpacity = useState(new Animated.Value(0))[0];
  const bagSectionTranslateY = useState(new Animated.Value(20))[0];
  const errorSectionOpacity = useState(new Animated.Value(0))[0];
  const errorSectionTranslateY = useState(new Animated.Value(20))[0];
  const [bagScaleValues] = useState({});
  const [bagSelectionAnimations] = useState({});

  // Skeleton loading animation values
  const skeletonShimmerValue = useState(new Animated.Value(0))[0];

  // Enhanced error classification and messaging
  const classifyError = (error) => {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('network') || errorMessage.includes('fetch')
        || errorMessage.includes('connection') || errorMessage.includes('failed to fetch')) {
      return 'network';
    }
    if (errorMessage.includes('server') || errorMessage.includes('500')
        || errorMessage.includes('503') || errorMessage.includes('502')) {
      return 'server';
    }
    if (errorMessage.includes('timeout')) {
      return 'timeout';
    }
    // Default to network for unknown errors
    return 'network';
  };

  const getErrorContent = (type) => {
    switch (type) {
      case 'network':
        return {
          icon: 'wifi-off',
          title: 'Connection Problem',
          message: 'We\'re having trouble connecting to our servers. Check your internet connection and try again.',
        };
      case 'server':
        return {
          icon: 'server',
          title: 'Server Issue',
          message: 'Our servers are experiencing issues. Please wait a moment and try again.',
        };
      case 'timeout':
        return {
          icon: 'time-outline',
          title: 'Request Timeout',
          message: 'The request took too long to complete. Please check your connection and try again.',
        };
      default:
        return {
          icon: 'wifi-off',
          title: 'Connection Problem',
          message: 'We\'re having trouble connecting to our servers. Check your internet connection and try again.',
        };
    }
  };

  // Load bags function
  const loadBags = useCallback(async () => {
    try {
      setIsLoadingBags(true);
      setLoadError(false);
      const response = await getBags();
      // getBags returns {bags: [], pagination: {}} - extract the bags array
      const loadedBags = response.bags || [];
      setBags(loadedBags);

      // Initialize scale animations for each bag
      loadedBags.forEach((bag) => {
        if (!bagScaleValues[bag.id]) {
          bagScaleValues[bag.id] = new Animated.Value(1);
        }
        if (!bagSelectionAnimations[bag.id]) {
          bagSelectionAnimations[bag.id] = new Animated.Value(0);
        }
      });

      // Start bag section slide in animation after bags load
      if (loadedBags.length > 0) {
        Animated.parallel([
          Animated.timing(bagSectionOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bagSectionTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      // Enhanced error handling with classification and animation
      const errorCategory = classifyError(error);
      setErrorType(errorCategory);
      setLoadError(true);
      setBags([]);

      // Start error section fade in animation
      Animated.parallel([
        Animated.timing(errorSectionOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(errorSectionTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } finally {
      setIsLoadingBags(false);
    }
  }, [
    bagScaleValues,
    bagSelectionAnimations,
    bagSectionOpacity,
    bagSectionTranslateY,
    errorSectionOpacity,
    errorSectionTranslateY,
  ]);

  // Skeleton shimmer animation
  const startSkeletonShimmer = useCallback(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonShimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonShimmerValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmerAnimation.start();
    return shimmerAnimation;
  }, [skeletonShimmerValue]);

  // Load bags when modal becomes visible
  useEffect(() => {
    if (!visible) {
      // Reset animations when modal closes
      showcaseOpacity.setValue(0);
      bagSectionOpacity.setValue(0);
      bagSectionTranslateY.setValue(20);
      errorSectionOpacity.setValue(0);
      errorSectionTranslateY.setValue(20);
      skeletonShimmerValue.setValue(0);
      return;
    }

    // Start disc showcase fade in animation
    if (discs.length > 0) {
      Animated.timing(showcaseOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    // Start skeleton shimmer animation for loading state
    startSkeletonShimmer();

    loadBags();
  }, [
    visible,
    discs.length,
    showcaseOpacity,
    bagSectionOpacity,
    bagSectionTranslateY,
    errorSectionOpacity,
    errorSectionTranslateY,
    skeletonShimmerValue,
    startSkeletonShimmer,
    loadBags,
  ]);

  // Handle retry loading bags
  const handleRetry = () => {
    // Reset error animation state
    errorSectionOpacity.setValue(0);
    errorSectionTranslateY.setValue(20);
    setErrorType(null);
    loadBags();
  };

  // Handle bag selection with enhanced animation and haptic feedback
  const handleBagSelection = (bagId) => {
    // Trigger selection haptic feedback
    triggerSelectionHaptic();

    // Additional platform-specific haptic feedback
    if (Platform.OS === 'ios') {
      // iOS specific haptic feedback is handled by triggerSelectionHaptic
    } else {
      // Android vibration feedback
      Vibration.vibrate(50);
    }

    // Reset previous selection animations
    if (selectedBagId && bagScaleValues[selectedBagId] && bagSelectionAnimations[selectedBagId]) {
      Animated.parallel([
        Animated.spring(bagScaleValues[selectedBagId], {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bagSelectionAnimations[selectedBagId], {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setSelectedBagId(bagId);

    // Animate new selection with spring animation and selection indicator
    if (bagScaleValues[bagId] && bagSelectionAnimations[bagId]) {
      Animated.parallel([
        Animated.spring(bagScaleValues[bagId], {
          toValue: 1.005, // Reduced from 1.02 to prevent overflow
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(bagSelectionAnimations[bagId], {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Handle recovery action
  const handleRecover = async () => {
    if (!selectedBagId || isRecovering) return;

    try {
      setIsRecovering(true);

      // Extract content IDs from discs
      const contentIds = discs.map((disc) => disc.id);

      // Call bulk recovery API
      await bulkRecoverDiscs({
        contentIds,
        targetBagId: selectedBagId,
      });

      // Trigger refresh for destination bag after successful recovery
      triggerBagRefresh(selectedBagId);

      // Trigger bag list refresh to update disc counts
      triggerBagListRefresh();

      // Success - trigger haptic feedback, call callback and close modal
      triggerSuccessHaptic();
      onSuccess();
      onClose();
    } catch (error) {
      // Show user-friendly error message
      Alert.alert(
        'Recovery Failed',
        'Unable to recover discs. Please try again.',
        [{ text: 'OK', style: 'default' }],
      );
    } finally {
      setIsRecovering(false);
    }
  };

  // Generate accessibility labels for disc showcase
  const generateDiscAccessibilityLabel = (disc) => {
    const parts = [`${disc.brand} ${disc.model}`];

    if (disc.speed !== undefined && disc.glide !== undefined
        && disc.turn !== undefined && disc.fade !== undefined) {
      const flightNumbers = [
        `speed ${formatNumberForScreenReader(disc.speed)}`,
        `glide ${formatNumberForScreenReader(disc.glide)}`,
        `turn ${formatNumberForScreenReader(disc.turn)}`,
        `fade ${formatNumberForScreenReader(disc.fade)}`,
      ];
      parts.push(flightNumbers.join(', '));
    }

    return parts.join(', ');
  };

  // Generate accessibility label for multi-disc grid
  const generateMultiDiscAccessibilityLabel = () => {
    const discCount = discs.length;
    const discNames = discs.slice(0, 3).map((disc) => `${disc.brand} ${disc.model}`);

    if (discCount > 3) {
      discNames.push(`and ${discCount - 3} more discs`);
    }

    return `${formatNumberForScreenReader(discCount)} discs selected for recovery: ${formatListForScreenReader(discNames)}`;
  };

  // Generate accessibility label for bag items
  const generateBagAccessibilityLabel = (bag) => {
    const parts = [bag.name];
    if (bag.description) parts.push(bag.description);
    if (bag.disc_count !== undefined) {
      parts.push(`contains ${formatNumberForScreenReader(bag.disc_count)} discs`);
    }
    return parts.join(', ');
  };

  // Generate accessibility label for recover button
  const generateRecoverButtonAccessibilityLabel = () => {
    if (!selectedBagId) return 'Select destination bag first';

    const selectedBag = bags.find((bag) => bag.id === selectedBagId);
    const bagName = selectedBag?.name || 'Selected Bag';
    const discCount = discs.length;
    const discText = discCount === 1 ? 'disc' : 'discs';

    return `Recover ${formatNumberForScreenReader(discCount)} ${discText} to ${bagName}`;
  };

  // Generate simple button text based on state
  const getRecoverButtonText = () => {
    // Show "Recovering..." during operation
    if (isRecovering) {
      return 'Recovering...';
    }

    // Show simple "Recover" text regardless of bag selection
    return 'Recover';
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
    discShowcaseSection: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    discShowcaseTitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    singleDiscDetails: {
      marginTop: spacing.sm,
    },
    discModel: {
      ...typography.h3,
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
      gap: spacing.sm,
      justifyContent: 'center',
      marginTop: spacing.sm,
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
      color: colors.textSecondary,
    },
    flightNumberText: {
      ...typography.caption,
      fontWeight: '800',
      color: colors.text,
    },
    loadingSection: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    loadingIndicator: {
      marginBottom: spacing.sm,
    },
    loadingText: {
      ...typography.body,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    skeletonLoadingSection: {
      paddingVertical: spacing.lg,
    },
    skeletonBagItem: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xs,
      backgroundColor: `${colors.background}50`,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: `${colors.border}30`,
      overflow: 'hidden',
    },
    skeletonBagItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    skeletonBagItemText: {
      flex: 1,
    },
    skeletonBagName: {
      height: 20,
      backgroundColor: `${colors.textSecondary}20`,
      borderRadius: 4,
      marginBottom: spacing.xs,
      width: '70%',
    },
    skeletonBagDescription: {
      height: 16,
      backgroundColor: `${colors.textSecondary}15`,
      borderRadius: 4,
      width: '90%',
      marginBottom: spacing.xs,
    },
    skeletonBagDiscCount: {
      height: 14,
      backgroundColor: `${colors.textSecondary}15`,
      borderRadius: 4,
      width: '40%',
    },
    skeletonShimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    bagSelectionSection: {
      marginBottom: spacing.lg,
    },
    bagSelectionTitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      fontWeight: '600',
    },
    bagListScroll: {
      maxHeight: 300, // Limit height to prevent modal overflow
    },
    bagListContent: {
      paddingBottom: spacing.xs,
    },
    bagItem: {
      paddingVertical: spacing.lg, // Increased from spacing.md for 44px minimum touch target
      paddingHorizontal: spacing.lg, // Increased from spacing.md for better touch targets
      marginBottom: spacing.sm, // Increased from spacing.xs for better spacing
      marginHorizontal: spacing.xs, // Add small horizontal margin to prevent overflow
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 44, // Ensure minimum 44px touch target
    },
    bagName: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    bagDescription: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    bagItemSelected: {
      borderColor: colors.primary,
      borderWidth: 3, // Increased from 2 for stronger visual differentiation
      backgroundColor: `${colors.primary}18`, // More visible background tint
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3, // Android shadow
    },
    bagItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bagItemIcon: {
      marginRight: spacing.md,
    },
    bagItemText: {
      flex: 1,
    },
    selectionIndicator: {
      marginLeft: spacing.sm,
      position: 'relative',
    },
    checkmarkContainer: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkContainerSelected: {
      // Additional styling for selected state if needed
    },
    bagDiscCount: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    emptyStateSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    emptyStateIcon: {
      marginBottom: spacing.md,
    },
    emptyStateTitle: {
      ...typography.h4,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    emptyStateMessage: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorSection: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    errorIcon: {
      marginBottom: spacing.md,
    },
    errorTitle: {
      ...typography.h4,
      color: colors.error,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    errorMessage: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
    },
    retryButtonText: {
      ...typography.body,
      color: colors.surface,
      fontWeight: '600',
    },
    enhancedRetryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 12,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    enhancedRetryButtonText: {
      ...typography.body,
      color: colors.surface,
      fontWeight: '700',
      textAlign: 'center',
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
    recoveryContextSection: {
      backgroundColor: colors.background,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    recoveryContextIcon: {
      marginRight: spacing.md,
      marginTop: spacing.xs, // Slight offset to align with text baseline
    },
    recoveryContextText: {
      ...typography.body,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    gridContainer: {
      paddingTop: spacing.sm,
    },
    discCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      margin: spacing.xs,
      flex: 1,
      maxWidth: '30%',
      alignItems: 'center',
    },
    cardModel: {
      ...typography.captionSmall,
      color: colors.text,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    cardBrand: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    moreDiscsIndicator: {
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'center',
    },
    moreDiscsText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });

  // Skeleton Bag Item Component
  const renderSkeletonBagItem = (index) => {
    const shimmerOpacity = skeletonShimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const shimmerTranslateX = skeletonShimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-200, 200],
    });

    return (
      <View key={`skeleton-${index}`} style={styles.skeletonBagItem} testID={`skeleton-bag-item-${index}`}>
        <View style={styles.skeletonBagItemContent}>
          <View style={styles.skeletonBagItemText}>
            <View style={styles.skeletonBagName} />
            <View style={styles.skeletonBagDescription} />
            <View style={styles.skeletonBagDiscCount} />
          </View>
        </View>
        <Animated.View
          style={[
            styles.skeletonShimmer,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
          testID={`skeleton-shimmer-${index}`}
        />
      </View>
    );
  };

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
              Recover Discs
              {discs.length > 0 && ` (${discs.length})`}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              testID="close-button"
              accessibilityLabel="Close recover discs modal"
              accessibilityRole="button"
              accessibilityHint="Closes the modal without recovering any discs"
            >
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Recovery Context Section */}
            {discs.length > 0 && (
              <View
                style={styles.recoveryContextSection}
                testID="recovery-context-section"
                accessibilityLabel="Recovery information"
                accessibilityRole="text"
                accessibilityHint="This explains what will happen when you recover your discs"
              >
                <Icon
                  name="arrow-undo-outline"
                  size={24}
                  color={colors.primary}
                  style={styles.recoveryContextIcon}
                  testID="recovery-context-icon"
                />
                <Text style={styles.recoveryContextText} testID="recovery-context-text">
                  {discs.length === 1
                    ? 'This will return your lost disc back into your selected bag where you can track it again.'
                    : 'This will return your lost discs back into your selected bag where you can track them again.'}
                </Text>
              </View>
            )}

            {/* DiscShowcase Section */}
            {discs.length > 0 && (
              <Animated.View
                style={[
                  styles.discShowcaseSection,
                  {
                    opacity: showcaseOpacity,
                  },
                ]}
                testID="disc-showcase-section"
                accessibilityLabel={
                  discs.length === 1
                    ? generateDiscAccessibilityLabel(discs[0])
                    : generateMultiDiscAccessibilityLabel()
                }
                accessibilityRole="text"
              >
                <View testID="animated-disc-showcase-section">
                  <Text style={styles.discShowcaseTitle}>
                    {`Recovering ${discs.length} disc${discs.length > 1 ? 's' : ''}:`}
                  </Text>
                  {discs.length === 1 && (
                  <>
                    <View style={styles.singleDiscDetails}>
                      <Text testID="disc-model" style={styles.discModel}>
                        {discs[0].model}
                      </Text>
                      <Text testID="disc-brand" style={styles.discBrand}>
                        {discs[0].brand}
                      </Text>
                    </View>
                    {discs[0].speed !== undefined && discs[0].glide !== undefined
                     && discs[0].turn !== undefined && discs[0].fade !== undefined && (
                       <View style={styles.flightNumbers} testID="flight-numbers-section">
                         <View
                           style={[styles.flightNumber, styles.speedNumber]}
                           testID="speed-badge"
                           accessibilityLabel={`Speed ${formatNumberForScreenReader(discs[0].speed)}, affects overall disc speed`}
                         >
                           <Text style={styles.flightLabel}>S</Text>
                           <Text style={styles.flightNumberText}>{discs[0].speed}</Text>
                         </View>
                         <View
                           style={[styles.flightNumber, styles.glideNumber]}
                           testID="glide-badge"
                           accessibilityLabel={`Glide ${formatNumberForScreenReader(discs[0].glide)}, affects how disc maintains lift`}
                         >
                           <Text style={styles.flightLabel}>G</Text>
                           <Text style={styles.flightNumberText}>{discs[0].glide}</Text>
                         </View>
                         <View
                           style={[styles.flightNumber, styles.turnNumber]}
                           testID="turn-badge"
                           accessibilityLabel={`Turn ${formatNumberForScreenReader(discs[0].turn)}, affects left to right movement in flight`}
                         >
                           <Text style={styles.flightLabel}>T</Text>
                           <Text style={styles.flightNumberText}>{discs[0].turn}</Text>
                         </View>
                         <View
                           style={[styles.flightNumber, styles.fadeNumber]}
                           testID="fade-badge"
                           accessibilityLabel={`Fade ${formatNumberForScreenReader(discs[0].fade)}, affects end of flight hook`}
                         >
                           <Text style={styles.flightLabel}>F</Text>
                           <Text style={styles.flightNumberText}>{discs[0].fade}</Text>
                         </View>
                       </View>
                    )}
                  </>
                  )}
                  {discs.length > 1 && (
                  <View
                    testID="multi-disc-grid"
                    accessibilityLabel={generateMultiDiscAccessibilityLabel()}
                    accessibilityRole="text"
                  >
                    <FlatList
                      data={discs.slice(0, 6)}
                      numColumns={3}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View style={styles.discCard} testID={`disc-card-${item.id}`}>
                          <Text style={styles.cardModel} testID={`card-model-${item.id}`}>
                            {item.model}
                          </Text>
                          <Text style={styles.cardBrand} testID={`card-brand-${item.id}`}>
                            {item.brand}
                          </Text>
                        </View>
                      )}
                      contentContainerStyle={styles.gridContainer}
                      scrollEnabled={false}
                    />
                    {discs.length > 6 && (
                      <View style={styles.moreDiscsIndicator} testID="more-discs-indicator">
                        <Text style={styles.moreDiscsText}>
                          +
                          {discs.length - 6}
                          {' '}
                          more
                        </Text>
                      </View>
                    )}
                  </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Skeleton Bag Selection Loading */}
            {isLoadingBags && (
              <View style={styles.skeletonLoadingSection} testID="skeleton-loading-section">
                {[0, 1, 2, 3].map((index) => renderSkeletonBagItem(index))}
              </View>
            )}

            {/* Enhanced Error State */}
            {!isLoadingBags && loadError && (
              <Animated.View
                style={[
                  styles.errorSection,
                  {
                    opacity: errorSectionOpacity,
                    transform: [{ translateY: errorSectionTranslateY }],
                  },
                ]}
                testID="animated-error-section"
              >
                <Icon
                  name={getErrorContent(errorType).icon}
                  size={64}
                  color={colors.error}
                  style={styles.errorIcon}
                  testID="contextual-error-icon"
                />
                <Text style={styles.errorTitle}>{getErrorContent(errorType).title}</Text>
                <Text style={styles.errorMessage}>
                  {getErrorContent(errorType).message}
                </Text>
                <TouchableOpacity
                  style={styles.enhancedRetryButton}
                  onPress={handleRetry}
                  testID="enhanced-retry-button"
                >
                  <Text style={styles.enhancedRetryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Bag Selection Interface */}
            {!isLoadingBags && !loadError && bags.length > 0 && (
              <Animated.View
                style={[
                  styles.bagSelectionSection,
                  {
                    opacity: bagSectionOpacity,
                    transform: [{ translateY: bagSectionTranslateY }],
                  },
                ]}
                testID="animated-bag-selection-section"
              >
                <Text style={styles.bagSelectionTitle}>
                  Choose bag to recover to:
                </Text>
                <ScrollView
                  style={styles.bagListScroll}
                  contentContainerStyle={styles.bagListContent}
                  showsVerticalScrollIndicator
                  testID="bag-list-scroll"
                >
                  {bags.map((bag) => (
                    <Animated.View
                      key={bag.id}
                      style={{
                        transform: bagScaleValues[bag.id]
                          ? [{ scale: bagScaleValues[bag.id] }]
                          : [{ scale: 1 }],
                      }}
                      testID={`animated-bag-item-${bag.id}`}
                    >
                      <TouchableOpacity
                        style={[
                          styles.bagItem,
                          selectedBagId === bag.id && styles.bagItemSelected,
                        ]}
                        onPress={() => handleBagSelection(bag.id)}
                        testID={`bag-item-${bag.id}`}
                        accessibilityLabel={generateBagAccessibilityLabel(bag)}
                        accessibilityRole="button"
                        accessibilityHint="Tap to select as destination for disc recovery"
                        accessibilityState={{ selected: selectedBagId === bag.id }}
                      >
                        <View style={styles.bagItemContent}>
                          <Icon
                            name="bag-outline"
                            size={24}
                            color={selectedBagId === bag.id ? colors.primary : colors.textLight}
                            style={styles.bagItemIcon}
                          />
                          <View style={styles.bagItemText}>
                            <Text style={styles.bagName}>{bag.name}</Text>
                            {bag.description && (
                            <Text style={styles.bagDescription}>{bag.description}</Text>
                            )}
                            {bag.disc_count !== undefined && (
                            <Text style={styles.bagDiscCount}>
                              {bag.disc_count}
                              {' '}
                              discs
                            </Text>
                            )}
                          </View>
                          <View style={styles.selectionIndicator} testID={`selection-indicator-${bag.id}`}>
                            <Animated.View
                              style={[
                                styles.checkmarkContainer,
                                selectedBagId === bag.id && styles.checkmarkContainerSelected,
                                bagSelectionAnimations[bag.id] && {
                                  transform: [{
                                    scale: bagSelectionAnimations[bag.id]
                                      ? bagSelectionAnimations[bag.id].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.1],
                                      }) : 1,
                                  }],
                                },
                              ]}
                            >
                              {selectedBagId === bag.id && (
                                <Icon name="checkmark-circle" size={24} color={colors.primary} />
                              )}
                              {selectedBagId !== bag.id && (
                                <Icon name="ellipse-outline" size={24} color={colors.border} />
                              )}
                            </Animated.View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Empty State - No Bags Available */}
            {!isLoadingBags && !loadError && bags.length === 0 && (
              <View style={styles.emptyStateSection}>
                <Icon name="bag-outline" size={64} color={colors.textSecondary} style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateTitle}>No bags available</Text>
                <Text style={styles.emptyStateMessage}>
                  Create your first bag to recover discs.
                </Text>
              </View>
            )}

          </View>

          {/* Modal Actions */}
          {!isLoadingBags && !loadError && bags.length > 0 && (
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={styles.buttonFlex}
              />
              <Button
                title={getRecoverButtonText()}
                variant="primary"
                onPress={handleRecover}
                disabled={!selectedBagId || isRecovering}
                style={styles.buttonFlex}
                testID="recover-button"
                accessibilityLabel={generateRecoverButtonAccessibilityLabel()}
                accessibilityHint={
                  selectedBagId
                    ? `Moves the selected discs from lost items back into ${
                      bags.find((b) => b.id === selectedBagId)?.name || 'selected bag'
                    }`
                    : 'Select a destination bag first'
                }
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

RecoverDiscModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  discs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
  })).isRequired,
  targetBagId: PropTypes.string,
};

RecoverDiscModal.defaultProps = {
  targetBagId: null,
};

export default RecoverDiscModal;
