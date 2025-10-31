/**
 * RoundsListScreen Tests
 */

import {
  render, waitFor, fireEvent, cleanup,
} from '@testing-library/react-native';
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

// Mock EmptyState component
jest.mock('../../../design-system/components/EmptyState', () => {
  const ReactLocal = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return function EmptyState({
    title, subtitle, actionLabel, onAction,
  }) {
    return ReactLocal.createElement(View, { testID: 'empty-state' }, [
      title && ReactLocal.createElement(Text, { key: 'title', testID: 'empty-state-title' }, title),
      subtitle && ReactLocal.createElement(Text, { key: 'subtitle', testID: 'empty-state-subtitle' }, subtitle),
      actionLabel && onAction && ReactLocal.createElement(
        TouchableOpacity,
        { key: 'action', testID: 'empty-state-action', onPress: onAction },
        ReactLocal.createElement(Text, null, actionLabel),
      ),
    ]);
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

  afterEach(() => {
    cleanup();
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

  it('should navigate to Scorecard when in-progress card is pressed', async () => {
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
    // In-progress rounds navigate to Scorecard (Slice 14A: One-Page Round)
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Scorecard', {
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

      // Should render without errors - shows EmptyState when no rounds
      expect(queryByTestId('empty-state')).toBeTruthy();
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
    it('should always render header with one round', async () => {
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

  describe('Pull to Refresh - Slice 2.1: Refreshing state', () => {
    it('should have refreshing state initialized to false', async () => {
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

      const { queryByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const flatList = queryByTestId('rounds-flatlist');
      expect(flatList.props.refreshControl.props.refreshing).toBe(false);
    });
  });

  describe('Pull to Refresh - Slice 2.2: onRefresh handler', () => {
    it('should call getRounds when onRefresh is triggered', async () => {
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

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      getRounds.mockClear();

      const flatList = getByTestId('rounds-flatlist');
      await flatList.props.refreshControl.props.onRefresh();

      await waitFor(() => {
        expect(getRounds).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Pull to Refresh - Slice 2.3: Refreshing state during refresh', () => {
    it('should set refreshing to true during refresh', async () => {
      const mockRounds = [
        {
          id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
        },
      ];

      // Initial load
      getRounds.mockResolvedValueOnce({
        rounds: mockRounds,
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      // Setup promise for refresh
      let resolveGetRounds;
      const getRoundsPromise = new Promise((resolve) => {
        resolveGetRounds = resolve;
      });

      getRounds.mockReturnValue(getRoundsPromise);

      const flatList = getByTestId('rounds-flatlist');
      const refreshPromise = flatList.props.refreshControl.props.onRefresh();

      await waitFor(() => {
        expect(getByTestId('rounds-flatlist').props.refreshControl.props.refreshing).toBe(true);
      });

      resolveGetRounds({
        rounds: mockRounds,
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      await refreshPromise;

      await waitFor(() => {
        expect(getByTestId('rounds-flatlist').props.refreshControl.props.refreshing).toBe(false);
      });
    });
  });

  describe('Pull to Refresh - Slice 2.4: Keep existing rounds visible', () => {
    it('should keep existing rounds visible during refresh', async () => {
      const initialRounds = [
        {
          id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
        },
      ];

      const updatedRounds = [
        {
          id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
        },
        {
          id: 'round-2', name: 'Round 2', course_id: 'course-2', course_name: 'Course 2', status: 'in_progress', start_time: '2024-01-15T11:00:00Z', player_count: 3, skins_enabled: false,
        },
      ];

      getRounds.mockResolvedValueOnce({
        rounds: initialRounds,
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByTestId('round-card-round-1')).toBeTruthy();

      let resolveRefresh;
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });

      getRounds.mockReturnValue(refreshPromise);

      const flatList = getByTestId('rounds-flatlist');
      const onRefreshPromise = flatList.props.refreshControl.props.onRefresh();

      await waitFor(() => {
        expect(getByTestId('rounds-flatlist').props.refreshControl.props.refreshing).toBe(true);
      });

      expect(getByTestId('round-card-round-1')).toBeTruthy();

      resolveRefresh({
        rounds: updatedRounds,
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      await onRefreshPromise;

      await waitFor(() => {
        expect(getByTestId('round-card-round-1')).toBeTruthy();
        expect(getByTestId('round-card-round-2')).toBeTruthy();
      });
    });
  });

  describe('Pull to Refresh - Slice 2.5: Theme primary color', () => {
    it('should use theme primary color for refresh indicator', async () => {
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

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const flatList = getByTestId('rounds-flatlist');

      expect(flatList.props.refreshControl).toBeDefined();
      expect(flatList.props.refreshControl.props.tintColor).toBe('#007AFF');
    });
  });

  describe('Pull to Refresh - Slice 2.6: Error handling', () => {
    it('should keep existing rounds visible when refresh fails', async () => {
      const existingRounds = [
        {
          id: 'round-1', name: 'Round 1', course_id: 'course-1', course_name: 'Course 1', status: 'in_progress', start_time: '2024-01-15T10:00:00Z', player_count: 2, skins_enabled: false,
        },
      ];

      getRounds.mockResolvedValueOnce({
        rounds: existingRounds,
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByTestId('round-card-round-1')).toBeTruthy();

      getRounds.mockRejectedValueOnce(new Error('Network error'));

      const flatList = getByTestId('rounds-flatlist');

      await flatList.props.refreshControl.props.onRefresh();

      expect(getByTestId('round-card-round-1')).toBeTruthy();
      expect(getByTestId('rounds-flatlist').props.refreshControl.props.refreshing).toBe(false);
    });
  });

  describe('Empty State - Slice 3.1: Conditional rendering', () => {
    it('should render EmptyState when rounds array is empty', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(queryByTestId('empty-state')).toBeTruthy();
    });

    it('should hide FlatList when rounds array is empty', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(queryByTestId('rounds-flatlist')).toBeNull();
    });
  });

  describe('Empty State - Slice 3.2: Title and subtitle', () => {
    it('should display "No Active Rounds" title in EmptyState', async () => {
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

      expect(getByText('No Active Rounds')).toBeTruthy();
    });

    it('should display subtitle in EmptyState', async () => {
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

      expect(getByText('Start a new round to track your game')).toBeTruthy();
    });
  });

  describe('Empty State - Slice 3.3: Action button', () => {
    it('should display "Create New Round" button in EmptyState', async () => {
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

      expect(getByText('Create New Round')).toBeTruthy();
    });
  });

  describe('Empty State - Slice 3.4: Navigation', () => {
    it('should navigate to CreateRound when action button is pressed', async () => {
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

      const actionButton = getByTestId('empty-state-action');
      fireEvent.press(actionButton);

      expect(mockNavigate).toHaveBeenCalledWith('CreateRound');
    });
  });

  describe('Empty State - Slice 3.5: Not shown when rounds exist', () => {
    it('should hide EmptyState when rounds exist', async () => {
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

      const { queryByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(queryByTestId('empty-state')).toBeNull();
    });

    it('should show FlatList when rounds exist', async () => {
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

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByTestId('rounds-flatlist')).toBeTruthy();
    });
  });

  describe('Empty State - Slice 3.6: Header behavior', () => {
    it('should show header with "0 rounds" when EmptyState is displayed', async () => {
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
      expect(getByText('0 rounds')).toBeTruthy();
      expect(queryByTestId('empty-state')).toBeTruthy();
    });

    it('should show create button in header when EmptyState is displayed', async () => {
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

      expect(getByTestId('create-round-header-button')).toBeTruthy();
      expect(queryByTestId('empty-state')).toBeTruthy();
    });
  });

  describe('Error Handling - Slice 4.1: Error state variable', () => {
    it('should not display error state when no error occurs', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(queryByTestId('error-state')).toBeNull();
    });
  });

  describe('Error Handling - Slice 4.2: Catch initial load errors', () => {
    it('should set error state when initial getRounds fails', async () => {
      getRounds.mockRejectedValue(new Error('Network error. Please check your internet connection.'));

      const { queryByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      // Error state should exist now
      expect(queryByTestId('error-state')).toBeTruthy();
    });

    it('should store actual backend error message in state', async () => {
      getRounds.mockRejectedValue(new Error('Too many rounds list requests, please try again in 10 minutes'));

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('Too many rounds list requests, please try again in 10 minutes')).toBeTruthy();
    });
  });

  describe('Error Handling - Slice 4.3: Display error UI', () => {
    it('should display error container when error exists', async () => {
      getRounds.mockRejectedValue(new Error('Something went wrong. Please try again.'));

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByTestId('error-state')).toBeTruthy();
    });

    it('should display backend error message in error state', async () => {
      getRounds.mockRejectedValue(new Error('Access token required'));

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('Access token required')).toBeTruthy();
    });

    it('should still show header when error occurs', async () => {
      getRounds.mockRejectedValue(new Error('Network error'));

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByText('Your Rounds')).toBeTruthy();
      expect(queryByTestId('create-round-header-button')).toBeTruthy();
    });
  });

  describe('Error Handling - Slice 4.4: Retry button', () => {
    it('should display retry button in error state', async () => {
      getRounds.mockRejectedValue(new Error('Network error'));

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByTestId('error-retry-button')).toBeTruthy();
    });

    it('should call getRounds again when retry button is pressed', async () => {
      getRounds.mockRejectedValueOnce(new Error('Network error'));

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      getRounds.mockClear();
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const retryButton = getByTestId('error-retry-button');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getRounds).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling - Slice 4.5: Clear error on retry', () => {
    it('should clear error and show rounds after successful retry', async () => {
      getRounds.mockRejectedValueOnce(new Error('Network error'));

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      expect(getByTestId('error-state')).toBeTruthy();

      const mockRounds = [
        {
          id: 'round-1',
          name: 'Round 1',
          course_id: 'course-1',
          course_name: 'Course 1',
          status: 'in_progress',
          start_time: '2024-01-15T10:00:00Z',
          player_count: 2,
          skins_enabled: false,
        },
      ];

      getRounds.mockResolvedValue({
        rounds: mockRounds,
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const retryButton = getByTestId('error-retry-button');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(queryByTestId('error-state')).toBeNull();
      });

      expect(getByTestId('rounds-flatlist')).toBeTruthy();
      expect(getByTestId('round-card-round-1')).toBeTruthy();
    });

    it('should show loading state during retry', async () => {
      getRounds.mockRejectedValueOnce(new Error('Network error'));

      const { queryByTestId, getByTestId, getAllByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      let resolveRetry;
      const retryPromise = new Promise((resolve) => {
        resolveRetry = resolve;
      });

      getRounds.mockReturnValue(retryPromise);

      const retryButton = getByTestId('error-retry-button');
      fireEvent.press(retryButton);

      await waitFor(() => {
        const skeletonCards = getAllByTestId('skeleton-card');
        expect(skeletonCards).toHaveLength(3);
      });

      resolveRetry({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });
    });
  });

  describe('Error Handling - Slice 4.6: Theme styling', () => {
    it('should apply theme colors to error message', async () => {
      getRounds.mockRejectedValue(new Error('Network error'));

      const { queryByTestId, getByText } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const errorText = getByText('Network error');
      expect(errorText.props.style.color).toBe('#8E8E93');
    });

    it('should apply primary color to retry button', async () => {
      getRounds.mockRejectedValue(new Error('Network error'));

      const { queryByTestId, getByTestId } = render(<RoundsListScreen />);

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const retryButton = getByTestId('error-retry-button');
      expect(retryButton.props.style.backgroundColor).toBe('#007AFF');
    });
  });

  describe('One-Page Round Design: All Rounds Navigate to Scorecard', () => {
    it('should navigate pending round to Scorecard', async () => {
      const mockRounds = [
        {
          id: 'round-pending',
          name: 'Pending Round',
          course_id: 'course-1',
          course_name: 'Test Course',
          status: 'pending',
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

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const roundCard = getByTestId('round-card-round-pending');
      fireEvent.press(roundCard);

      expect(mockNavigate).toHaveBeenCalledWith('Scorecard', {
        roundId: 'round-pending',
      });
    });

    it('should navigate confirmed round to Scorecard', async () => {
      const mockRounds = [
        {
          id: 'round-confirmed',
          name: 'Confirmed Round',
          course_id: 'course-1',
          course_name: 'Test Course',
          status: 'confirmed',
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

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const roundCard = getByTestId('round-card-round-confirmed');
      fireEvent.press(roundCard);

      expect(mockNavigate).toHaveBeenCalledWith('Scorecard', {
        roundId: 'round-confirmed',
      });
    });

    it('should navigate in_progress round to Scorecard (Slice 14A: One-Page Round)', async () => {
      const mockRounds = [
        {
          id: 'round-in-progress',
          name: 'In Progress Round',
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

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const roundCard = getByTestId('round-card-round-in-progress');
      fireEvent.press(roundCard);

      expect(mockNavigate).toHaveBeenCalledWith('Scorecard', {
        roundId: 'round-in-progress',
      });
    });

    it('should navigate completed round to Scorecard (one-page round design)', async () => {
      const mockRounds = [
        {
          id: 'round-completed',
          name: 'Completed Round',
          course_id: 'course-1',
          course_name: 'Test Course',
          status: 'completed',
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

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const roundCard = getByTestId('round-card-round-completed');
      fireEvent.press(roundCard);

      expect(mockNavigate).toHaveBeenCalledWith('Scorecard', {
        roundId: 'round-completed',
      });
    });

    it('should navigate cancelled round to Scorecard', async () => {
      const mockRounds = [
        {
          id: 'round-cancelled',
          name: 'Cancelled Round',
          course_id: 'course-1',
          course_name: 'Test Course',
          status: 'cancelled',
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

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const roundCard = getByTestId('round-card-round-cancelled');
      fireEvent.press(roundCard);

      expect(mockNavigate).toHaveBeenCalledWith('Scorecard', {
        roundId: 'round-cancelled',
      });
    });

    it('should pass correct roundId parameter for all statuses', async () => {
      const mockRounds = [
        {
          id: 'unique-round-id-123',
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

      await waitFor(() => {
        expect(queryByTestId('skeleton-card')).toBeNull();
      });

      const roundCard = getByTestId('round-card-unique-round-id-123');
      fireEvent.press(roundCard);

      expect(mockNavigate).toHaveBeenCalledWith('Scorecard', {
        roundId: 'unique-round-id-123',
      });
    });
  });
});
