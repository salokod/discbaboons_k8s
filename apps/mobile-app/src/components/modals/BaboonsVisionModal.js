/**
 * BaboonsVisionModal Component
 * Modal that displays scatter plot visualization of disc flight characteristics
 */

import { memo, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function BaboonsVisionModal({ bag }) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Chart dimensions - full screen with minimal padding, more vertical space
  const chartDimensions = useMemo(() => {
    const chartWidth = screenWidth - spacing.md;
    const chartHeight = screenHeight * 0.85;
    const padding = 25; // Reduced padding for more chart space
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 2;
    return {
      chartWidth, chartHeight, padding, plotWidth, plotHeight,
    };
  }, [screenWidth, screenHeight]);

  const {
    chartWidth, chartHeight, padding, plotWidth, plotHeight,
  } = chartDimensions;

  // Function to get label dimensions and truncate text if needed
  const getLabelDimensions = (text) => {
    // Handle empty or invalid text
    if (!text || text.trim() === '') {
      return { width: 70, fontSize: 9, displayText: '' };
    }

    let displayText = text;
    let fontSize = 9;
    const width = 70; // Smaller fixed width to prevent overlaps

    // Truncate very long text first
    if (text.length > 10) {
      displayText = `${text.substring(0, 8)}...`;
      fontSize = 7;
    } else if (text.length > 7) {
      fontSize = 7;
    } else if (text.length > 4) {
      fontSize = 8;
    } else {
      fontSize = 10; // Bigger for short names
    }

    return { width, fontSize, displayText };
  };

  // Dynamic styles that depend on calculations
  const dynamicStyles = useMemo(() => StyleSheet.create({
    backgroundLogo: {
      position: 'absolute',
      width: Math.min(plotWidth, plotHeight) * 1.0,
      height: Math.min(plotWidth, plotHeight) * 1.0,
      left: chartWidth / 2 - (Math.min(plotWidth, plotHeight) * 0.5),
      top: chartHeight / 2 - (Math.min(plotWidth, plotHeight) * 0.5),
      opacity: 0.05,
      resizeMode: 'contain',
    },
    scrollViewContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    popupOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    popupBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      maxHeight: '70%',
    },
    dragHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    popupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    popupHeaderTextContainer: {
      flex: 1,
    },
    popupTitle: {
      ...typography.h2,
      color: colors.text,
      fontWeight: '700',
    },
    popupSubtitle: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: 2,
    },
    popupCloseButton: {
      padding: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    popupScrollContent: {
      paddingBottom: spacing.md,
    },
    discCard: {
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    discCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    discCardTextContainer: {
      flex: 1,
    },
    discCardTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
    },
    discCardBrand: {
      ...typography.caption,
      color: colors.textLight,
      fontStyle: 'italic',
      fontSize: 12,
    },
    discColorIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    flightNumbersContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    flightNumberBox: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderRadius: 8,
      borderWidth: 1,
    },
    speedBox: {
      backgroundColor: `${colors.error}15`,
      borderColor: colors.error,
    },
    glideBox: {
      backgroundColor: `${colors.primary}15`,
      borderColor: colors.primary,
    },
    turnBox: {
      backgroundColor: `${colors.warning}15`,
      borderColor: colors.warning,
    },
    fadeBox: {
      backgroundColor: `${colors.success}15`,
      borderColor: colors.success,
    },
    flightNumberLabel: {
      ...typography.caption,
      fontSize: 10,
    },
    speedLabel: {
      color: colors.error,
    },
    glideLabel: {
      color: colors.primary,
    },
    turnLabel: {
      color: colors.warning,
    },
    fadeLabel: {
      color: colors.success,
    },
    flightNumberValue: {
      ...typography.bodyBold,
    },
    speedValue: {
      color: colors.error,
    },
    glideValue: {
      color: colors.primary,
    },
    turnValue: {
      color: colors.warning,
    },
    fadeValue: {
      color: colors.success,
    },
    gridLineOpacity: {
      opacity: 0.2,
    },
    speedAxisLabel: {
      left: 10,
      fontSize: 11,
      fontWeight: '400',
      opacity: 0.4,
    },
    stabilityAxisLabel: {
      bottom: 20,
      fontSize: 11,
      fontWeight: '400',
      opacity: 0.4,
    },
    stabilityAxisLabelZero: {
      bottom: 20,
      fontSize: 11,
      fontWeight: '600',
      opacity: 0.6,
    },
  }), [colors, chartWidth, chartHeight, plotWidth, plotHeight]);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.select({
        ios: spacing.xl * 2,
        android: spacing.xl,
      }),
      paddingBottom: spacing.md,
    },
    modalTitle: {
      ...typography.h1,
      color: colors.text,
      fontWeight: '700',
      fontSize: 24,
    },
    closeButton: {
      padding: spacing.sm,
      borderRadius: Platform.select({
        ios: 20,
        android: 24,
      }),
      backgroundColor: colors.primary,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.md,
      paddingTop: spacing.xs,
    },
    triggerButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    triggerText: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
      fontSize: 11,
    },
    chartContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.sm,
    },
    chart: {
      width: chartWidth,
      height: chartHeight,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 16,
        android: 20,
      }),
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
      overflow: 'hidden',
    },
    axisContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    yAxis: {
      position: 'absolute',
      left: padding - 1,
      top: padding,
      width: 1,
      height: plotHeight,
      backgroundColor: colors.textLight,
      opacity: 0.3,
    },
    xAxis: {
      position: 'absolute',
      left: padding,
      bottom: padding - 1,
      width: plotWidth,
      height: 1,
      backgroundColor: colors.textLight,
      opacity: 0.3,
    },
    axisLabel: {
      position: 'absolute',
      ...typography.caption,
      color: colors.textLight,
      fontSize: 10,
    },
    yAxisLabel: {
      left: -30,
      top: chartHeight / 2 - 20,
      transform: [{ rotate: '-90deg' }],
      transformOrigin: 'center',
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    xAxisLabel: {
      bottom: 10,
      left: chartWidth / 2 - 50,
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    gridLine: {
      position: 'absolute',
      backgroundColor: colors.border,
      opacity: 0.3,
    },
    verticalGridLine: {
      width: 1,
      height: plotHeight,
      top: padding,
    },
    horizontalGridLine: {
      height: 1,
      width: plotWidth,
      left: padding,
    },
    dataPoint: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    multipleDiscsIndicator: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.surface,
    },
    discLabel: {
      position: 'absolute',
      ...typography.caption,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '600',
      backgroundColor: colors.surface,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      overflow: 'hidden',
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    legendColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    legendText: {
      ...typography.body,
      color: colors.textLight,
      fontSize: 12,
      fontWeight: '500',
    },
  });

  // Process bag data for scatter plot
  const processDiscData = () => {
    const discs = bag?.bag_contents || [];
    const dataPoints = new Map();

    discs.forEach((disc) => {
      const speed = disc.speed || disc.disc_master?.speed || 0;
      const turn = disc.turn || disc.disc_master?.turn || 0;
      const fade = disc.fade || disc.disc_master?.fade || 0;
      const glide = disc.glide || disc.disc_master?.glide || 0;
      // Stability calculation: turn + fade
      // Leopard: 7|6|-2|1 = -2 + 1 = -1 (left side/understable)
      // Mamba: 13|6|-5|1 = -5 + 1 = -4 (far left/very understable)
      let stability = turn + fade;

      // Round up 0.5 increments
      if (stability % 1 === 0.5) {
        stability = Math.ceil(stability);
      }

      const key = `${speed}-${stability}`;

      if (!dataPoints.has(key)) {
        dataPoints.set(key, {
          speed,
          stability,
          discs: [],
          x: padding + ((6 - stability) / 11) * plotWidth, // Map -5 to +6 range, negatives on right
          y: padding + ((15 - speed) / 15) * plotHeight, // Map 0-15 range to plot height (inverted)
        });
      }

      dataPoints.get(key).discs.push({
        model: disc.model || disc.disc_master?.model || 'Unknown',
        brand: disc.brand || disc.disc_master?.brand || 'Unknown',
        color: disc.color || 'gray',
        speed,
        glide,
        turn,
        fade,
      });
    });

    const points = Array.from(dataPoints.values());

    // Enhanced collision detection with radial positioning
    // Sort by number of discs (fewer discs get positioned first)
    points.sort((a, b) => a.discs.length - b.discs.length);

    // Smart positioning: Start with directly under, adjust if overlapping
    const LABEL_HEIGHT = 16;
    const LABEL_SPACING = 4; // Minimum gap between labels
    const occupiedZones = [];

    const labeledPoints = points.map((point) => {
      const text = point.discs.length > 1
        ? `${point.discs.length} discs`
        : point.discs[0]?.model || '';
      const { width: labelWidth } = getLabelDimensions(text);

      // Start with directly below the dot
      const bestOffsetX = 0;
      let bestOffsetY = 22;

      // Check if this position overlaps with existing labels
      const labelBounds = {
        left: point.x + bestOffsetX - labelWidth / 2,
        right: point.x + bestOffsetX + labelWidth / 2,
        top: point.y + bestOffsetY - LABEL_HEIGHT / 2,
        bottom: point.y + bestOffsetY + LABEL_HEIGHT / 2,
      };

      // Check against all existing labels for collision
      for (let i = 0; i < occupiedZones.length; i += 1) {
        const zone = occupiedZones[i];
        const xOverlap = Math.max(
          0,
          Math.min(labelBounds.right, zone.right) - Math.max(labelBounds.left, zone.left),
        );
        const yOverlap = Math.max(
          0,
          Math.min(labelBounds.bottom, zone.bottom) - Math.max(labelBounds.top, zone.top),
        );

        // If overlapping, move label above the dot
        if (xOverlap > LABEL_SPACING && yOverlap > LABEL_SPACING) {
          bestOffsetY = -18; // Move above dot
          break;
        }
      }

      // Add this label's final bounds to occupied zones
      occupiedZones.push({
        left: point.x + bestOffsetX - labelWidth / 2,
        right: point.x + bestOffsetX + labelWidth / 2,
        top: point.y + bestOffsetY - LABEL_HEIGHT / 2,
        bottom: point.y + bestOffsetY + LABEL_HEIGHT / 2,
      });

      // Return point with label offsets
      return {
        ...point,
        labelOffsetX: bestOffsetX,
        labelOffsetY: bestOffsetY,
      };
    });

    return labeledPoints;
  };

  // Color mapping for disc colors
  const getDiscColor = (colorName) => {
    const colorMap = {
      red: '#FF4444',
      orange: '#FF8800',
      yellow: '#FFD700',
      green: '#44BB44',
      blue: '#4444FF',
      purple: '#8844FF',
      pink: '#FF44BB',
      white: '#FFFFFF',
      black: '#333333',
      clear: '#E0E0E0',
      gray: '#888888',
    };
    return colorMap[colorName] || colors.primary;
  };

  const dataPoints = processDiscData();

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity style={styles.triggerButton} onPress={openModal}>
        <Icon name="stats-chart-outline" size={16} color={colors.primary} />
        <Text style={styles.triggerText}>Baboon Vision</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Baboon Vision</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Icon name="close" size={24} color={colors.surface} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={dynamicStyles.scrollViewContent}
            >

              <View style={styles.chartContainer}>
                <View style={styles.chart}>
                  {/* Background Logo */}
                  <Image
                    source={require('../../../discbaboon_logo_blue.png')}
                    style={dynamicStyles.backgroundLogo}
                  />

                  {/* Axes */}
                  <View style={styles.axisContainer}>
                    {/* Remove the main axes, we'll just use the T-grid */}

                    {/* Axis Labels */}
                    <Text style={[styles.axisLabel, styles.yAxisLabel]}>
                      SPEED
                    </Text>

                    {/* Grid lines and labels */}
                    {/* Main inverted T grid lines */}
                    {/* Vertical line at 0 stability */}
                    <View
                      style={[
                        styles.gridLine,
                        styles.verticalGridLine,
                        dynamicStyles.gridLineOpacity,
                        {
                          left: padding + ((6 - 0) / 11) * plotWidth,
                        },
                      ]}
                    />
                    {/* Horizontal line at 0 speed (bottom) */}
                    <View
                      style={[
                        styles.gridLine,
                        styles.horizontalGridLine,
                        dynamicStyles.gridLineOpacity,
                        {
                          bottom: padding,
                        },
                      ]}
                    />

                    {/* Y-axis labels (Speed) */}
                    {[1, 3, 5, 7, 9, 11, 13, 15].map((speed) => (
                      <Text
                        key={`speed-label-${speed}`}
                        style={[
                          styles.axisLabel,
                          dynamicStyles.speedAxisLabel,
                          {
                            bottom: padding + ((speed) / 15) * plotHeight - 8,
                            color: colors.textLight,
                          },
                        ]}
                      >
                        {speed}
                      </Text>
                    ))}

                    {/* X-axis labels (Stability) - Flipped so negative is on right */}
                    {/* real market range */}
                    {[6, 4, 2, 0, -2, -4, -5].map((stability) => (
                      <Text
                        key={`stability-label-${stability}`}
                        style={[
                          styles.axisLabel,
                          stability === 0
                            ? dynamicStyles.stabilityAxisLabelZero
                            : dynamicStyles.stabilityAxisLabel,
                          {
                            left: padding + ((6 - stability) / 11) * plotWidth - 10,
                            color: stability === 0 ? colors.primary : colors.textLight,
                          },
                        ]}
                      >
                        {stability}
                      </Text>
                    ))}

                    {/* Data Points */}
                    {dataPoints.map((point) => (
                      <TouchableOpacity
                        key={`point-${point.speed}-${point.stability}`}
                        style={[
                          styles.dataPoint,
                          {
                            left: Math.max(
                              padding,
                              Math.min(padding + plotWidth - 10, point.x - 10),
                            ),
                            top: Math.max(
                              padding,
                              Math.min(padding + plotHeight - 10, point.y - 10),
                            ),
                            backgroundColor: getDiscColor(point.discs[0]?.color),
                          },
                        ]}
                        onPress={() => setSelectedPoint(point)}
                      >
                        {point.discs.length > 1 && (
                          <View style={styles.multipleDiscsIndicator} />
                        )}
                      </TouchableOpacity>
                    ))}

                    {/* Data Point Labels - Smart positioning with truncation */}
                    {dataPoints.map((point) => {
                      const text = point.discs.length > 1
                        ? `${point.discs.length} discs`
                        : point.discs[0]?.model || '';

                      const {
                        width: labelWidth,
                        fontSize,
                        displayText,
                      } = getLabelDimensions(text);

                      // Don't render empty labels
                      if (!displayText || displayText.trim() === '') {
                        return null;
                      }

                      return (
                        <Text
                          key={`label-${point.speed}-${point.stability}`}
                          style={[
                            styles.discLabel,
                            {
                              left: point.x + (point.labelOffsetX || 0) - (labelWidth / 2),
                              top: point.y + (point.labelOffsetY || 22),
                              width: labelWidth,
                              fontSize,
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {displayText}
                        </Text>
                      );
                    })}
                  </View>
                </View>

              </View>
            </ScrollView>

            {/* Selected Point Popup - Slides from bottom */}
            {selectedPoint && (
              <View style={dynamicStyles.popupOverlay}>
                {/* Backdrop */}
                <TouchableOpacity
                  style={dynamicStyles.popupBackdrop}
                  onPress={() => setSelectedPoint(null)}
                />

                {/* Bottom Sheet */}
                <View style={dynamicStyles.bottomSheet}>
                  {/* Drag Handle */}
                  <View style={dynamicStyles.dragHandle} />

                  {/* Header */}
                  <View style={dynamicStyles.popupHeader}>
                    <View style={dynamicStyles.popupHeaderTextContainer}>
                      <Text style={dynamicStyles.popupTitle}>
                        {selectedPoint.discs.length}
                        {' '}
                        Disc
                        {selectedPoint.discs.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={dynamicStyles.popupSubtitle}>
                        Speed
                        {' '}
                        {selectedPoint.speed}
                        {' '}
                        • Stability
                        {' '}
                        {selectedPoint.stability}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={dynamicStyles.popupCloseButton}
                      onPress={() => setSelectedPoint(null)}
                    >
                      <Icon name="close" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={dynamicStyles.popupScrollContent}
                  >
                    {selectedPoint.discs.map((disc) => (
                      <View
                        key={`${disc.model}-${disc.brand}-${disc.speed}-${disc.glide}-${disc.turn}-${disc.fade}-${disc.color || 'nocolor'}`}
                        style={dynamicStyles.discCard}
                      >
                        {/* Disc Header - Model and Brand */}
                        <View style={dynamicStyles.discCardHeader}>
                          <View style={dynamicStyles.discCardTextContainer}>
                            <Text style={dynamicStyles.discCardTitle}>
                              {disc.model}
                            </Text>
                            <Text style={dynamicStyles.discCardBrand}>
                              {disc.brand}
                            </Text>
                          </View>
                          {disc.color && (
                            <View style={[
                              dynamicStyles.discColorIndicator,
                              { backgroundColor: getDiscColor(disc.color) },
                            ]}
                            />
                          )}
                        </View>

                        {/* Flight Numbers */}
                        <View style={dynamicStyles.flightNumbersContainer}>
                          <View style={[
                            dynamicStyles.flightNumberBox,
                            dynamicStyles.speedBox,
                          ]}
                          >
                            <Text style={[
                              dynamicStyles.flightNumberLabel,
                              dynamicStyles.speedLabel,
                            ]}
                            >
                              SPEED
                            </Text>
                            <Text style={[
                              dynamicStyles.flightNumberValue,
                              dynamicStyles.speedValue,
                            ]}
                            >
                              {disc.speed}
                            </Text>
                          </View>
                          <View style={[
                            dynamicStyles.flightNumberBox,
                            dynamicStyles.glideBox,
                          ]}
                          >
                            <Text style={[
                              dynamicStyles.flightNumberLabel,
                              dynamicStyles.glideLabel,
                            ]}
                            >
                              GLIDE
                            </Text>
                            <Text style={[
                              dynamicStyles.flightNumberValue,
                              dynamicStyles.glideValue,
                            ]}
                            >
                              {disc.glide || 0}
                            </Text>
                          </View>
                          <View style={[
                            dynamicStyles.flightNumberBox,
                            dynamicStyles.turnBox,
                          ]}
                          >
                            <Text style={[
                              dynamicStyles.flightNumberLabel,
                              dynamicStyles.turnLabel,
                            ]}
                            >
                              TURN
                            </Text>
                            <Text style={[
                              dynamicStyles.flightNumberValue,
                              dynamicStyles.turnValue,
                            ]}
                            >
                              {disc.turn}
                            </Text>
                          </View>
                          <View style={[
                            dynamicStyles.flightNumberBox,
                            dynamicStyles.fadeBox,
                          ]}
                          >
                            <Text style={[
                              dynamicStyles.flightNumberLabel,
                              dynamicStyles.fadeLabel,
                            ]}
                            >
                              FADE
                            </Text>
                            <Text style={[
                              dynamicStyles.flightNumberValue,
                              dynamicStyles.fadeValue,
                            ]}
                            >
                              {disc.fade}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

BaboonsVisionModal.propTypes = {
  bag: PropTypes.shape({
    bag_contents: PropTypes.arrayOf(
      PropTypes.shape({
        speed: PropTypes.number,
        glide: PropTypes.number,
        turn: PropTypes.number,
        fade: PropTypes.number,
        model: PropTypes.string,
        brand: PropTypes.string,
        color: PropTypes.string,
        disc_master: PropTypes.shape({
          speed: PropTypes.number,
          glide: PropTypes.number,
          turn: PropTypes.number,
          fade: PropTypes.number,
          model: PropTypes.string,
          brand: PropTypes.string,
        }),
      }),
    ),
  }),
};

BaboonsVisionModal.defaultProps = {
  bag: { bag_contents: [] },
};

export default memo(BaboonsVisionModal);
