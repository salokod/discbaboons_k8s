/**
 * DiscPreviewSection Component
 * Displays disc preview with flight numbers and properties
 * Extracted from AddDiscToBagScreen for reusability
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import DiscCard from '../DiscCard';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl * 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionIcon: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
});

function DiscPreviewSection({
  disc,
  flightNumbers,
  masterFlightNumbers,
  customName,
  condition,
  showCustomFields,
}) {
  const colors = useThemeColors();

  if (!disc) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon
          name="disc-outline"
          size={20}
          color={colors.primary}
          style={styles.sectionIcon}
        />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Disc Preview</Text>
      </View>

      <DiscCard
        disc={{
          model: customName || disc.model,
          brand: disc.brand,
          speed: flightNumbers?.speed || masterFlightNumbers?.speed || disc.speed || 0,
          glide: flightNumbers?.glide || masterFlightNumbers?.glide || disc.glide || 0,
          turn: flightNumbers?.turn || masterFlightNumbers?.turn || disc.turn || 0,
          fade: flightNumbers?.fade || masterFlightNumbers?.fade || disc.fade || 0,
          color: disc.color,
          weight: disc.weight,
          condition: showCustomFields ? condition : undefined,
        }}
      />
    </View>
  );
}

DiscPreviewSection.propTypes = {
  disc: PropTypes.shape({
    id: PropTypes.string,
    brand: PropTypes.string,
    model: PropTypes.string,
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
    plastic_type: PropTypes.string,
    color: PropTypes.string,
    weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  flightNumbers: PropTypes.shape({
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
  }),
  masterFlightNumbers: PropTypes.shape({
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
  }),
  customName: PropTypes.string,
  condition: PropTypes.string,
  showCustomFields: PropTypes.bool,
};

DiscPreviewSection.defaultProps = {
  disc: null,
  flightNumbers: null,
  masterFlightNumbers: null,
  customName: '',
  condition: '',
  showCustomFields: false,
};

export default memo(DiscPreviewSection);
