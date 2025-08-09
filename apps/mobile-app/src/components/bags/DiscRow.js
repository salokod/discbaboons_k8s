/**
 * DiscRow Component
 * Displays a single disc in a bag with flight numbers
 * Following DiscSearchScreen's disc display pattern
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function DiscRow({ disc }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    discItem: {
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    discContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    discInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    discName: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    discBrand: {
      ...typography.body,
      color: colors.textLight,
    },
    flightNumbers: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    flightNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    speedNumber: {
      borderColor: colors.error,
    },
    glideNumber: {
      borderColor: colors.primary,
    },
    turnNumber: {
      borderColor: colors.warning,
    },
    fadeNumber: {
      borderColor: colors.success,
    },
    flightLabel: {
      ...typography.caption,
      color: colors.textLight,
      fontSize: 8,
      marginBottom: -2,
    },
    flightNumberText: {
      ...typography.bodyBold,
      color: colors.text,
      fontSize: 12,
    },
    customInfo: {
      marginTop: spacing.xs,
    },
    customText: {
      ...typography.caption,
      color: colors.textLight,
      fontStyle: 'italic',
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

  return (
    <View style={styles.discItem}>
      <View style={styles.discContent}>
        <View style={styles.discInfo}>
          <Text style={styles.discName}>{displayDisc.model}</Text>
          <Text style={styles.discBrand}>
            {displayDisc.brand}
          </Text>
          {disc.color && (
            <View style={styles.customInfo}>
              <Text style={styles.customText}>
                {disc.color}
                {disc.weight && ` • ${disc.weight}g`}
                {disc.condition && ` • ${disc.condition}`}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.flightNumbers}>
          <View style={[styles.flightNumber, styles.speedNumber]}>
            <Text style={styles.flightLabel}>S</Text>
            <Text style={styles.flightNumberText}>{displayDisc.speed}</Text>
          </View>
          <View style={[styles.flightNumber, styles.glideNumber]}>
            <Text style={styles.flightLabel}>G</Text>
            <Text style={styles.flightNumberText}>{displayDisc.glide}</Text>
          </View>
          <View style={[styles.flightNumber, styles.turnNumber]}>
            <Text style={styles.flightLabel}>T</Text>
            <Text style={styles.flightNumberText}>{displayDisc.turn}</Text>
          </View>
          <View style={[styles.flightNumber, styles.fadeNumber]}>
            <Text style={styles.flightLabel}>F</Text>
            <Text style={styles.flightNumberText}>{displayDisc.fade}</Text>
          </View>
        </View>
      </View>
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
    }),
  }).isRequired,
};

DiscRow.displayName = 'DiscRow';

export default memo(DiscRow);