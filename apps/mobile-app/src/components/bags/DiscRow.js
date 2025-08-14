/**
 * DiscRow Component
 * Displays a single disc in a bag with flight numbers
 * Following CreateBagScreen design patterns with professional polish
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
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Card from '../../design-system/components/Card';
import ColorIndicator from '../../design-system/components/ColorIndicator';
import FlightPathVisualization from './FlightPathVisualization';

function DiscRow({ disc }) {
  const colors = useThemeColors();
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallDevice = screenWidth < 375;

  const styles = StyleSheet.create({
    discCard: {
      marginBottom: spacing.xs,
    },
    discContent: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'stretch',
      minHeight: 80,
    },
    leftContent: {
      flex: 1,
      marginRight: spacing.sm,
      justifyContent: 'space-between',
    },
    rightContent: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 75,
    },
    discHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    colorCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.xs,
      backgroundColor: colors.textLight, // default color if no disc color
      borderWidth: 1,
      borderColor: colors.border,
    },
    discNameBrandContainer: {
      flex: 1,
    },
    discName: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      fontSize: isSmallDevice ? 17 : 19,
      marginBottom: 1,
    },
    discBrand: {
      ...typography.body2,
      color: colors.textLight,
      fontWeight: '500',
      fontSize: isSmallDevice ? 13 : 15,
      fontStyle: 'italic',
    },
    flightNumbers: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center',
    },
    flightNumber: {
      width: isSmallDevice ? 38 : 42,
      height: isSmallDevice ? 38 : 42,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
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
      fontSize: isSmallDevice ? 10 : 11,
      lineHeight: 11,
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
      fontSize: isSmallDevice ? 15 : 17,
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
      marginTop: 3,
      paddingTop: 3,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    colorIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.xs,
      backgroundColor: colors.textLight,
    },
    customText: {
      ...typography.caption,
      color: colors.textLight,
      flex: 1,
    },
  });

  // Use custom values if provided, otherwise fall back to disc_master values
  const displayDisc = {
    model: disc.model || disc.disc_master?.model || 'Unknown Disc',
    brand: disc.brand || disc.disc_master?.brand || 'Unknown Brand',
    speed: disc.speed || disc.disc_master?.speed || 0,
    glide: disc.glide || disc.disc_master?.glide || 0,
    turn: disc.turn || disc.disc_master?.turn || 0,
    fade: disc.fade || disc.disc_master?.fade || 0,
  };

  // Enhanced color checking with disc_master fallback
  const discColor = disc.color || disc.disc_master?.color;
  const hasValidColor = discColor && discColor.trim() !== '';

  return (
    <View style={styles.discCard}>
      <Card>
        <View style={styles.discContent}>
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

            {(hasValidColor || disc.weight || disc.condition) && (
              <View style={styles.customInfo}>
                {hasValidColor && (
                  <ColorIndicator
                    color={discColor}
                    shape="bar"
                    width={35}
                    height={12}
                    accessibilityLabel={`Disc color: ${discColor}`}
                  />
                )}
                <Text style={styles.customText}>
                  {[disc.weight && `${disc.weight}g`, disc.condition]
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
              width={isSmallDevice ? 65 : 75}
              height={isSmallDevice ? 90 : 100}
            />
          </View>
        </View>
      </Card>
    </View>
  );
}

DiscRow.propTypes = {
  disc: PropTypes.shape({
    id: PropTypes.string,
    model: PropTypes.string,
    brand: PropTypes.string,
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
    color: PropTypes.string,
    weight: PropTypes.string,
    condition: PropTypes.string,
    disc_master: PropTypes.shape({
      model: PropTypes.string,
      brand: PropTypes.string,
      speed: PropTypes.number,
      glide: PropTypes.number,
      turn: PropTypes.number,
      fade: PropTypes.number,
      color: PropTypes.string,
    }),
  }).isRequired,
};

DiscRow.displayName = 'DiscRow';

export default memo(DiscRow);
