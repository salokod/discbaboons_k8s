import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import RunningTotalDisplay from '../../../src/components/scorecard/RunningTotalDisplay';

const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
  </ThemeProvider>,
);

describe('RunningTotalDisplay', () => {
  it('should export a memoized component', () => {
    expect(typeof RunningTotalDisplay).toBe('object');
    expect(RunningTotalDisplay.type.displayName).toBe('RunningTotalDisplay');
  });

  it('should render with testID running-total-display', () => {
    const { getByTestId } = renderWithTheme(<RunningTotalDisplay runningTotal={3} />);
    expect(getByTestId('running-total-display')).toBeOnTheScreen();
  });

  it('should accept runningTotal prop', () => {
    expect(() => renderWithTheme(
      <RunningTotalDisplay runningTotal={3} />,
    )).not.toThrow();
  });

  it('should display relative score +3 for 3 over par', () => {
    const { getByText } = renderWithTheme(<RunningTotalDisplay runningTotal={3} />);
    expect(getByText('+3')).toBeOnTheScreen();
  });

  it('should display relative score -2 for 2 under par', () => {
    const { getByText } = renderWithTheme(<RunningTotalDisplay runningTotal={-2} />);
    expect(getByText('-2')).toBeOnTheScreen();
  });

  it('should display E for even par', () => {
    const { getByText } = renderWithTheme(<RunningTotalDisplay runningTotal={0} />);
    expect(getByText('E')).toBeOnTheScreen();
  });

  it('should not display absolute total in parentheses', () => {
    const { queryByText } = renderWithTheme(<RunningTotalDisplay runningTotal={3} />);
    expect(queryByText('(48)')).not.toBeOnTheScreen();
  });

  it('should use theme colors', () => {
    const { getByTestId } = renderWithTheme(<RunningTotalDisplay runningTotal={3} />);
    const container = getByTestId('running-total-display');
    expect(container).toHaveStyle({ backgroundColor: expect.anything() });
  });
});
