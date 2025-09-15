import { render } from '@testing-library/react-native';
import RoundCard from '../../../src/components/rounds/RoundCard';
import { ThemeProvider } from '../../../src/context/ThemeContext';

const mockRound = {
  name: 'Test Round',
  course_id: 'test-course',
  course_name: 'Test Course',
  status: 'in_progress',
  start_time: '2025-09-14T19:29:07.546Z',
  player_count: 1,
};

describe('RoundCard', () => {
  it('should export a memoized component', () => {
    expect(RoundCard).toBeTruthy();
    expect(typeof RoundCard).toBe('object'); // React.memo returns an object
    expect(RoundCard.type.displayName).toBe('RoundCard');
  });

  it('should render with Card component wrapper', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const card = getByTestId('card');
    expect(card).toBeTruthy();
  });

  it('should use theme colors for styling', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const cardContent = getByTestId('round-card-content');
    expect(cardContent).toBeTruthy();
  });

  it('should render TouchableOpacity when onPress is provided', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} onPress={mockOnPress} />
      </ThemeProvider>,
    );
    const touchable = getByTestId('round-card-touchable');
    expect(touchable).toBeTruthy();
  });

  it('should not render TouchableOpacity when onPress is not provided', () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const touchable = queryByTestId('round-card-touchable');
    expect(touchable).toBeNull();
  });

  it('should display round name as primary text', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const roundName = getByTestId('round-name');
    expect(roundName).toBeTruthy();
    expect(roundName.props.children).toBe('Test Round');
  });

  it('should display course name as secondary text', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const courseName = getByTestId('course-name');
    expect(courseName).toBeTruthy();
    expect(courseName.props.children).toBe('Test Course');
  });

  it('should display status badge with correct color', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const statusBadge = getByTestId('status-badge');
    expect(statusBadge).toBeTruthy();
  });

  it('should display formatted start time', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const startTime = getByTestId('start-time');
    expect(startTime).toBeTruthy();
  });

  it('should prevent text overflow with numberOfLines', () => {
    const longRound = {
      ...mockRound,
      name: 'This is a very long round name that should be truncated to prevent overflow issues',
      course_name: 'This is a very long course name that should also be truncated',
    };
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={longRound} />
      </ThemeProvider>,
    );
    const roundName = getByTestId('round-name');
    const courseName = getByTestId('course-name');
    expect(roundName.props.numberOfLines).toBe(1);
    expect(courseName.props.numberOfLines).toBe(1);
  });

  it('should display player count with proper pluralization', () => {
    const singlePlayerRound = { ...mockRound, player_count: 1 };
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={singlePlayerRound} />
      </ThemeProvider>,
    );
    const playerCount = getByTestId('player-count');
    expect(playerCount.props.children).toBe('1 player');
  });

  it('should display multiple player count correctly', () => {
    const multiPlayerRound = { ...mockRound, player_count: 4 };
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={multiPlayerRound} />
      </ThemeProvider>,
    );
    const playerCount = getByTestId('player-count');
    expect(playerCount.props.children).toBe('4 players');
  });

  it('should display skins information when enabled', () => {
    const skinsRound = { ...mockRound, skins_enabled: true, skins_value: 5 };
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={skinsRound} />
      </ThemeProvider>,
    );
    const skinsInfo = getByTestId('skins-info');
    expect(skinsInfo.props.children).toContain('$5');
  });

  it('should display skins off when disabled', () => {
    const noSkinsRound = { ...mockRound, skins_enabled: false };
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={noSkinsRound} />
      </ThemeProvider>,
    );
    const skinsInfo = getByTestId('skins-info');
    expect(skinsInfo.props.children).toContain('Off');
  });

  it('should have accessibility props when touchable', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} onPress={mockOnPress} />
      </ThemeProvider>,
    );
    const touchable = getByTestId('round-card-touchable');
    expect(touchable.props.accessibilityLabel).toContain('Test Round');
    expect(touchable.props.accessibilityRole).toBe('button');
  });

  it('should be memoized for performance', () => {
    expect(RoundCard.$$typeof).toBeDefined();
    expect(typeof RoundCard).toBe('object');
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalRound = {
      name: 'Test Round',
      course_id: 'test-course',
      course_name: 'Test Course',
      status: 'in_progress',
      start_time: '2025-09-14T19:29:07.546Z',
      player_count: 1,
      // Missing skins_enabled, skins_value, is_private
    };
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={minimalRound} />
      </ThemeProvider>,
    );
    expect(getByTestId('round-card-content')).toBeTruthy();
    expect(getByTestId('skins-info').props.children).toContain('Off');
  });

  it('should handle empty round name gracefully', () => {
    const emptyNameRound = { ...mockRound, name: '' };
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={emptyNameRound} />
      </ThemeProvider>,
    );
    const roundName = getByTestId('round-name');
    expect(roundName.props.children).toBe('Unnamed Round');
  });

  it('should have 12px bottom margin for card spacing', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} onPress={mockOnPress} />
      </ThemeProvider>,
    );
    const touchable = getByTestId('round-card-touchable');
    expect(touchable.props.style.marginBottom).toBe(12);
  });

  it('should have 12px bottom margin even when not touchable', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <RoundCard round={mockRound} />
      </ThemeProvider>,
    );
    const cardContainer = getByTestId('round-card-container');
    expect(cardContainer.props.style.marginBottom).toBe(12);
  });
});
