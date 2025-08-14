/**
 * ColorIndicator Component
 */

import { memo, useMemo } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import { validateAndNormalizeHexColor } from '../../utils/validation';

function ColorIndicator({
  color, size, shape, accessibilityLabel, width, height,
}) {
  // Generate accessibility label
  const getAccessibilityLabel = () => {
    if (accessibilityLabel) {
      return accessibilityLabel;
    }
    return `Disc color: ${color}`;
  };

  // Use useMemo for dynamic styles that depend on props
  const dynamicStyles = useMemo(() => {
    // Color mapping for disc colors (similar to BaboonsVisionModal)
    const getDiscColor = (colorName) => {
      // Validate and normalize hex color if provided
      const normalizedHex = validateAndNormalizeHexColor(colorName);
      if (normalizedHex) {
        return normalizedHex;
      }

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

      // Handle case-insensitive lookup
      const normalizedColor = colorName ? colorName.toLowerCase() : '';
      return colorMap[normalizedColor] || colorName || '#808080'; // fallback to original color or gray
    };

    // Calculate dimensions based on shape and provided props
    const getDimensions = () => {
      if (shape === 'bar') {
        return {
          width: width || size,
          height: height || 12, // Default bar height
        };
      }
      // Circle (default) - use size for both dimensions
      const dimension = width || height || size;
      return {
        width: dimension,
        height: dimension,
      };
    };

    // Calculate border radius based on shape
    const getBorderRadius = () => {
      if (shape === 'bar') {
        return 2;
      }
      const dimension = width || height || size;
      return dimension / 2; // circle (default)
    };

    const dimensions = getDimensions();

    return {
      width: dimensions.width,
      height: dimensions.height,
      borderRadius: getBorderRadius(),
      backgroundColor: getDiscColor(color),
    };
  }, [size, color, shape, width, height]);

  return (
    <View
      testID="color-indicator"
      style={dynamicStyles}
      accessibilityRole="image"
      accessibilityLabel={getAccessibilityLabel()}
    />
  );
}

ColorIndicator.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
  shape: PropTypes.oneOf(['circle', 'bar']),
  accessibilityLabel: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
};

ColorIndicator.defaultProps = {
  color: '#808080',
  size: 12,
  shape: 'circle',
  accessibilityLabel: null,
  width: null,
  height: null,
};

// Add display name for React DevTools
ColorIndicator.displayName = 'ColorIndicator';

export default memo(ColorIndicator);
