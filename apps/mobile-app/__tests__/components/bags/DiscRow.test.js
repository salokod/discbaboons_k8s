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
    const { getByText } = render(
      <ThemeProvider>
        <DiscRow disc={mockDisc} />
      </ThemeProvider>,
    );

    expect(getByText((content) => content.includes('Red'))).toBeDefined();
    expect(getByText((content) => content.includes('175g'))).toBeDefined();
    expect(getByText((content) => content.includes('good'))).toBeDefined();
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
});