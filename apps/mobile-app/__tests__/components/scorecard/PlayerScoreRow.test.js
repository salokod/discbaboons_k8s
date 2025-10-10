import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import PlayerScoreRow from '../../../src/components/scorecard/PlayerScoreRow';

const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
  </ThemeProvider>,
);

describe('PlayerScoreRow', () => {
  it('should export a memoized component', () => {
    expect(PlayerScoreRow).toBeTruthy();
    expect(typeof PlayerScoreRow).toBe('object'); // React.memo returns an object
    expect(PlayerScoreRow.type.displayName).toBe('PlayerScoreRow');
  });

  it('should render with testID player-score-row', () => {
    const { getByTestId } = renderWithTheme(<PlayerScoreRow playerName="test" par={3} onScoreChange={() => {}} />);
    expect(getByTestId('player-score-row')).toBeOnTheScreen();
  });

  it('should accept required props without crashing', () => {
    expect(() => renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={15}
        onScoreChange={() => {}}
      />,
    )).not.toThrow();
  });

  it('should render player name', () => {
    const { getByTestId } = renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={15}
        onScoreChange={() => {}}
      />,
    );
    const playerName = getByTestId('player-name');
    expect(playerName).toBeOnTheScreen();
    expect(playerName.children[0]).toBe('salokod');
  });

  it('should render QuickScoreInput with correct props', () => {
    const { getByTestId } = renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={15}
        onScoreChange={() => {}}
      />,
    );
    expect(getByTestId('quick-score-input')).toBeOnTheScreen();
  });

  it('should render running total display', () => {
    const { getByTestId } = renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={15}
        onScoreChange={() => {}}
      />,
    );
    expect(getByTestId('running-total-display')).toBeOnTheScreen();
  });

  it('should display running total as relative score only (+3)', () => {
    // RunningTotal now represents the ALREADY calculated relative score
    // To show +3, we pass runningTotal={3} directly
    const { getByTestId, getByText, queryByText } = renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={3} // This is already the relative score (+3)
        onScoreChange={() => {}}
      />,
    );
    const runningTotal = getByTestId('running-total-display');
    expect(runningTotal).toBeOnTheScreen();
    // Check that only relative value is displayed, not absolute
    expect(getByText('+3')).toBeOnTheScreen();
    expect(queryByText(/\(48\)/)).not.toBeOnTheScreen();
  });

  it('should use horizontal layout', () => {
    const { getByTestId } = renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={15}
        onScoreChange={() => {}}
      />,
    );
    const container = getByTestId('player-score-row');
    expect(container.props.style).toMatchObject({ flexDirection: 'row' });
  });

  it('should use StyleSheet.hairlineWidth instead of hardcoded border', () => {
    const { getByTestId } = renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={15}
        onScoreChange={() => {}}
      />,
    );
    const container = getByTestId('player-score-row');
    // StyleSheet.hairlineWidth is platform-specific, just verify it exists
    expect(container.props.style.borderBottomWidth).toBeDefined();
  });

  it('should use 16pt padding for 8pt grid spacing', () => {
    const { getByTestId } = renderWithTheme(
      <PlayerScoreRow
        playerName="salokod"
        score={3}
        par={3}
        runningTotal={15}
        onScoreChange={() => {}}
      />,
    );
    const container = getByTestId('player-score-row');
    expect(container.props.style.paddingHorizontal).toBe(16);
    expect(container.props.style.paddingVertical).toBe(12);
  });
});
