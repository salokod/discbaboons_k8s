import { memo, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput, Text,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import ColorIndicator from './ColorIndicator';
import { normalizeColorValue, isValidHexColor } from '../../utils/colorUtils';
import VisualColorPicker from './VisualColorPicker';

function ColorPicker({ selectedColor, onColorSelect }) {
  const colors = useThemeColors();
  const [hexInput, setHexInput] = useState('');
  const [showHexInput, setShowHexInput] = useState(false);
  const [showVisualPicker, setShowVisualPicker] = useState(false);

  // Expanded preset color palette with disc golf specific colors
  const presetColors = [
    { name: 'red', hex: '#FF4444' },
    { name: 'blue', hex: '#4444FF' },
    { name: 'orange', hex: '#FF8800' },
    { name: 'green', hex: '#44BB44' },
    { name: 'purple', hex: '#8844FF' },
    { name: 'yellow', hex: '#FFD700' },
    { name: 'pink', hex: '#FF44BB' },
    { name: 'white', hex: '#FFFFFF' },
    { name: 'black', hex: '#333333' },
    { name: 'clear', hex: '#E0E0E0' },
    { name: 'neon-green', hex: '#39FF14' },
    { name: 'glow', hex: '#CCFFCC' },
    { name: 'teal', hex: '#008080' },
    { name: 'lime', hex: '#32CD32' },
    { name: 'maroon', hex: '#800000' },
    { name: 'navy', hex: '#000080' },
    { name: 'silver', hex: '#C0C0C0' },
    { name: 'translucent', hex: '#FFFFFF80' },
  ];

  // Handle hex input change with improved validation
  const handleHexInputChange = (text) => {
    setHexInput(text);
    // Use our improved color utilities for validation
    if (isValidHexColor(text)) {
      const normalizedColor = normalizeColorValue(text);
      onColorSelect(normalizedColor);
    }
  };

  // Removed unused handlePresetColorSelect function

  // Toggle hex input visibility
  const toggleHexInput = () => {
    setShowHexInput(!showHexInput);
  };

  // Toggle visual picker visibility
  const toggleVisualPicker = () => {
    setShowVisualPicker(!showVisualPicker);
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorSwatch: {
      padding: 6,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: colors.border,
      minHeight: 44, // Minimum touch target size
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedSwatch: {
      borderColor: colors.primary,
      borderWidth: 3,
    },
    hexSection: {
      marginTop: 24,
      gap: 12,
    },
    visualPickerSection: {
      marginTop: 24,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    hexInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    customColorButton: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    customColorButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  return (
    <View testID="color-picker" style={styles.container}>
      <View testID="preset-color-grid" style={styles.presetGrid}>
        {presetColors.map((color) => {
          const isSelected = selectedColor === color.name || selectedColor === color.hex;

          return (
            <TouchableOpacity
              key={color.name}
              testID={`color-swatch-${color.name}`}
              style={[
                styles.colorSwatch,
                isSelected && styles.selectedSwatch,
              ]}
              onPress={() => onColorSelect(color.name)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${color.name} color`}
            >
              <ColorIndicator
                color={color.name}
                size={34}
                shape="circle"
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.customColorButton}
        onPress={toggleVisualPicker}
        accessibilityRole="button"
        accessibilityLabel="Toggle visual color picker"
      >
        <Text style={styles.customColorButtonText}>
          {showVisualPicker ? 'Hide Visual Picker' : 'Visual Picker'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.customColorButton}
        onPress={toggleHexInput}
        accessibilityRole="button"
        accessibilityLabel="Enter custom color"
      >
        <Text style={styles.customColorButtonText}>
          {showHexInput ? 'Hide Custom Color' : 'Enter Custom Color'}
        </Text>
      </TouchableOpacity>

      {showHexInput && (
        <View style={styles.hexSection}>
          <Text style={styles.sectionTitle}>Custom Hex Color</Text>
          <TextInput
            testID="hex-input"
            style={styles.hexInput}
            placeholder="#FF5733"
            placeholderTextColor={colors.textSecondary}
            value={hexInput}
            onChangeText={handleHexInputChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            accessibilityLabel="Enter custom hex color code"
            accessibilityHint="Format: #RRGGBB or #RGB"
            accessibilityRole="none"
          />
          {selectedColor && selectedColor.startsWith('#') && (
            <ColorIndicator
              testID="hex-color-preview"
              color={selectedColor}
              size={32}
              shape="circle"
            />
          )}
        </View>
      )}

      {showVisualPicker && (
        <View style={styles.visualPickerSection}>
          <Text style={styles.sectionTitle}>Visual Color Picker</Text>
          <VisualColorPicker
            initialColor={selectedColor}
            onColorSelect={onColorSelect}
          />
        </View>
      )}
    </View>
  );
}

ColorPicker.propTypes = {
  selectedColor: PropTypes.string,
  onColorSelect: PropTypes.func.isRequired,
};

ColorPicker.defaultProps = {
  selectedColor: null,
};

ColorPicker.displayName = 'ColorPicker';

export default memo(ColorPicker);
