/**
 * PlayerScoreRow Component Tests
 */

import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import PlayerScoreRow from '../../src/components/scorecard/PlayerScoreRow';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('PlayerScoreRow component', () => {
  it('should export a PlayerScoreRow component', () => {
    const PlayerScoreRowModule = require('../../src/components/scorecard/PlayerScoreRow');
    expect(PlayerScoreRowModule.default).toBeDefined();
    // memo returns a component, so type can vary
    expect(PlayerScoreRowModule.default).toBeTruthy();
  });

  it('should render with basic props', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <PlayerScoreRow
          playerName="Alice"
          score={3}
          par={3}
          runningTotal={0}
          onScoreChange={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(getByTestId('player-score-row')).toBeTruthy();
  });

  it('should render player name with bold font weight (700)', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <PlayerScoreRow
          playerName="Alice"
          score={3}
          par={3}
          runningTotal={0}
          onScoreChange={jest.fn()}
        />
      </ThemeProvider>,
    );

    const playerName = getByTestId('player-name');
    const style = StyleSheet.flatten(playerName.props.style);
    expect(style.fontWeight).toBe('700');
  });

  it('should display player name text', () => {
    const { getByTestId } = render(
      <ThemeProvider testMode>
        <PlayerScoreRow
          playerName="Alice"
          score={3}
          par={3}
          runningTotal={0}
          onScoreChange={jest.fn()}
        />
      </ThemeProvider>,
    );

    const playerName = getByTestId('player-name');
    expect(playerName.props.children).toBe('Alice');
  });
});
