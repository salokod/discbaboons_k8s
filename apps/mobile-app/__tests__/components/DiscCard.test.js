/**
 * DiscCard Component Tests
 * Reusable disc display with flight path visualization
 * Following TDD methodology - testing compact flight path fix
 */

import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/context/ThemeContext';
import DiscCard from '../../src/components/DiscCard';

describe('DiscCard Component', () => {
  const mockDisc = {
    model: 'Destroyer',
    brand: 'Innova',
    speed: 12,
    glide: 5,
    turn: -1,
    fade: 3,
  };

  it('should export DiscCard component', () => {
    expect(DiscCard).toBeDefined();
  });

  it('should render with disc data', () => {
    const { getByText } = render(
      <ThemeProvider>
        <DiscCard disc={mockDisc} />
      </ThemeProvider>,
    );

    expect(getByText('Destroyer')).toBeTruthy();
    expect(getByText('Innova')).toBeTruthy();
  });

  describe('flight path visualization fix', () => {
    it('should render FlightPathVisualization with compact mode to avoid rectangular box', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <DiscCard disc={mockDisc} />
        </ThemeProvider>,
      );

      const flightPath = getByTestId('flight-path-visualization');
      expect(flightPath).toBeTruthy();

      // In compact mode, should have transparent background (no rectangular box)
      const containerStyle = flightPath.props.style;
      expect(containerStyle.backgroundColor).toBe('transparent');
      expect(containerStyle.borderWidth).toBe(0);
    });

    it('should display flight numbers correctly', () => {
      const { getByText } = render(
        <ThemeProvider>
          <DiscCard disc={mockDisc} />
        </ThemeProvider>,
      );

      expect(getByText('12')).toBeTruthy(); // Speed
      expect(getByText('5')).toBeTruthy(); // Glide
      expect(getByText('-1')).toBeTruthy(); // Turn
      expect(getByText('3')).toBeTruthy(); // Fade
    });

    it('should handle discs with minimal data', () => {
      const minimalDisc = {
        model: 'Test Disc',
        brand: 'Test Brand',
      };

      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <DiscCard disc={minimalDisc} />
        </ThemeProvider>,
      );

      expect(getByText('Test Disc')).toBeTruthy();
      expect(getByText('Test Brand')).toBeTruthy();
      expect(getByTestId('flight-path-visualization')).toBeTruthy();
    });
  });
});
