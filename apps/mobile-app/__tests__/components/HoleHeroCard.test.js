/**
 * HoleHeroCard Component Tests
 */

import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import HoleHeroCard from '../../src/components/scorecard/HoleHeroCard';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('HoleHeroCard component', () => {
  it('should export a HoleHeroCard component', () => {
    const HoleHeroCardModule = require('../../src/components/scorecard/HoleHeroCard');
    expect(HoleHeroCardModule.default).toBeDefined();
    expect(typeof HoleHeroCardModule.default).toBe('function');
  });

  it('should render with basic props', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <HoleHeroCard
          holeNumber={5}
          par={4}
          saveStatus="saved"
          currentHole={5}
          totalHoles={18}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('hole-hero-card')).toBeTruthy();
  });

  it('should render hole number with 64px font size for outdoor visibility', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <HoleHeroCard
          holeNumber={5}
          par={4}
          saveStatus="saved"
          currentHole={5}
          totalHoles={18}
        />
      </ThemeProvider>,
    );

    const holeNumber = getByTestId('hole-number');
    const style = StyleSheet.flatten(holeNumber.props.style);
    expect(style.fontSize).toBe(64);
  });

  it('should render par text with 24px font size', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <HoleHeroCard
          holeNumber={5}
          par={4}
          saveStatus="saved"
          currentHole={5}
          totalHoles={18}
        />
      </ThemeProvider>,
    );

    const parText = getByTestId('par-text');
    const style = StyleSheet.flatten(parText.props.style);
    expect(style.fontSize).toBe(24);
  });
});
