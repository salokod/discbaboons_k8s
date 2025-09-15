import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../context/ThemeContext';
import RoundListItem from '../RoundListItem';

// Helper function to render component with ThemeProvider
const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('RoundListItem', () => {
  it('should export a component', () => {
    expect(RoundListItem).toBeTruthy();
    // React.memo returns an object, not a function
    expect(typeof RoundListItem).toBe('object');
  });

  it('should show status badge with correct color for active round', () => {
    const round = {
      id: 1,
      status: 'in_progress',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const statusBadge = getByTestId('status-badge');

    expect(statusBadge).toBeTruthy();
    expect(statusBadge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#ec7032',
        }),
      ]),
    );
  });

  it('should show status badge with correct color for completed round', () => {
    const round = {
      id: 1,
      status: 'completed',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const statusBadge = getByTestId('status-badge');

    expect(statusBadge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#4CAF50',
        }),
      ]),
    );
  });

  it('should show status badge with correct color for cancelled round', () => {
    const round = {
      id: 1,
      status: 'cancelled',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const statusBadge = getByTestId('status-badge');

    expect(statusBadge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#D32F2F',
        }),
      ]),
    );
  });

  it('should display round name when provided', () => {
    const round = {
      id: 1,
      name: 'Morning Round',
      status: 'active',
      course_id: 'prospect-park',
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const roundName = getByTestId('round-name');

    expect(roundName).toBeTruthy();
    expect(roundName.props.children).toBe('Morning Round');
  });

  it('should display fallback name when round name is empty', () => {
    const round = {
      id: 1,
      name: '',
      status: 'active',
      course_id: 'prospect-park',
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const roundName = getByTestId('round-name');

    expect(roundName).toBeTruthy();
    expect(roundName.props.children).toBe('Unnamed Round');
  });

  it('should display course name when course_id is provided', () => {
    const round = {
      id: 1,
      name: 'Morning Round',
      status: 'active',
      course_id: 'prospect-park',
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const courseName = getByTestId('course-name');

    expect(courseName).toBeTruthy();
    expect(courseName.props.children).toBe('Prospect Park');
  });

  it('should display original course_id when no mapping exists', () => {
    const round = {
      id: 1,
      name: 'Evening Round',
      status: 'active',
      course_id: 'unknown-course',
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const courseName = getByTestId('course-name');

    expect(courseName).toBeTruthy();
    expect(courseName.props.children).toBe('unknown-course');
  });

  it('should display formatted start time', () => {
    const round = {
      id: 1,
      name: 'Test Round',
      status: 'active',
      course_id: 'prospect-park',
      start_time: '2024-01-15T14:30:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const startTime = getByTestId('start-time');

    expect(startTime).toBeTruthy();
    // The exact format will depend on the date formatter implementation
    expect(startTime.props.children).toMatch(/Started/);
  });

  it('should show status icon for in_progress status', () => {
    const round = {
      id: 1,
      status: 'in_progress',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const statusIcon = getByTestId('status-icon');

    expect(statusIcon).toBeTruthy();
    expect(statusIcon.props.name).toBe('play-circle');
  });

  it('should show status icon for completed status', () => {
    const round = {
      id: 1,
      status: 'completed',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const statusIcon = getByTestId('status-icon');

    expect(statusIcon).toBeTruthy();
    expect(statusIcon.props.name).toBe('checkmark-circle');
  });

  it('should show status icon for cancelled status', () => {
    const round = {
      id: 1,
      status: 'cancelled',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const statusIcon = getByTestId('status-icon');

    expect(statusIcon).toBeTruthy();
    expect(statusIcon.props.name).toBe('close-circle');
  });

  it('should show player count badge with correct text for single player', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 1,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const playerBadge = getByTestId('player-count-badge');
    const playerText = getByTestId('player-count-text');

    expect(playerBadge).toBeTruthy();
    expect(playerText.props.children).toBe('1 player');
  });

  it('should show player count badge with correct text for multiple players', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 4,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const playerBadge = getByTestId('player-count-badge');
    const playerText = getByTestId('player-count-text');

    expect(playerBadge).toBeTruthy();
    expect(playerText.props.children).toBe('4 players');
  });

  it('should show people icon in player count badge', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const playerIcon = getByTestId('player-count-icon');

    expect(playerIcon).toBeTruthy();
    expect(playerIcon.props.name).toBe('people');
  });

  it('should show skins badge when skins are enabled', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
      skins_enabled: true,
      skins_value: 5,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const skinsBadge = getByTestId('skins-badge');
    const skinsText = getByTestId('skins-text');

    expect(skinsBadge).toBeTruthy();
    expect(skinsText.props.children).toEqual(['Skins', ' ', '$5']);
  });

  it('should show skins off badge when skins are disabled', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
      skins_enabled: false,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const skinsBadge = getByTestId('skins-badge');
    const skinsText = getByTestId('skins-text');

    expect(skinsBadge).toBeTruthy();
    expect(skinsText.props.children).toEqual(['Skins', ' ', 'Off']);
  });

  it('should show cash icon for enabled skins badge', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
      skins_enabled: true,
      skins_amount: 10,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const skinsIcon = getByTestId('skins-icon');

    expect(skinsIcon).toBeTruthy();
    expect(skinsIcon.props.name).toBe('cash');
  });

  it('should show close icon for disabled skins badge', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
      skins_enabled: false,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const skinsIcon = getByTestId('skins-icon');

    expect(skinsIcon).toBeTruthy();
    expect(skinsIcon.props.name).toBe('close-circle');
  });

  it('should show privacy indicator for private rounds', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
      is_private: true,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const privacyIndicator = getByTestId('privacy-indicator');

    expect(privacyIndicator).toBeTruthy();
    expect(privacyIndicator.props.name).toBe('lock-closed');
  });

  it('should not show privacy indicator for public rounds', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
      is_private: false,
    };

    const { queryByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const privacyIndicator = queryByTestId('privacy-indicator');

    expect(privacyIndicator).toBeNull();
  });

  it('should not show privacy indicator when is_private is undefined', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
    };

    const { queryByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const privacyIndicator = queryByTestId('privacy-indicator');

    expect(privacyIndicator).toBeNull();
  });

  it('should have professional card layout with proper spacing', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
      skins_enabled: true,
      skins_value: 5,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const container = getByTestId('round-card-container');
    const badgeContainer = getByTestId('badge-container');

    expect(container).toBeTruthy();
    expect(badgeContainer).toBeTruthy();

    // Check that container has proper styling
    expect(container.props.style).toEqual(
      expect.objectContaining({
        paddingVertical: 16,
        paddingHorizontal: 16,
      }),
    );
  });

  it('should render TouchableOpacity when onPress is provided', () => {
    const mockOnPress = jest.fn();
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
    };

    const { getByTestId } = renderWithTheme(<RoundListItem round={round} onPress={mockOnPress} />);
    const touchableCard = getByTestId('touchable-round-card');

    expect(touchableCard).toBeTruthy();
  });

  it('should not render TouchableOpacity when onPress is not provided', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 2,
    };

    const { queryByTestId } = renderWithTheme(<RoundListItem round={round} />);
    const touchableCard = queryByTestId('touchable-round-card');

    expect(touchableCard).toBeNull();
  });

  it('should be memoized to prevent unnecessary re-renders', () => {
    // Test that the component exports a memoized version
    // React.memo wraps components and returns an object
    expect(RoundListItem).toBeTruthy();
    expect(typeof RoundListItem).toBe('object');

    // Verify it has the characteristics of a memoized component
    expect(RoundListItem.$$typeof).toBeDefined();
  });
});
