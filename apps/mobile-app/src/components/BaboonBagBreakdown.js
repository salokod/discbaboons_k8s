/**
 * BaboonBagBreakdown Component
 * Shows statistical breakdown and analysis of discs in a bag
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import Card from '../design-system/components/Card';

function BaboonBagBreakdown({ bag, style }) {
  const colors = useThemeColors();

  // Calculate statistics from bag contents
  const calculateStats = () => {
    const discs = bag?.bag_contents || [];

    if (discs.length === 0) {
      return {
        totalDiscs: 0,
        averages: {
          speed: 0, glide: 0, turn: 0, fade: 0,
        },
        stability: { overstable: 0, stable: 0, understable: 0 },
        speeds: {
          drivers: 0, fairways: 0, midranges: 0, putters: 0,
        },
        brands: {},
        conditions: {},
        plasticTypes: {},
      };
    }

    // Calculate averages
    const totals = discs.reduce((acc, disc) => {
      const speed = disc.speed || disc.disc_master?.speed || 0;
      const glide = disc.glide || disc.disc_master?.glide || 0;
      const turn = disc.turn || disc.disc_master?.turn || 0;
      const fade = disc.fade || disc.disc_master?.fade || 0;

      return {
        speed: acc.speed + speed,
        glide: acc.glide + glide,
        turn: acc.turn + turn,
        fade: acc.fade + fade,
      };
    }, {
      speed: 0, glide: 0, turn: 0, fade: 0,
    });

    const averages = {
      speed: Math.round((totals.speed / discs.length) * 10) / 10,
      glide: Math.round((totals.glide / discs.length) * 10) / 10,
      turn: Math.round((totals.turn / discs.length) * 10) / 10,
      fade: Math.round((totals.fade / discs.length) * 10) / 10,
    };

    // Calculate stability breakdown
    const stabilityBreakdown = discs.reduce((acc, disc) => {
      const turn = disc.turn || disc.disc_master?.turn || 0;
      const fade = disc.fade || disc.disc_master?.fade || 0;
      const stabilityValue = turn + fade;

      if (stabilityValue > 1) {
        acc.overstable += 1;
      } else if (stabilityValue >= -1) {
        acc.stable += 1;
      } else {
        acc.understable += 1;
      }

      return acc;
    }, { overstable: 0, stable: 0, understable: 0 });

    // Calculate speed categories
    const speeds = discs.reduce((acc, disc) => {
      const speed = disc.speed || disc.disc_master?.speed || 0;

      if (speed >= 12) {
        acc.drivers += 1;
      } else if (speed >= 8) {
        acc.fairways += 1;
      } else if (speed >= 4) {
        acc.midranges += 1;
      } else {
        acc.putters += 1;
      }

      return acc;
    }, {
      drivers: 0, fairways: 0, midranges: 0, putters: 0,
    });

    // Calculate brands breakdown
    const brands = discs.reduce((acc, disc) => {
      const brand = disc.brand || disc.disc_master?.brand || 'Unknown';
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {});

    // Calculate conditions breakdown
    const conditions = discs.reduce((acc, disc) => {
      if (disc.condition) {
        acc[disc.condition] = (acc[disc.condition] || 0) + 1;
      }
      return acc;
    }, {});

    // Calculate plastic types breakdown
    const plasticTypes = discs.reduce((acc, disc) => {
      if (disc.plastic_type) {
        acc[disc.plastic_type] = (acc[disc.plastic_type] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      totalDiscs: discs.length,
      averages,
      stability: stabilityBreakdown,
      speeds,
      brands,
      conditions,
      plasticTypes,
    };
  };

  const stats = calculateStats();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    headerIcon: {
      marginRight: spacing.sm,
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
    },
    content: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    statsGrid: {
      gap: spacing.lg,
    },
    statSection: {
      marginBottom: spacing.lg,
    },
    statSectionTitle: {
      ...typography.bodyBold,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    statLabel: {
      ...typography.body,
      color: colors.textLight,
      flex: 1,
    },
    statValue: {
      ...typography.bodyBold,
      color: colors.text,
      minWidth: 40,
      textAlign: 'right',
    },
    statValueLarge: {
      ...typography.bodyBold,
      color: colors.primary,
      fontSize: 18,
      minWidth: 40,
      textAlign: 'right',
    },
    averagesGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    averageStat: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      borderWidth: 1,
      borderColor: colors.border,
    },
    averageLabel: {
      ...typography.caption,
      color: colors.textLight,
      fontSize: 10,
      marginBottom: spacing.xs,
    },
    averageValue: {
      ...typography.bodyBold,
      color: colors.text,
      fontSize: 16,
    },
    speedAverageValue: {
      color: colors.error,
    },
    glideAverageValue: {
      color: colors.primary,
    },
    turnAverageValue: {
      color: colors.warning,
    },
    fadeAverageValue: {
      color: colors.success,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
    },
  });

  if (stats.totalDiscs === 0) {
    return (
      <View style={[styles.container, style]}>
        <Card>
          <View style={styles.content}>
            <View style={styles.header}>
              <Icon
                name="analytics-outline"
                size={20}
                color={colors.primary}
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitle}>Baboon Breakdown</Text>
            </View>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Add discs to your bag to see detailed statistics and breakdown.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Card>
        <View style={styles.content}>
          <View style={styles.header}>
            <Icon
              name="analytics-outline"
              size={20}
              color={colors.primary}
              style={styles.headerIcon}
            />
            <Text style={styles.headerTitle}>Baboon Breakdown</Text>
          </View>

          <View style={styles.statsGrid}>
            {/* Total Discs Summary */}
            <View style={styles.statSection}>
              <Text style={styles.statSectionTitle}>Bag Summary</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Discs</Text>
                <Text style={styles.statValueLarge}>
                  {stats.totalDiscs}
                </Text>
              </View>
            </View>

            {/* Flight Number Averages */}
            <View style={styles.statSection}>
              <Text style={styles.statSectionTitle}>Average Flight Numbers</Text>
              <View style={styles.averagesGrid}>
                <View style={styles.averageStat}>
                  <Text style={styles.averageLabel}>SPEED</Text>
                  <Text style={[styles.averageValue, styles.speedAverageValue]}>
                    {stats.averages.speed}
                  </Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={styles.averageLabel}>GLIDE</Text>
                  <Text style={[styles.averageValue, styles.glideAverageValue]}>
                    {stats.averages.glide}
                  </Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={styles.averageLabel}>TURN</Text>
                  <Text style={[styles.averageValue, styles.turnAverageValue]}>
                    {stats.averages.turn}
                  </Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={styles.averageLabel}>FADE</Text>
                  <Text style={[styles.averageValue, styles.fadeAverageValue]}>
                    {stats.averages.fade}
                  </Text>
                </View>
              </View>
            </View>

            {/* Disc Categories */}
            <View style={styles.statSection}>
              <Text style={styles.statSectionTitle}>Disc Categories</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Drivers (Speed 12+)</Text>
                <Text style={styles.statValue}>{stats.speeds.drivers}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Fairways (Speed 8-11)</Text>
                <Text style={styles.statValue}>{stats.speeds.fairways}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Mid-ranges (Speed 4-7)</Text>
                <Text style={styles.statValue}>{stats.speeds.midranges}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Putters (Speed 1-3)</Text>
                <Text style={styles.statValue}>{stats.speeds.putters}</Text>
              </View>
            </View>

            {/* Stability Breakdown */}
            <View style={styles.statSection}>
              <Text style={styles.statSectionTitle}>Stability Profile</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Overstable</Text>
                <Text style={styles.statValue}>{stats.stability.overstable}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Stable</Text>
                <Text style={styles.statValue}>{stats.stability.stable}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Understable</Text>
                <Text style={styles.statValue}>{stats.stability.understable}</Text>
              </View>
            </View>

            {/* Brands Breakdown */}
            {Object.keys(stats.brands).length > 0 && (
              <View style={styles.statSection}>
                <Text style={styles.statSectionTitle}>Discs by Brand</Text>
                {Object.entries(stats.brands)
                  .sort((a, b) => b[1] - a[1])
                  .map(([brand, count]) => (
                    <View key={brand} style={styles.statRow}>
                      <Text style={styles.statLabel}>{brand}</Text>
                      <Text style={styles.statValue}>{count}</Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Conditions Breakdown */}
            {Object.keys(stats.conditions).length > 0 && (
              <View style={styles.statSection}>
                <Text style={styles.statSectionTitle}>Disc Conditions</Text>
                {Object.entries(stats.conditions)
                  .sort((a, b) => b[1] - a[1])
                  .map(([condition, count]) => (
                    <View key={condition} style={styles.statRow}>
                      <Text style={styles.statLabel}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
                      </Text>
                      <Text style={styles.statValue}>{count}</Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Plastic Types */}
            {Object.keys(stats.plasticTypes).length > 0 && (
              <View style={styles.statSection}>
                <Text style={styles.statSectionTitle}>Plastic Types</Text>
                {Object.entries(stats.plasticTypes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([plastic, count]) => (
                    <View key={plastic} style={styles.statRow}>
                      <Text style={styles.statLabel}>{plastic}</Text>
                      <Text style={styles.statValue}>{count}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
}

BaboonBagBreakdown.propTypes = {
  bag: PropTypes.shape({
    bag_contents: PropTypes.arrayOf(
      PropTypes.shape({
        speed: PropTypes.number,
        glide: PropTypes.number,
        turn: PropTypes.number,
        fade: PropTypes.number,
        disc_master: PropTypes.shape({
          speed: PropTypes.number,
          glide: PropTypes.number,
          turn: PropTypes.number,
          fade: PropTypes.number,
        }),
      }),
    ),
  }),
  style: PropTypes.shape({}),
};

BaboonBagBreakdown.defaultProps = {
  bag: { bag_contents: [] },
  style: {},
};

export default memo(BaboonBagBreakdown);
