/**
 * ColorPicker Component Unit Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import ColorPicker from '../../../src/design-system/components/ColorPicker';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('ColorPicker component', () => {
  it('should export a ColorPicker component', () => {
    expect(ColorPicker).toBeDefined();
    expect(typeof ColorPicker).toBe('object'); // memo() returns an object
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ColorPicker
          selectedColor="red"
          onColorSelect={() => {}}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('color-picker')).toBeTruthy();
  });

  it('should accept selectedColor and onColorSelect props', () => {
    const mockOnColorSelect = jest.fn();

    const { getByTestId } = render(
      <ThemeProvider>
        <ColorPicker
          selectedColor="red"
          onColorSelect={mockOnColorSelect}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('color-picker')).toBeTruthy();
  });

  describe('Preset Color Grid', () => {
    it('should display expanded preset color grid', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByTestId('preset-color-grid')).toBeTruthy();
    });

    it('should include common disc golf colors', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      // Check for common disc golf colors
      expect(getByTestId('color-swatch-red')).toBeTruthy();
      expect(getByTestId('color-swatch-blue')).toBeTruthy();
      expect(getByTestId('color-swatch-orange')).toBeTruthy();
      expect(getByTestId('color-swatch-green')).toBeTruthy();
      expect(getByTestId('color-swatch-yellow')).toBeTruthy();
      expect(getByTestId('color-swatch-pink')).toBeTruthy();
      expect(getByTestId('color-swatch-white')).toBeTruthy();
      expect(getByTestId('color-swatch-clear')).toBeTruthy();
    });

    it('should handle color selection', () => {
      const mockOnColorSelect = jest.fn();

      const { getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor=""
            onColorSelect={mockOnColorSelect}
          />
        </ThemeProvider>,
      );

      const redSwatch = getByTestId('color-swatch-red');
      fireEvent.press(redSwatch);

      expect(mockOnColorSelect).toHaveBeenCalledWith('red');
    });

    it('should show selected color with visual feedback', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const redSwatch = getByTestId('color-swatch-red');
      expect(redSwatch).toBeTruthy();
      // Visual feedback for selected state will be checked by styling
    });
  });

  describe('Custom Color Button', () => {
    it('should display custom color button', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const customButton = getByText('Enter Custom Color');
      expect(customButton).toBeTruthy();
    });

    it('should show hex input after pressing custom color button', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const customButton = getByText('Enter Custom Color');
      fireEvent.press(customButton);

      const hexInput = getByTestId('hex-input');
      expect(hexInput).toBeTruthy();
    });

    it('should accept valid hex color input when visible', () => {
      const mockOnColorSelect = jest.fn();

      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={mockOnColorSelect}
          />
        </ThemeProvider>,
      );

      const customButton = getByText('Enter Custom Color');
      fireEvent.press(customButton);

      const hexInput = getByTestId('hex-input');
      fireEvent.changeText(hexInput, '#FF5733');

      expect(mockOnColorSelect).toHaveBeenCalledWith('#FF5733');
    });

    it('should toggle button text when pressed', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const customButton = getByText('Enter Custom Color');
      fireEvent.press(customButton);

      expect(getByText('Hide Custom Color')).toBeTruthy();
    });

    it('should show preview of entered hex color when visible', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="#FF5733"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const customButton = getByText('Enter Custom Color');
      fireEvent.press(customButton);

      expect(getByTestId('hex-color-preview')).toBeTruthy();
    });

    it('should handle invalid hex colors gracefully when visible', () => {
      const mockOnColorSelect = jest.fn();

      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={mockOnColorSelect}
          />
        </ThemeProvider>,
      );

      const customButton = getByText('Enter Custom Color');
      fireEvent.press(customButton);

      const hexInput = getByTestId('hex-input');
      fireEvent.changeText(hexInput, 'invalid-color');

      // Should not call onColorSelect for invalid input
      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Touch Optimization', () => {
    it('should provide sufficient touch target sizes for preset colors', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const redSwatch = getByTestId('color-swatch-red');
      expect(redSwatch).toBeTruthy();
      // Touch target size will be checked via styling (minimum 44px)
    });
  });

  describe('Visual Picker Toggle', () => {
    it('should display visual picker toggle button', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      expect(getByText('Visual Picker')).toBeTruthy();
    });

    it('should show VisualColorPicker when toggle is pressed', () => {
      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const visualPickerToggle = getByText('Visual Picker');
      fireEvent.press(visualPickerToggle);

      expect(getByTestId('visual-color-picker')).toBeTruthy();
    });

    it('should toggle button text when visual picker is shown', () => {
      const { getByText } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const visualPickerToggle = getByText('Visual Picker');
      fireEvent.press(visualPickerToggle);

      expect(getByText('Hide Visual Picker')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper accessibility labels for all color swatches', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const redSwatch = getByTestId('color-swatch-red');
      expect(redSwatch.props.accessibilityLabel).toBe('Select red color');
    });

    it('should have proper accessibility roles for interactive elements', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const redSwatch = getByTestId('color-swatch-red');
      expect(redSwatch.props.accessibilityRole).toBe('button');
    });

    it('should provide meaningful color descriptions', () => {
      const { getAllByTestId } = render(
        <ThemeProvider>
          <ColorPicker
            selectedColor="red"
            onColorSelect={() => {}}
          />
        </ThemeProvider>,
      );

      const colorIndicators = getAllByTestId('color-indicator');
      expect(colorIndicators[0].props.accessibilityLabel).toBe('Disc color: red');
    });
  });
});
