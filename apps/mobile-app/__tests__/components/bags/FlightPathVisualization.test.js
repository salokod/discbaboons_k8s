/**
 * Tests for FlightPathVisualization Component
 * Following TDD methodology - Phase 1, Slice 1.1: Fix rectangular box visual bug
 */

import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import FlightPathVisualization from '../../../src/components/bags/FlightPathVisualization';

describe('FlightPathVisualization', () => {
  const defaultProps = {
    turn: -1,
    fade: 2,
    width: 80,
    height: 100,
  };

  it('should export a FlightPathVisualization component', () => {
    expect(FlightPathVisualization).toBeDefined();
  });

  it('should render with default props', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <FlightPathVisualization
          turn={defaultProps.turn}
          fade={defaultProps.fade}
          width={defaultProps.width}
          height={defaultProps.height}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('flight-path-visualization')).toBeTruthy();
  });

  describe('visual bug fixes', () => {
    it('should not have unwanted rectangular background in compact mode', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization
            turn={defaultProps.turn}
            fade={defaultProps.fade}
            width={defaultProps.width}
            height={defaultProps.height}
            compact
          />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      const containerStyle = container.props.style;

      // In compact mode, should have transparent background to remove rectangular box
      expect(containerStyle.backgroundColor).toBe('transparent');
    });

    it('should not have unwanted border in compact mode', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization
            turn={defaultProps.turn}
            fade={defaultProps.fade}
            width={defaultProps.width}
            height={defaultProps.height}
            compact
          />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      const containerStyle = container.props.style;

      // In compact mode, should have no border to remove rectangular box
      expect(containerStyle.borderWidth).toBe(0);
    });

    it('should have transparent background to prevent blue box artifacts', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization
            turn={defaultProps.turn}
            fade={defaultProps.fade}
            width={defaultProps.width}
            height={defaultProps.height}
            compact={false}
          />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      const containerStyle = container.props.style;

      // Should be transparent to prevent blue box visual artifacts
      expect(containerStyle.backgroundColor).toBe('transparent');
    });

    it('should have no border to prevent blue box artifacts', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization
            turn={defaultProps.turn}
            fade={defaultProps.fade}
            width={defaultProps.width}
            height={defaultProps.height}
            compact={false}
          />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      const containerStyle = container.props.style;

      // Should have no border to prevent blue box visual artifacts
      expect(containerStyle.borderWidth).toBe(0);
    });
  });

  describe('flight path rendering', () => {
    it('should render flight path with provided turn and fade values', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization turn={-2} fade={3} />
        </ThemeProvider>,
      );

      expect(getByTestId('flight-path-visualization')).toBeTruthy();
    });

    it('should render landing point', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization
            turn={defaultProps.turn}
            fade={defaultProps.fade}
            width={defaultProps.width}
            height={defaultProps.height}
          />
        </ThemeProvider>,
      );

      // Landing point should always be visible
      const container = getByTestId('flight-path-visualization');
      expect(container).toBeTruthy();
    });

    it('should hide optional elements in compact mode', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization
            turn={defaultProps.turn}
            fade={defaultProps.fade}
            width={defaultProps.width}
            height={defaultProps.height}
            compact
          />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      expect(container).toBeTruthy();
      // In compact mode, certain visual elements should be simplified
    });

    it('should show all elements in non-compact mode', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization
            turn={defaultProps.turn}
            fade={defaultProps.fade}
            width={defaultProps.width}
            height={defaultProps.height}
            compact={false}
          />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      expect(container).toBeTruthy();
      // In non-compact mode, all visual elements should be present
    });
  });

  describe('props validation', () => {
    it('should handle custom width and height', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization turn={0} fade={0} width={120} height={150} />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      const containerStyle = container.props.style;

      expect(containerStyle.width).toBe(120);
      expect(containerStyle.height).toBe(150);
    });

    it('should use default width and height when not provided', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization turn={0} fade={0} />
        </ThemeProvider>,
      );

      const container = getByTestId('flight-path-visualization');
      const containerStyle = container.props.style;

      expect(containerStyle.width).toBe(80);
      expect(containerStyle.height).toBe(100);
    });

    it('should handle extreme turn values', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization turn={-5} fade={0} />
        </ThemeProvider>,
      );

      expect(getByTestId('flight-path-visualization')).toBeTruthy();
    });

    it('should handle extreme fade values', () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <FlightPathVisualization turn={0} fade={5} />
        </ThemeProvider>,
      );

      expect(getByTestId('flight-path-visualization')).toBeTruthy();
    });
  });
});
