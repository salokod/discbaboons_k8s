/**
 * RoundsListScreen Tests
 */

import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RoundsListScreen from '../RoundsListScreen';
import { getRounds } from '../../../services/roundService';

// Mock roundService
jest.mock('../../../services/roundService', () => ({
  getRounds: jest.fn(),
}));

// Mock React Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock ThemeContext
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textLight: '#8E8E93',
    primary: '#007AFF',
    white: '#FFFFFF',
  })),
}));

// Mock SkeletonCard component
jest.mock('../../../components/rounds/SkeletonCard', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return function SkeletonCard() {
    return ReactLocal.createElement(View, { testID: 'skeleton-card' });
  };
});

// Mock StatusBarSafeView
jest.mock('../../../components/StatusBarSafeView', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return function StatusBarSafeView({ children }) {
    return ReactLocal.createElement(View, { testID: 'status-bar-safe-view' }, children);
  };
});

// Mock RoundCard component
jest.mock('../../../components/rounds/RoundCard', () => {
  const ReactLocal = require('react');
  const { TouchableOpacity } = require('react-native');
  return function RoundCard({ round, onPress }) {
    return ReactLocal.createElement(TouchableOpacity, {
      testID: `round-card-${round.id}`,
      onPress: () => onPress?.(round),
    });
  };
});

// Mock Icon component
jest.mock('@react-native-vector-icons/ionicons', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return function Icon({ name, size, color }) {
    return ReactLocal.createElement(View, {
      testID: 'icon',
      'data-name': name,
      'data-size': size,
      'data-color': color,
    });
  };
});

describe('RoundsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    getRounds.mockResolvedValue({
      rounds: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
    // Setup navigation mock
    useNavigation.mockReturnValue({
      navigate: mockNavigate,
    });
  });

  it('should export RoundsListScreen component', () => {
    expect(RoundsListScreen).toBeTruthy();
  });

  it('should show 3 SkeletonCard components while loading', () => {
    const { getAllByTestId } = render(<RoundsListScreen />);

    const skeletonCards = getAllByTestId('skeleton-card');
    expect(skeletonCards).toHaveLength(3);
  });

  it('should call getRounds on component mount', async () => {
    render(<RoundsListScreen />);

    await waitFor(() => {
      expect(getRounds).toHaveBeenCalledTimes(1);
    });
  });

  it('should render FlatList with RoundCard for each round', async () => {
    const mockRounds = [
      {
        id: 'round-1',
        name: 'Morning Round',
        course_id: 'course-1',
        course_name: 'Test Course',
        status: 'in_progress',
        start_time: '2024-01-15T10:00:00Z',
        player_count: 2,
        skins_enabled: false,
      },
      {
        id: 'round-2',
        name: 'Evening Round',
        course_id: 'course-2',
        course_name: 'Another Course',
        status: 'completed',
        start_time: '2024-01-16T18:00:00Z',
        player_count: 4,
        skins_enabled: true,
        skins_value: 5,
      },
    ];

    getRounds.mockResolvedValue({
      rounds: mockRounds,
      pagination: {
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });

    const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(queryByTestId('skeleton-card')).toBeNull();
    });

    // Verify FlatList is rendered
    expect(getByTestId('rounds-flatlist')).toBeTruthy();

    // Verify RoundCard components are rendered for each round
    expect(getByTestId('round-card-round-1')).toBeTruthy();
    expect(getByTestId('round-card-round-2')).toBeTruthy();
  });

  it('should navigate to RoundDetail when card is pressed', async () => {
    const mockRounds = [
      {
        id: 'round-123',
        name: 'Test Round',
        course_id: 'course-1',
        course_name: 'Test Course',
        status: 'in_progress',
        start_time: '2024-01-15T10:00:00Z',
        player_count: 2,
        skins_enabled: false,
      },
    ];

    getRounds.mockResolvedValue({
      rounds: mockRounds,
      pagination: {
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });

    const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(queryByTestId('skeleton-card')).toBeNull();
    });

    // Press the round card
    const roundCard = getByTestId('round-card-round-123');
    fireEvent.press(roundCard);

    // Verify navigation was called with correct params
    // Should navigate to ScorecardRedesign for in_progress rounds
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('ScorecardRedesign', {
      roundId: 'round-123',
    });
  });

  describe('Header Create Button - Slice 1: Render without onCreatePress prop', () => {
    it('should render without onCreatePress prop', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });

      const { queryByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      // Should render without errors
      expect(queryByTestId('rounds-flatlist')).toBeTruthy();
    });
  });

  describe('Header Create Button - Slice 2: Render Create Button', () => {
    it('should render header with title, count, and create button', async () => {
      const mockRounds = [
        {
          id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
        },
        {
          id: 'round-2', name: 'Round 2', course_id: 'course-2', course_name: 'Course 2', status: 'completed', start_time: '2024-01-16T18:00:00Z', player_count: 4, skins_enabled: true, skins_value: 5,
        },
      ];

      getRounds.mockResolvedValue({
        rounds: mockRounds,
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('Your Rounds')).toBeTruthy();
      expect(getByText('2 rounds')).toBeTruthy();
      expect(queryByTestId('create-round-header-button')).toBeTruthy();
    });

    it('should display singular "round" for count of 1', async () => {
      const mockRounds = [
        {
          id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
        },
      ];

      getRounds.mockResolvedValue({
        rounds: mockRounds,
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('1 round')).toBeTruthy();
    });
  });

  describe('Header Create Button - Slice 3: Add testID and accessibility', () => {
    it('should have accessibility label on create button', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const button = getByTestId('create-round-header-button');
      expect(button.props.accessibilityLabel).toBe('Create new round');
    });

    it('should have accessibility hint on create button', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const button = getByTestId('create-round-header-button');
      expect(button.props.accessibilityHint).toBe('Start a new round of disc golf');
    });
  });

  describe('Header Create Button - Slice 4: Wire up navigation callback', () => {
    it('should navigate to CreateRound when button is pressed', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const button = getByTestId('create-round-header-button');
      fireEvent.press(button);

      expect(mockNavigate).toHaveBeenCalledWith('CreateRound');
    });

    it('should navigate to CreateRound on each button press', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const button = getByTestId('create-round-header-button');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenCalledWith('CreateRound');
    });
  });

  describe('Header Create Button - Slice 5: Apply primary variant', () => {
    it('should have primary color background', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const button = getByTestId('create-round-header-button');
      expect(button.props.style.backgroundColor).toBe('#007AFF');
    });
  });

  describe('Header Create Button - Slice 6: Always render header', () => {
    it('should always render header even when onCreatePress is undefined', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('Your Rounds')).toBeTruthy();
      expect(getByText('1 round')).toBeTruthy();
      expect(queryByTestId('create-round-header-button')).toBeTruthy();
      expect(queryByTestId('rounds-flatlist')).toBeTruthy();
    });

    it('should always render header with zero rounds', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('Your Rounds')).toBeTruthy();
      expect(queryByTestId('create-round-header-button')).toBeTruthy();
    });

    it('should render header with multiple rounds', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
          },
          {
            id: 'round-2', name: 'Round 2', course_id: 'course-2', course_name: 'Course 2', status: 'completed', start_time: '2024-01-16T18:00:00Z', player_count: 4, skins_enabled: true,
          },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('Your Rounds')).toBeTruthy();
      expect(queryByTestId('create-round-header-button')).toBeTruthy();
    });
  });

  describe('Header Create Button - Slice 7: Layout and spacing', () => {
    it('should render header title and count with correct text styles', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
          },
          {
            id: 'round-2', name: 'Round 2', course_id: 'course-2', course_name: 'Course 2', status: 'completed', start_time: '2024-01-16T18:00:00Z', player_count: 4, skins_enabled: true,
          },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const titleElement = getByText('Your Rounds');
      const countElement = getByText('2 rounds');

      // Verify title has bold font and larger size
      expect(titleElement.props.style.fontWeight).toBe('bold');
      expect(titleElement.props.style.fontSize).toBe(24);

      // Verify count has correct size
      expect(countElement.props.style.fontSize).toBe(16);
    });

    it('should have button with correct dimensions', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const button = getByTestId('create-round-header-button');
      expect(button.props.style.width).toBe(44);
      expect(button.props.style.height).toBe(44);
    });

    it('should have platform-specific border radius on button', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const button = getByTestId('create-round-header-button');
      // iOS: 12px, Android: 22px
      const expectedRadius = Platform.OS === 'ios' ? 12 : 22;
      expect(button.props.style.borderRadius).toBe(expectedRadius);
    });
  });
});
