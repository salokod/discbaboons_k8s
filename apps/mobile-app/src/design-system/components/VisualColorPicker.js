/**
 * VisualColorPicker Component
 * Simple drag-to-select color grid without external dependencies
 */

import { memo, useState, useCallback } from 'react';
import {
  View, StyleSheet, Text, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';

function VisualColorPicker({ onColorSelect, initialColor }) {
  const colors = useThemeColors();
  const [selectedColor, setSelectedColor] = useState(initialColor || '#FF0000');

  // Convert HSV to RGB
  const hsvToRgb = useCallback((h, s, v) => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: (r + m) * 255,
      g: (g + m) * 255,
      b: (b + m) * 255,
    };
  }, []);

  // Convert RGB to Hex
  const rgbToHex = useCallback((r, g, b) => {
    const toHex = (c) => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  // Generate a color grid for visual selection
  const generateColorGrid = useCallback(() => {
    const colorGrid = [];
    const rows = 12;
    const cols = 12;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const hue = (col / cols) * 360;
        const saturation = 0.3 + (row / rows) * 0.7; // 30% to 100%
        const brightness = 0.9;

        const rgb = hsvToRgb(hue, saturation, brightness);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

        colorGrid.push({
          hex,
          row,
          col,
        });
      }
    }
    return colorGrid;
  }, [hsvToRgb, rgbToHex]);

  const handleColorSelect = useCallback((color) => {
    setSelectedColor(color);
    onColorSelect(color);
  }, [onColorSelect]);

  const colorGrid = generateColorGrid();

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 240,
      height: 240,
    },
    colorCell: {
      width: 20,
      height: 20,
      margin: 0,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedCell: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    preview: {
      width: 60,
      height: 30,
      backgroundColor: selectedColor,
      borderRadius: 8,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewLabel: {
      fontSize: 12,
      color: colors.textLight,
      marginTop: 8,
    },
  });

  return (
    <View testID="visual-color-picker" style={styles.container}>
      <Text style={styles.title}>Drag or Tap to Select Color</Text>

      <View style={styles.colorGrid}>
        {colorGrid.map((colorInfo) => (
          <TouchableOpacity
            key={`${colorInfo.row}-${colorInfo.col}`}
            style={[
              styles.colorCell,
              { backgroundColor: colorInfo.hex },
              selectedColor === colorInfo.hex && styles.selectedCell,
            ]}
            onPress={() => handleColorSelect(colorInfo.hex)}
            accessibilityRole="button"
            accessibilityLabel={`Select color ${colorInfo.hex}`}
          />
        ))}
      </View>

      <View testID="color-preview" style={styles.preview} />
      <Text style={styles.previewLabel}>{selectedColor}</Text>
    </View>
  );
}

VisualColorPicker.propTypes = {
  onColorSelect: PropTypes.func.isRequired,
  initialColor: PropTypes.string,
};

VisualColorPicker.defaultProps = {
  initialColor: '#FF0000',
};

VisualColorPicker.displayName = 'VisualColorPicker';

export default memo(VisualColorPicker);
