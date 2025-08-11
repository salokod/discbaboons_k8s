/**
 * BaboonsVisionModal Component
 * Modal that displays scatter plot visualization of disc flight characteristics
 */

import { memo, useState } from 'react';
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
  const chartWidth = screenWidth - spacing.md;
  const chartHeight = screenHeight * 0.85;
  const padding = 25; // Reduced padding for more chart space
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

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
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            >

              <View style={styles.chartContainer}>
                <View style={styles.chart}>
                  {/* Background Logo */}
                  <Image
                    source={require('../../../discbaboon_logo_blue.png')}
                    style={{
                      position: 'absolute',
                      width: Math.min(plotWidth, plotHeight) * 1.0,
                      height: Math.min(plotWidth, plotHeight) * 1.0,
                      left: chartWidth / 2 - (Math.min(plotWidth, plotHeight) * 0.5),
                      top: chartHeight / 2 - (Math.min(plotWidth, plotHeight) * 0.5),
                      opacity: 0.05,
                      resizeMode: 'contain',
                    }}
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
                        {
                          left: padding + ((6 - 0) / 11) * plotWidth,
                          opacity: 0.2,
                        },
                      ]}
                    />
                    {/* Horizontal line at 0 speed (bottom) */}
                    <View
                      style={[
                        styles.gridLine,
                        styles.horizontalGridLine,
                        {
                          bottom: padding,
                          opacity: 0.2,
                        },
                      ]}
                    />

                    {/* Y-axis labels (Speed) */}
                    {[1, 3, 5, 7, 9, 11, 13, 15].map((speed) => (
                      <Text
                        key={`speed-label-${speed}`}
                        style={[
                          styles.axisLabel,
                          {
                            left: 10,
                            bottom: padding + ((speed) / 15) * plotHeight - 8,
                            fontSize: 11,
                            fontWeight: '400',
                            color: colors.textLight,
                            opacity: 0.4,
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
                          {
                            left: padding + ((6 - stability) / 11) * plotWidth - 10,
                            bottom: 20,
                            fontSize: 11,
                            fontWeight: stability === 0 ? '600' : '400',
                            color: stability === 0 ? colors.primary : colors.textLight,
                            opacity: stability === 0 ? 0.6 : 0.4,
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
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                {/* Backdrop */}
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}
                  onPress={() => setSelectedPoint(null)}
                />

                {/* Bottom Sheet */}
                <View style={{
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
                }}
                >
                  {/* Drag Handle */}
                  <View style={{
                    alignSelf: 'center',
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    marginBottom: spacing.md,
                  }}
                  />

                  {/* Header */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.sm,
                    paddingBottom: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                  >
                    <View>
                      <Text style={{
                        ...typography.h2,
                        color: colors.text,
                        fontWeight: '700',
                      }}
                      >
                        {selectedPoint.discs.length}
                        {' '}
                        Disc
                        {selectedPoint.discs.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={{
                        ...typography.caption,
                        color: colors.textLight,
                        marginTop: 2,
                      }}
                      >
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
                      style={{
                        padding: spacing.sm,
                        backgroundColor: colors.surface,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                      onPress={() => setSelectedPoint(null)}
                    >
                      <Icon name="close" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: spacing.md }}
                  >
                    {selectedPoint.discs.map((disc) => (
                      <View
                        key={`${disc.model}-${disc.brand}-${disc.speed}-${disc.glide}-${disc.turn}-${disc.fade}-${disc.color || 'nocolor'}`}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: Platform.select({
                            ios: 12,
                            android: 16,
                          }),
                          padding: spacing.lg,
                          marginBottom: spacing.md,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        {/* Disc Header - Model and Brand */}
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: spacing.sm,
                        }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              ...typography.h3,
                              color: colors.text,
                              fontWeight: '700',
                              fontSize: 16,
                            }}
                            >
                              {disc.model}
                            </Text>
                            <Text style={{
                              ...typography.caption,
                              color: colors.textLight,
                              fontStyle: 'italic',
                              fontSize: 12,
                            }}
                            >
                              {disc.brand}
                            </Text>
                          </View>
                          {disc.color && (
                            <View style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: getDiscColor(disc.color),
                              borderWidth: 2,
                              borderColor: colors.surface,
                            }}
                            />
                          )}
                        </View>

                        {/* Flight Numbers */}
                        <View style={{
                          flexDirection: 'row',
                          gap: spacing.sm,
                          marginTop: spacing.xs,
                        }}
                        >
                          <View style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingVertical: spacing.xs,
                            backgroundColor: `${colors.error}15`,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.error,
                          }}
                          >
                            <Text
                              style={{
                                ...typography.caption,
                                color: colors.error,
                                fontSize: 10,
                              }}
                            >
                              SPEED
                            </Text>
                            <Text style={{ ...typography.bodyBold, color: colors.error }}>
                              {disc.speed}
                            </Text>
                          </View>
                          <View style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingVertical: spacing.xs,
                            backgroundColor: `${colors.primary}15`,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.primary,
                          }}
                          >
                            <Text
                              style={{
                                ...typography.caption,
                                color: colors.primary,
                                fontSize: 10,
                              }}
                            >
                              GLIDE
                            </Text>
                            <Text style={{ ...typography.bodyBold, color: colors.primary }}>
                              {disc.glide || 0}
                            </Text>
                          </View>
                          <View style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingVertical: spacing.xs,
                            backgroundColor: `${colors.warning}15`,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.warning,
                          }}
                          >
                            <Text
                              style={{
                                ...typography.caption,
                                color: colors.warning,
                                fontSize: 10,
                              }}
                            >
                              TURN
                            </Text>
                            <Text style={{ ...typography.bodyBold, color: colors.warning }}>
                              {disc.turn}
                            </Text>
                          </View>
                          <View style={{
                            flex: 1,
                            alignItems: 'center',
                            paddingVertical: spacing.xs,
                            backgroundColor: `${colors.success}15`,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.success,
                          }}
                          >
                            <Text
                              style={{
                                ...typography.caption,
                                color: colors.success,
                                fontSize: 10,
                              }}
                            >
                              FADE
                            </Text>
                            <Text style={{ ...typography.bodyBold, color: colors.success }}>
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
