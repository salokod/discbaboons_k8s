/**
 * FlightNumberSection Component
 * Reusable flight number editing section with +/- controls
 */

import { memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function FlightNumberSection({
  flightNumbers,
  onFlightNumberChange,
  masterFlightNumbers,
  disabled,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    flightNumbersGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.lg,
    },
    flightNumberInput: {
      flex: 1,
      minWidth: 120,
    },
    inputLabel: {
      ...typography.overline,
      color: colors.text,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      fontWeight: '600',
      fontSize: 12,
    },
    flightNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    flightNumberTextInput: {
      flex: 1,
      ...typography.body,
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.sm,
      color: colors.text,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
    flightAdjustButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 40,
    },
    flightAdjustButtonDisabled: {
      opacity: 0.3,
    },
  });

  // Get flight number bounds
  const getFlightNumberBounds = (field) => {
    switch (field) {
      case 'speed': return { min: 1, max: 15 };
      case 'glide': return { min: 1, max: 7 };
      case 'turn': return { min: -5, max: 2 };
      case 'fade': return { min: 0, max: 5 };
      default: return { min: 0, max: 100 };
    }
  };

  // Adjust flight number with +/- buttons
  const adjustFlightNumber = (field, delta) => {
    const currentValue = flightNumbers[field];
    const currentNum = currentValue
      ? parseInt(currentValue, 10)
      : (masterFlightNumbers[field] || 0);
    const { min, max } = getFlightNumberBounds(field);

    const newValue = Math.max(min, Math.min(max, currentNum + delta));
    onFlightNumberChange(field, newValue.toString());
  };

  // Check if adjustment buttons should be disabled
  const isAdjustmentDisabled = (field, delta) => {
    const currentValue = flightNumbers[field];
    const currentNum = currentValue
      ? parseInt(currentValue, 10)
      : (masterFlightNumbers[field] || 0);
    const { min, max } = getFlightNumberBounds(field);

    if (delta > 0) return currentNum >= max;
    if (delta < 0) return currentNum <= min;
    return false;
  };

  return (
    <View style={styles.flightNumbersGrid}>
      <View style={styles.flightNumberInput}>
        <Text style={styles.inputLabel}>Speed (1-15)</Text>
        <View style={styles.flightNumberContainer}>
          <TouchableOpacity
            testID="flight-number-remove-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('speed', -1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('speed', -1)}
            disabled={isAdjustmentDisabled('speed', -1) || disabled}
          >
            <Icon name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.flightNumberTextInput}
            value={flightNumbers.speed}
            onChangeText={(value) => onFlightNumberChange('speed', value)}
            keyboardType="number-pad"
            placeholder={masterFlightNumbers.speed?.toString()}
            placeholderTextColor={colors.textLight}
            editable={!disabled}
          />
          <TouchableOpacity
            testID="flight-number-add-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('speed', 1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('speed', 1)}
            disabled={isAdjustmentDisabled('speed', 1) || disabled}
          >
            <Icon name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.flightNumberInput}>
        <Text style={styles.inputLabel}>Glide (1-7)</Text>
        <View style={styles.flightNumberContainer}>
          <TouchableOpacity
            testID="flight-number-remove-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('glide', -1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('glide', -1)}
            disabled={isAdjustmentDisabled('glide', -1) || disabled}
          >
            <Icon name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.flightNumberTextInput}
            value={flightNumbers.glide}
            onChangeText={(value) => onFlightNumberChange('glide', value)}
            keyboardType="number-pad"
            placeholder={masterFlightNumbers.glide?.toString()}
            placeholderTextColor={colors.textLight}
            editable={!disabled}
          />
          <TouchableOpacity
            testID="flight-number-add-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('glide', 1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('glide', 1)}
            disabled={isAdjustmentDisabled('glide', 1) || disabled}
          >
            <Icon name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.flightNumberInput}>
        <Text style={styles.inputLabel}>Turn (-5 to 2)</Text>
        <View style={styles.flightNumberContainer}>
          <TouchableOpacity
            testID="flight-number-remove-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('turn', -1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('turn', -1)}
            disabled={isAdjustmentDisabled('turn', -1) || disabled}
          >
            <Icon name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.flightNumberTextInput}
            value={flightNumbers.turn}
            onChangeText={(value) => onFlightNumberChange('turn', value)}
            keyboardType="number-pad"
            placeholder={masterFlightNumbers.turn?.toString()}
            placeholderTextColor={colors.textLight}
            editable={!disabled}
          />
          <TouchableOpacity
            testID="flight-number-add-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('turn', 1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('turn', 1)}
            disabled={isAdjustmentDisabled('turn', 1) || disabled}
          >
            <Icon name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.flightNumberInput}>
        <Text style={styles.inputLabel}>Fade (0-5)</Text>
        <View style={styles.flightNumberContainer}>
          <TouchableOpacity
            testID="flight-number-remove-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('fade', -1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('fade', -1)}
            disabled={isAdjustmentDisabled('fade', -1) || disabled}
          >
            <Icon name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.flightNumberTextInput}
            value={flightNumbers.fade}
            onChangeText={(value) => onFlightNumberChange('fade', value)}
            keyboardType="number-pad"
            placeholder={masterFlightNumbers.fade?.toString()}
            placeholderTextColor={colors.textLight}
            editable={!disabled}
          />
          <TouchableOpacity
            testID="flight-number-add-button"
            style={[
              styles.flightAdjustButton,
              (isAdjustmentDisabled('fade', 1) || disabled) && styles.flightAdjustButtonDisabled,
            ]}
            onPress={() => adjustFlightNumber('fade', 1)}
            disabled={isAdjustmentDisabled('fade', 1) || disabled}
          >
            <Icon name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

FlightNumberSection.propTypes = {
  flightNumbers: PropTypes.shape({
    speed: PropTypes.string,
    glide: PropTypes.string,
    turn: PropTypes.string,
    fade: PropTypes.string,
  }).isRequired,
  onFlightNumberChange: PropTypes.func.isRequired,
  masterFlightNumbers: PropTypes.shape({
    speed: PropTypes.number,
    glide: PropTypes.number,
    turn: PropTypes.number,
    fade: PropTypes.number,
  }).isRequired,
  disabled: PropTypes.bool,
};

FlightNumberSection.defaultProps = {
  disabled: false,
};

export default memo(FlightNumberSection);
