/**
 * DiscCard Component
 * Reusable disc display with flight path visualization
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import Card from '../design-system/components/Card';
import FlightPathVisualization from './bags/FlightPathVisualization';

function DiscCard({ disc, showCustomInfo = true, style }) {
  const colors = useThemeColors();
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallDevice = screenWidth < 375;

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    content: {
      flexDirection: 'row',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'stretch',
      minHeight: 120,
    },
    leftContent: {
      flex: 1,
      marginRight: spacing.lg,
      justifyContent: 'space-between',
    },
    rightContent: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
    },
    discHeader: {
      marginBottom: spacing.sm,
    },
    discNameBrandContainer: {
      flex: 1,
    },
    discName: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      fontSize: isSmallDevice ? 16 : 18,
      marginBottom: 2,
    },
    discBrand: {
      ...typography.body2,
      color: colors.textLight,
      fontWeight: '500',
      fontSize: isSmallDevice ? 12 : 14,
      fontStyle: 'italic',
    },
    flightNumbers: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    flightNumber: {
      width: isSmallDevice ? 36 : 40,
      height: isSmallDevice ? 36 : 40,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
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
      fontSize: isSmallDevice ? 9 : 10,
      lineHeight: 10,
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
    flightNumberText: {
      ...typography.body,
      fontWeight: '800',
      fontSize: isSmallDevice ? 14 : 16,
      lineHeight: 18,
    },
    speedText: {
      color: colors.error,
    },
    glideText: {
      color: colors.primary,
    },
    turnText: {
      color: colors.warning,
    },
    fadeText: {
      color: colors.success,
    },
    customInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    customText: {
      ...typography.caption,
      color: colors.textLight,
      flex: 1,
    },
  });

  // Use provided values or defaults
  const displayDisc = {
    model: disc?.model || 'Unknown Disc',
    brand: disc?.brand || 'Unknown Brand',
    speed: disc?.speed || 0,
    glide: disc?.glide || 0,
    turn: disc?.turn || 0,
    fade: disc?.fade || 0,
    color: disc?.color,
    weight: disc?.weight,
    condition: disc?.condition,
  };

  return (
    <View style={[styles.container, style]}>
      <Card>
        <View style={styles.content}>
          {/* Left Content - Disc Info */}
          <View style={styles.leftContent}>
            <View style={styles.discHeader}>
              <View style={styles.discNameBrandContainer}>
                <Text style={styles.discName}>{displayDisc.model}</Text>
                <Text style={styles.discBrand}>{displayDisc.brand}</Text>
              </View>
            </View>

            <View style={styles.flightNumbers}>
              <View style={[styles.flightNumber, styles.speedNumber]}>
                <Text style={[styles.flightLabel, styles.speedLabel]}>S</Text>
                <Text style={[styles.flightNumberText, styles.speedText]}>
                  {displayDisc.speed}
                </Text>
              </View>
              <View style={[styles.flightNumber, styles.glideNumber]}>
                <Text style={[styles.flightLabel, styles.glideLabel]}>G</Text>
                <Text style={[styles.flightNumberText, styles.glideText]}>
                  {displayDisc.glide}
                </Text>
              </View>
              <View style={[styles.flightNumber, styles.turnNumber]}>
                <Text style={[styles.flightLabel, styles.turnLabel]}>T</Text>
                <Text style={[styles.flightNumberText, styles.turnText]}>
                  {displayDisc.turn}
                </Text>
              </View>
              <View style={[styles.flightNumber, styles.fadeNumber]}>
                <Text style={[styles.flightLabel, styles.fadeLabel]}>F</Text>
                <Text style={[styles.flightNumberText, styles.fadeText]}>
                  {displayDisc.fade}
                </Text>
              </View>
            </View>

            {showCustomInfo
            && (displayDisc.color || displayDisc.weight || displayDisc.condition) && (
              <View style={styles.customInfo}>
                <Text style={styles.customText}>
                  {[displayDisc.color, displayDisc.weight && `${displayDisc.weight}g`, displayDisc.condition]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              </View>
            )}
          </View>

          {/* Right Content - Flight Path Visualization */}
          <View style={styles.rightContent}>
            <FlightPathVisualization
              speed={displayDisc.speed}
              glide={displayDisc.glide}
              turn={displayDisc.turn}
              fade={displayDisc.fade}
              width={isSmallDevice ? 70 : 80}
              height={isSmallDevice ? 90 : 100}
              compact
            />
          </View>
        </View>
      </Card>
    </View>
  );
}

DiscCard.propTypes = {
  disc: PropTypes.shape({
    model: PropTypes.string,
    brand: PropTypes.string,
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
  }),
};

DiscCard.defaultProps = {
  disc: {
    model: 'Unknown',
    brand: 'Unknown',
    speed: 0,
    glide: 0,
    turn: 0,
    fade: 0,
  },
};

export default memo(DiscCard);
