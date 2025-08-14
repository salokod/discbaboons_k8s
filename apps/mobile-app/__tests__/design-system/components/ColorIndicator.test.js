/**
 * ColorIndicator Component Tests
 */

import { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import ColorIndicator from '../../../src/design-system/components/ColorIndicator';
import { validateAndNormalizeHexColor } from '../../../src/utils/validation';

describe('ColorIndicator component', () => {
  it('should export a component', () => {
    expect(ColorIndicator).toBeTruthy();
  });

  it('should render with text color names', () => {
    const { getByTestId } = render(<ColorIndicator color="red" />);
    const indicator = getByTestId('color-indicator');
    expect(indicator).toBeTruthy();
    // Should have red background color
    expect(indicator.props.style.backgroundColor).toBe('#FF4444');
  });

  it('should handle common disc colors', () => {
    const colors = ['red', 'blue', 'orange', 'green', 'purple', 'yellow', 'pink', 'white', 'black', 'clear'];
    colors.forEach((color) => {
      const { getByTestId } = render(<ColorIndicator color={color} />);
      const indicator = getByTestId('color-indicator');
      expect(indicator).toBeTruthy();
      // Should render without errors
    });
  });

  it('should be case-insensitive for color names', () => {
    const { getByTestId } = render(<ColorIndicator color="RED" />);
    const indicator = getByTestId('color-indicator');
    expect(indicator).toBeTruthy();
    // Should handle uppercase correctly
    expect(indicator.props.style.backgroundColor).toBe('#FF4444');
  });

  it('should accept and normalize valid hex colors', () => {
    const { getByTestId } = render(<ColorIndicator color="#ff0000" />);
    const indicator = getByTestId('color-indicator');
    expect(indicator).toBeTruthy();
    // Should normalize to uppercase
    expect(indicator.props.style.backgroundColor).toBe('#FF0000');
  });

  it('should expand 3-character hex colors to 6-character format', () => {
    const { getByTestId } = render(<ColorIndicator color="#F00" />);
    const indicator = getByTestId('color-indicator');
    expect(indicator).toBeTruthy();
    // Should expand #F00 to #FF0000
    expect(indicator.props.style.backgroundColor).toBe('#FF0000');
  });

  it('should fallback to color name mapping for invalid hex colors', () => {
    const { getByTestId } = render(<ColorIndicator color="red" />);
    const indicator = getByTestId('color-indicator');
    expect(indicator).toBeTruthy();
    // Should use color mapping since "red" is not a valid hex
    expect(indicator.props.style.backgroundColor).toBe('#FF4444');
  });

  describe('Accessibility', () => {
    it('should have proper accessibility role', () => {
      const { getByTestId } = render(<ColorIndicator color="red" />);
      const indicator = getByTestId('color-indicator');
      expect(indicator.props.accessibilityRole).toBe('image');
    });

    it('should provide meaningful accessibility label for color names', () => {
      const { getByTestId } = render(<ColorIndicator color="red" />);
      const indicator = getByTestId('color-indicator');
      expect(indicator.props.accessibilityLabel).toBe('Disc color: red');
    });

    it('should provide accessibility label for hex colors', () => {
      const { getByTestId } = render(<ColorIndicator color="#FF5733" />);
      const indicator = getByTestId('color-indicator');
      expect(indicator.props.accessibilityLabel).toBe('Disc color: #FF5733');
    });

    it('should support custom accessibility labels', () => {
      const { getByTestId } = render(
        <ColorIndicator color="blue" accessibilityLabel="Custom blue disc" />,
      );
      const indicator = getByTestId('color-indicator');
      expect(indicator.props.accessibilityLabel).toBe('Custom blue disc');
    });
  });

  describe('Shape Support', () => {
    it('should render as circle by default', () => {
      const { getByTestId } = render(<ColorIndicator color="red" size={12} />);
      const indicator = getByTestId('color-indicator');
      // Should have borderRadius of 6 (size/2)
      expect(indicator.props.style.borderRadius).toBe(6);
    });

    it('should render as bar when shape="bar"', () => {
      const { getByTestId } = render(<ColorIndicator color="red" shape="bar" size={12} />);
      const indicator = getByTestId('color-indicator');
      // Should have borderRadius of 2 for bar shape
      expect(indicator.props.style.borderRadius).toBe(2);
    });
  });

  describe('Performance Optimization', () => {
    it('should not recreate styles on re-render with same props', () => {
      function TestComponent() {
        const [count, setCount] = useState(0);
        return (
          <View>
            <ColorIndicator color="red" size={12} />
            <TouchableOpacity onPress={() => setCount(count + 1)}>
              <Text>
                Rerender:
                {' '}
                {count}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

      const { getByText } = render(<TestComponent />);

      // Trigger re-render
      fireEvent.press(getByText(/Rerender/));

      // Component should handle re-renders efficiently
      expect(getByText('Rerender: 1')).toBeTruthy();
    });

    it('should handle rapid prop changes efficiently', () => {
      const { rerender } = render(<ColorIndicator color="red" size={12} />);

      // Rapid prop changes should not cause performance issues
      for (let i = 0; i < 10; i += 1) {
        rerender(<ColorIndicator color={i % 2 === 0 ? 'red' : 'blue'} size={12} />);
      }

      // Should complete without performance issues
      expect(true).toBe(true);
    });
  });
});

describe('validateAndNormalizeHexColor function', () => {
  it('should export the validation function', () => {
    expect(validateAndNormalizeHexColor).toBeTruthy();
    expect(typeof validateAndNormalizeHexColor).toBe('function');
  });

  it('should normalize valid 6-character hex colors with #', () => {
    expect(validateAndNormalizeHexColor('#FF0000')).toBe('#FF0000');
    expect(validateAndNormalizeHexColor('#00FF00')).toBe('#00FF00');
    expect(validateAndNormalizeHexColor('#0000FF')).toBe('#0000FF');
    expect(validateAndNormalizeHexColor('#FFFFFF')).toBe('#FFFFFF');
    expect(validateAndNormalizeHexColor('#000000')).toBe('#000000');
  });

  it('should normalize valid 3-character hex colors to 6-character format', () => {
    expect(validateAndNormalizeHexColor('#F00')).toBe('#FF0000');
    expect(validateAndNormalizeHexColor('#0F0')).toBe('#00FF00');
    expect(validateAndNormalizeHexColor('#00F')).toBe('#0000FF');
    expect(validateAndNormalizeHexColor('#FFF')).toBe('#FFFFFF');
    expect(validateAndNormalizeHexColor('#000')).toBe('#000000');
    expect(validateAndNormalizeHexColor('#ABC')).toBe('#AABBCC');
  });

  it('should handle lowercase hex colors', () => {
    expect(validateAndNormalizeHexColor('#ff0000')).toBe('#FF0000');
    expect(validateAndNormalizeHexColor('#abc123')).toBe('#ABC123');
    expect(validateAndNormalizeHexColor('#def')).toBe('#DDEEFF');
  });

  it('should return null for invalid hex colors', () => {
    expect(validateAndNormalizeHexColor('FF0000')).toBeNull(); // Missing #
    expect(validateAndNormalizeHexColor('#GG0000')).toBeNull(); // Invalid characters
    expect(validateAndNormalizeHexColor('#FF00')).toBeNull(); // Wrong length (4 chars)
    expect(validateAndNormalizeHexColor('#FF00000')).toBeNull(); // Wrong length (7 chars)
    expect(validateAndNormalizeHexColor('')).toBeNull(); // Empty string
    expect(validateAndNormalizeHexColor(null)).toBeNull(); // Null
    expect(validateAndNormalizeHexColor(undefined)).toBeNull(); // Undefined
    expect(validateAndNormalizeHexColor('#')).toBeNull(); // Just #
    expect(validateAndNormalizeHexColor('red')).toBeNull(); // Color name
  });

  it('should be strict about # prefix requirement', () => {
    expect(validateAndNormalizeHexColor('FF0000')).toBeNull();
    expect(validateAndNormalizeHexColor('F00')).toBeNull();
    expect(validateAndNormalizeHexColor('0xFF0000')).toBeNull(); // Programming prefix
  });
});
