/**
 * RankIndicator Component Tests
 */

import { render } from '@testing-library/react-native';
import RankIndicator from '../../../src/design-system/components/RankIndicator';

describe('RankIndicator component', () => {
  it('should export a component', () => {
    expect(RankIndicator).toBeTruthy();
  });

  describe('rank performance classification', () => {
    it('should classify rank 1 as excellent performance', () => {
      const { getByTestId } = render(<RankIndicator rank={1} totalPlayers={4} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator).toBeTruthy();
      expect(indicator.props.accessibilityLabel).toContain('Excellent performance');
    });

    it('should classify top 33% as good performance', () => {
      const { getByTestId } = render(<RankIndicator rank={2} totalPlayers={6} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.accessibilityLabel).toContain('Good performance');
    });

    it('should classify bottom ranks as needs improvement', () => {
      const { getByTestId } = render(<RankIndicator rank={6} totalPlayers={6} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.accessibilityLabel).toContain('Needs improvement');
    });
  });

  describe('shape+color accessibility', () => {
    it('should display yellow circle emoji for excellent performance (rank 1)', () => {
      const { getByTestId } = render(<RankIndicator rank={1} totalPlayers={4} />);
      const indicator = getByTestId('rank-indicator');
      const textElement = indicator.findByType('Text');
      expect(textElement.props.children).toBe('🟡');
    });

    it('should display green circle emoji for good performance', () => {
      const { getByTestId } = render(<RankIndicator rank={2} totalPlayers={6} />);
      const indicator = getByTestId('rank-indicator');
      const textElement = indicator.findByType('Text');
      expect(textElement.props.children).toBe('🟢');
    });

    it('should display red circle emoji for needs improvement', () => {
      const { getByTestId } = render(<RankIndicator rank={6} totalPlayers={6} />);
      const indicator = getByTestId('rank-indicator');
      const textElement = indicator.findByType('Text');
      expect(textElement.props.children).toBe('🔴');
    });

    it('should include shape and color description in accessibility label', () => {
      const { getByTestId } = render(<RankIndicator rank={1} totalPlayers={4} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.accessibilityLabel).toContain('Yellow circle');
    });

    it('should provide complete accessibility context', () => {
      const { getByTestId } = render(<RankIndicator rank={2} totalPlayers={6} />);
      const indicator = getByTestId('rank-indicator');
      const label = indicator.props.accessibilityLabel;
      expect(label).toContain('Rank 2 of 6');
      expect(label).toContain('Green circle');
      expect(label).toContain('Good performance');
    });
  });

  describe('WCAG AA compliance', () => {
    it('should have minimum 44x44pt touch target size', () => {
      const { getByTestId } = render(<RankIndicator rank={1} totalPlayers={4} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.style.minWidth).toBe(44);
      expect(indicator.props.style.minHeight).toBe(44);
    });

    it('should use proper accessibility role', () => {
      const { getByTestId } = render(<RankIndicator rank={1} totalPlayers={4} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.accessibilityRole).toBe('text');
    });

    it('should support custom size while maintaining minimum touch target', () => {
      const { getByTestId } = render(<RankIndicator rank={1} totalPlayers={4} size={30} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.style.minWidth).toBe(44);
      expect(indicator.props.style.minHeight).toBe(44);
    });

    it('should have proper accessibility traits for screen readers', () => {
      const { getByTestId } = render(<RankIndicator rank={1} totalPlayers={4} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.accessibilityRole).toBe('text');
      expect(indicator.props.accessibilityLabel).toBeTruthy();
      expect(indicator.props.accessibilityLabel.length).toBeGreaterThan(0);
    });

    it('should handle edge cases in accessibility labels', () => {
      const { getByTestId } = render(<RankIndicator rank={null} totalPlayers={null} />);
      const indicator = getByTestId('rank-indicator');
      expect(indicator.props.accessibilityLabel).toContain('Performance unknown');
    });
  });
});
