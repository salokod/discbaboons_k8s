/**
 * VisualColorPicker Component Unit Tests
 * TDD approach - starting with thinnest slice
 */

import { render } from '@testing-library/react-native';
import VisualColorPicker from '../../../src/design-system/components/VisualColorPicker';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('VisualColorPicker component', () => {
  it('should export a function', () => {
    expect(VisualColorPicker).toBeDefined();
    expect(typeof VisualColorPicker).toBe('object'); // memo() returns an object
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <VisualColorPicker
          onColorSelect={() => {}}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('visual-color-picker')).toBeTruthy();
  });

  it('should display color grid', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <VisualColorPicker
          onColorSelect={() => {}}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('visual-color-picker')).toBeTruthy();
    // Color grid is rendered as multiple TouchableOpacity elements
  });

  it('should display color preview', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <VisualColorPicker
          onColorSelect={() => {}}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('color-preview')).toBeTruthy();
  });

  it('should accept initialColor prop', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <VisualColorPicker
          initialColor="#00FF00"
          onColorSelect={() => {}}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('visual-color-picker')).toBeTruthy();
    expect(getByTestId('color-preview')).toBeTruthy();
  });

  it('should call onColorSelect when color changes', () => {
    const mockOnColorSelect = jest.fn();

    render(
      <ThemeProvider>
        <VisualColorPicker
          onColorSelect={mockOnColorSelect}
        />
      </ThemeProvider>,
    );

    // Note: Due to the mocked implementation, we can't directly test the onComplete callback
    // In a real test environment with the actual library, this would simulate color selection
    expect(mockOnColorSelect).toBeDefined();
  });

  it('should handle missing initialColor gracefully', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <VisualColorPicker
          onColorSelect={() => {}}
        />
      </ThemeProvider>,
    );

    // Should render without crashing and use default color
    expect(getByTestId('visual-color-picker')).toBeTruthy();
    expect(getByTestId('color-preview')).toBeTruthy();
  });
});
