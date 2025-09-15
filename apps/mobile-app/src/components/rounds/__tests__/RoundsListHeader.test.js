import { render } from '@testing-library/react-native';
import RoundsListHeader from '../RoundsListHeader';

// Mock ThemeContext
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    border: '#E1E1E1',
  }),
}));

describe('RoundsListHeader', () => {
  it('should export a component', () => {
    expect(RoundsListHeader).toBeDefined();
    expect(typeof RoundsListHeader).toBe('object'); // memo returns an object
  });

  it('should render "My Rounds" title', () => {
    const { getByText } = render(<RoundsListHeader />);

    expect(getByText('My Rounds')).toBeTruthy();
  });

  it('should display round count with proper pluralization', () => {
    // Test singular
    const { getByText: getByText1 } = render(<RoundsListHeader roundCount={1} />);
    expect(getByText1('1 round')).toBeTruthy();

    // Test plural
    const { getByText: getByText2 } = render(<RoundsListHeader roundCount={12} />);
    expect(getByText2('12 rounds')).toBeTruthy();

    // Test zero
    const { getByText: getByText3 } = render(<RoundsListHeader roundCount={0} />);
    expect(getByText3('0 rounds')).toBeTruthy();
  });

  it('should apply design system styling', () => {
    const { getByTestId } = render(<RoundsListHeader roundCount={12} />);

    expect(getByTestId('header-title')).toBeTruthy();
    expect(getByTestId('header-count')).toBeTruthy();
  });
});
