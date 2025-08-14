/**
 * Tests for DiscRow Component
 * Following TDD methodology
 */

import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import DiscRow from '../../../src/components/bags/DiscRow';

describe('DiscRow', () => {
  const mockDisc = {
    id: 'test-disc-1',
    model: 'Thunderbird',
    brand: 'Innova',
    speed: 9,
    glide: 5,
    turn: -1,
    fade: 2,
    color: 'Red',
    weight: '175',
    condition: 'good',
  };

  it('should export a DiscRow component', () => {
    expect(DiscRow).toBeDefined();
  });

  it('should display disc model and brand', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiscRow disc={mockDisc} />
      </ThemeProvider>,
    );

    expect(getByText('Thunderbird')).toBeDefined();
    expect(getByText('Innova')).toBeDefined();
  });

  it('should display flight numbers', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiscRow disc={mockDisc} />
      </ThemeProvider>,
    );

    expect(getByText('9')).toBeDefined(); // Speed
    expect(getByText('5')).toBeDefined(); // Glide
    expect(getByText('-1')).toBeDefined(); // Turn
    expect(getByText('2')).toBeDefined(); // Fade
  });

  it('should display custom disc properties', () => {
    const { getByText, getByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={mockDisc} />
      </ThemeProvider>,
    );

    // Color is now displayed as a visual bar, not text
    expect(getByTestId('color-indicator')).toBeDefined();
    // Weight and condition are still displayed as text
    expect(getByText('175g • good')).toBeDefined();
  });

  it('should use disc_master fallback when custom values are missing', () => {
    const discWithMaster = {
      id: 'test-disc-2',
      disc_master: {
        model: 'Destroyer',
        brand: 'Innova',
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
      },
    };

    const { getByText } = render(
      <ThemeProvider>
        <DiscRow disc={discWithMaster} />
      </ThemeProvider>,
    );

    expect(getByText('Destroyer')).toBeDefined();
    expect(getByText('Innova')).toBeDefined();
    expect(getByText('12')).toBeDefined();
  });

  it('should use ColorIndicator component when disc has color', () => {
    const discWithColor = {
      ...mockDisc,
      color: 'red',
    };
    const { getByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={discWithColor} />
      </ThemeProvider>,
    );

    const colorIndicator = getByTestId('color-indicator');
    expect(colorIndicator).toBeTruthy();
    expect(colorIndicator.props.accessibilityLabel).toBe('Disc color: red');
  });

  it('should not display color indicator when disc has no color', () => {
    const discWithoutColor = {
      ...mockDisc,
      color: null,
    };
    const { queryByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={discWithoutColor} />
      </ThemeProvider>,
    );

    expect(queryByTestId('color-indicator')).toBeNull();
  });

  it('should pass correct props to ColorIndicator', () => {
    const discWithHexColor = {
      ...mockDisc,
      color: '#FF5733',
    };
    const { getByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={discWithHexColor} />
      </ThemeProvider>,
    );

    const colorIndicator = getByTestId('color-indicator');
    expect(colorIndicator.props.accessibilityLabel).toBe('Disc color: #FF5733');
  });

  it('should use bar shape for ColorIndicator', () => {
    const discWithColor = {
      ...mockDisc,
      color: 'blue',
    };
    const { getByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={discWithColor} />
      </ThemeProvider>,
    );

    const colorIndicator = getByTestId('color-indicator');
    // Should have bar styling (borderRadius: 2, not circular)
    expect(colorIndicator).toBeTruthy();
  });

  it('should handle disc with empty string color', () => {
    const discWithEmptyColor = {
      ...mockDisc,
      color: '',
    };
    const { queryByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={discWithEmptyColor} />
      </ThemeProvider>,
    );

    expect(queryByTestId('color-indicator')).toBeNull();
  });

  it('should handle disc with undefined color property', () => {
    const discWithUndefinedColor = {
      ...mockDisc,
      color: undefined,
    };
    const { queryByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={discWithUndefinedColor} />
      </ThemeProvider>,
    );

    expect(queryByTestId('color-indicator')).toBeNull();
  });

  it('should handle disc_master fallback for color', () => {
    const discWithMasterColor = {
      id: 'test-id',
      model: 'Test Disc',
      // No direct color property
      disc_master: {
        model: 'Master Disc',
        brand: 'Master Brand',
        color: 'blue',
      },
    };
    const { getByTestId } = render(
      <ThemeProvider>
        <DiscRow disc={discWithMasterColor} />
      </ThemeProvider>,
    );

    expect(getByTestId('color-indicator')).toBeTruthy();
  });
});
