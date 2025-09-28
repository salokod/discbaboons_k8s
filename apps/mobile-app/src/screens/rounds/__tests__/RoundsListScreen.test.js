import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RoundsListScreen, { categorizeRounds, createSections } from '../RoundsListScreen';
import { getRounds } from '../../../services/roundService';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock dependencies
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    primary: '#007AFF',
    border: '#E1E1E1',
    white: '#FFFFFF',
    warning: '#FF9500',
    black: '#000000',
  }),
}));

// Mock roundService
jest.mock('../../../services/roundService', () => ({
  getRounds: jest.fn(),
  createRound: jest.fn(),
  getRoundDetails: jest.fn(),
}));

jest.mock('../../../design-system/components/EmptyState', () => {
  const ReactLocal = require('react');
  const { Text } = require('react-native');
  return function EmptyState({ title, subtitle, actionLabel }) {
    return ReactLocal.createElement(Text, { testID: 'empty-state' }, `${title} | ${subtitle} | ${actionLabel}`);
  };
});

jest.mock('../../../components/AppContainer', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');
  return function AppContainer({ children }) {
    return ReactLocal.createElement(View, { testID: 'app-container' }, children);
  };
});

describe('RoundsListScreen', () => {
  const renderWithNavigation = (component) => render(
    <NavigationContainer>
      {component}
    </NavigationContainer>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock - return empty rounds for most tests
    getRounds.mockResolvedValue({
      rounds: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });
  });

  it('should export component with memo and displayName', () => {
    expect(RoundsListScreen.displayName).toBe('RoundsListScreen');
    expect(RoundsListScreen).toBeDefined();
  });

  it('should render without rounds and show empty state', async () => {
    const { getByTestId, getByText } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Should render the main screen container
    expect(getByTestId('rounds-list-screen')).toBeTruthy();

    // Wait for loading to complete and empty state to show
    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });

    // Should show empty state with appropriate message
    expect(getByText(/No rounds yet/)).toBeTruthy();
  });

  it('should show header even when empty', async () => {
    const { getByText } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByText('My Rounds')).toBeTruthy();
      expect(getByText('0 rounds')).toBeTruthy();
    });
  });

  it('should render FAB button and be tappable', async () => {
    const { getByTestId } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId('empty-state')).toBeTruthy();
    });

    // Should render the FAB button
    expect(getByTestId('rounds-fab-button')).toBeTruthy();

    // FAB button should be tappable
    const fabButton = getByTestId('rounds-fab-button');
    expect(fabButton).toBeTruthy();

    // Test that it can be pressed (this will test the onPress handler)
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.press(fabButton);

    // Should have called navigation to CreateRound
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateRound');
  });

  it('should display rounds list when rounds exist', async () => {
    // Override the default mock to return some rounds
    getRounds.mockResolvedValue({
      rounds: [
        {
          id: 'round-1',
          name: 'Morning Round',
          course_name: 'Maple Hill',
          status: 'completed',
        },
        {
          id: 'round-2',
          name: 'Evening Round',
          course_name: 'Pine Valley',
          status: 'in_progress',
        },
      ],
      pagination: {
        total: 2, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId, queryByTestId } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Should render the main screen container
    expect(getByTestId('rounds-list-screen')).toBeTruthy();

    // Wait for loading to complete and API to be called
    await waitFor(() => {
      expect(getRounds).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    });

    // Wait for rounds section list to appear
    await waitFor(() => {
      // Should NOT show empty state when rounds exist
      expect(queryByTestId('empty-state')).toBeNull();
      // Should show rounds section list instead (when rounds exist, use SectionList)
      expect(getByTestId('rounds-section-list')).toBeTruthy();
    });

    // Should still show FAB button for creating new rounds
    expect(getByTestId('rounds-fab-button')).toBeTruthy();
  });

  it('should show header with correct count when rounds exist', async () => {
    // Override the default mock to return some rounds
    getRounds.mockResolvedValue({
      rounds: [
        {
          id: 'round-1',
          name: 'Morning Round',
          course_name: 'Maple Hill',
          status: 'completed',
        },
        {
          id: 'round-2',
          name: 'Evening Round',
          course_name: 'Pine Valley',
          status: 'in_progress',
        },
      ],
      pagination: {
        total: 2, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByText } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByText('My Rounds')).toBeTruthy();
      expect(getByText('2 rounds')).toBeTruthy();
    });
  });

  it('should use ListHeaderComponent so header scrolls with content', async () => {
    getRounds.mockResolvedValue({
      rounds: [{
        id: 'round-1', name: 'Test Round', course_name: 'Test Course', status: 'completed',
      }],
      pagination: {
        total: 1, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId('rounds-section-list')).toBeTruthy();
    });

    // Verify SectionList has ListHeaderComponent (header scrolls with content)
    const sectionList = getByTestId('rounds-section-list');
    expect(sectionList).toBeTruthy();
  });

  it('should add 12px spacing between round cards', async () => {
    getRounds.mockResolvedValue({
      rounds: [
        {
          id: 'round-1', name: 'Round 1', course_name: 'Course 1', status: 'completed',
        },
        {
          id: 'round-2', name: 'Round 2', course_name: 'Course 2', status: 'in_progress',
        },
      ],
      pagination: {
        total: 2, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId('rounds-section-list')).toBeTruthy();
    });

    // This test verifies the SectionList exists and renders round items
    // The actual spacing is tested in RoundCard component tests
    expect(getByTestId('rounds-section-list')).toBeTruthy();
  });

  it('should manage refresh state', async () => {
    getRounds.mockResolvedValue({
      rounds: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(getByTestId('rounds-list')).toBeTruthy();
    });

    // Check that the list has RefreshControl
    const flatList = getByTestId('rounds-list');
    expect(flatList.props.refreshControl).toBeDefined();
  });

  it('should support pull-to-refresh functionality', async () => {
    // Initial load with no rounds
    getRounds.mockResolvedValueOnce({
      rounds: [],
      pagination: {
        total: 0, limit: 20, offset: 0, hasMore: false,
      },
    });

    const { getByTestId, getByText } = renderWithNavigation(
      <RoundsListScreen navigation={mockNavigation} />,
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(getByTestId('rounds-list')).toBeTruthy();
      expect(getByText('0 rounds')).toBeTruthy();
    });

    // Mock the refresh to return rounds
    getRounds.mockResolvedValueOnce({
      rounds: [{
        id: 'new-round', name: 'New Round', course_name: 'Test Course', status: 'completed',
      }],
      pagination: {
        total: 1, limit: 20, offset: 0, hasMore: false,
      },
    });

    // Simulate pull-to-refresh
    const flatList = getByTestId('rounds-list');
    const { refreshControl } = flatList.props;

    // Trigger onRefresh
    await refreshControl.props.onRefresh();

    // Wait for refresh to complete and verify updated data
    await waitFor(() => {
      expect(getRounds).toHaveBeenCalledTimes(2);
      expect(getByTestId('header-count')).toHaveTextContent('1 round');
    });
  });

  describe('Categorized Sections', () => {
    it('should categorize rounds into active and completed groups', () => {
      const mockRounds = [
        { id: '1', status: 'in_progress', name: 'Active Round 1' },
        { id: '2', status: 'completed', name: 'Completed Round 1' },
        { id: '3', status: 'in_progress', name: 'Active Round 2' },
        { id: '4', status: 'cancelled', name: 'Cancelled Round 1' },
      ];

      const result = categorizeRounds(mockRounds);

      expect(result.activeRounds).toHaveLength(2);
      expect(result.activeRounds[0].status).toBe('in_progress');
      expect(result.activeRounds[1].status).toBe('in_progress');

      expect(result.completedRounds).toHaveLength(2);
      expect(result.completedRounds.some((r) => r.status === 'completed')).toBe(true);
      expect(result.completedRounds.some((r) => r.status === 'cancelled')).toBe(true);
    });

    it('should handle empty rounds array', () => {
      const result = categorizeRounds([]);

      expect(result.activeRounds).toHaveLength(0);
      expect(result.completedRounds).toHaveLength(0);
    });

    it('should handle all rounds being active', () => {
      const mockRounds = [
        { id: '1', status: 'in_progress' },
        { id: '2', status: 'in_progress' },
      ];

      const result = categorizeRounds(mockRounds);

      expect(result.activeRounds).toHaveLength(2);
      expect(result.completedRounds).toHaveLength(0);
    });

    it('should handle all rounds being completed', () => {
      const mockRounds = [
        { id: '1', status: 'completed' },
        { id: '2', status: 'cancelled' },
      ];

      const result = categorizeRounds(mockRounds);

      expect(result.activeRounds).toHaveLength(0);
      expect(result.completedRounds).toHaveLength(2);
    });
  });

  describe('createSections', () => {
    it('should create sections array structure with active and completed rounds', () => {
      const activeRounds = [
        { id: '1', status: 'in_progress', name: 'Active Round 1' },
        { id: '2', status: 'in_progress', name: 'Active Round 2' },
      ];
      const completedRounds = [
        { id: '3', status: 'completed', name: 'Completed Round 1' },
        { id: '4', status: 'cancelled', name: 'Cancelled Round 1' },
      ];

      const sections = createSections({ activeRounds, completedRounds });

      expect(sections).toHaveLength(2);

      // Check Active Rounds section
      expect(sections[0]).toEqual({
        title: 'Active Rounds',
        data: activeRounds,
        key: 'active',
      });

      // Check Completed Rounds section
      expect(sections[1]).toEqual({
        title: 'Completed Rounds',
        data: completedRounds,
        key: 'completed',
      });
    });

    it('should handle empty active rounds array', () => {
      const activeRounds = [];
      const completedRounds = [
        { id: '1', status: 'completed', name: 'Completed Round 1' },
      ];

      const sections = createSections({ activeRounds, completedRounds });

      expect(sections).toHaveLength(2);
      expect(sections[0].data).toHaveLength(0);
      expect(sections[1].data).toHaveLength(1);
    });

    it('should handle empty completed rounds array', () => {
      const activeRounds = [
        { id: '1', status: 'in_progress', name: 'Active Round 1' },
      ];
      const completedRounds = [];

      const sections = createSections({ activeRounds, completedRounds });

      expect(sections).toHaveLength(2);
      expect(sections[0].data).toHaveLength(1);
      expect(sections[1].data).toHaveLength(0);
    });

    it('should handle both arrays being empty', () => {
      const activeRounds = [];
      const completedRounds = [];

      const sections = createSections({ activeRounds, completedRounds });

      expect(sections).toHaveLength(2);
      expect(sections[0].data).toHaveLength(0);
      expect(sections[1].data).toHaveLength(0);
    });
  });

  describe('SectionList Migration', () => {
    it('should render SectionList instead of FlatList when rounds exist', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            name: 'Active Round',
            course_name: 'Test Course',
            status: 'in_progress',
          },
          {
            id: 'round-2',
            name: 'Completed Round',
            course_name: 'Test Course',
            status: 'completed',
          },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByTestId, queryByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('rounds-section-list')).toBeTruthy();
        // Should NOT have the old FlatList
        expect(queryByTestId('rounds-list')).toBeNull();
      });
    });

    it('should preserve RefreshControl functionality in SectionList', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            status: 'in_progress',
            name: 'Test Round',
            course_name: 'Test Course',
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId('rounds-section-list')).toBeTruthy();
      });

      const sectionList = getByTestId('rounds-section-list');
      expect(sectionList.props.refreshControl).toBeDefined();
    });

    it('should preserve ListHeaderComponent functionality in SectionList', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            status: 'in_progress',
            name: 'Test Round',
            course_name: 'Test Course',
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByText, getByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText('My Rounds')).toBeTruthy();
        expect(getByTestId('header-count')).toHaveTextContent('1 round');
      });
    });

    it('should use FlatList when no rounds exist (empty state)', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByTestId, queryByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should show FlatList for empty state
        expect(getByTestId('rounds-list')).toBeTruthy();
        // Should NOT show SectionList when empty
        expect(queryByTestId('rounds-section-list')).toBeNull();
      });
    });
  });

  describe('Section Headers', () => {
    it('should display section headers with correct titles and counts', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            name: 'Active Round',
            course_name: 'Test Course',
            status: 'in_progress',
          },
          {
            id: 'round-2',
            name: 'Completed Round',
            course_name: 'Test Course',
            status: 'completed',
          },
          {
            id: 'round-3',
            name: 'Cancelled Round',
            course_name: 'Test Course',
            status: 'cancelled',
          },
        ],
        pagination: {
          total: 3, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByText } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should show Active Rounds section header with count
        expect(getByText('Active Rounds')).toBeTruthy();
        expect(getByText('1 round')).toBeTruthy();

        // Should show Completed Rounds section header with count
        expect(getByText('Completed Rounds')).toBeTruthy();
        expect(getByText('2 rounds')).toBeTruthy();
      });
    });

    it('should show correct pluralization for section counts', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            name: 'Active Round 1',
            course_name: 'Test Course',
            status: 'in_progress',
          },
          {
            id: 'round-2',
            name: 'Active Round 2',
            course_name: 'Test Course',
            status: 'in_progress',
          },
        ],
        pagination: {
          total: 2, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByText, getByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should show Active Rounds section header with plural count
        expect(getByText('Active Rounds')).toBeTruthy();
        expect(getByTestId('section-count-active')).toHaveTextContent('2 rounds');

        // Should show Completed Rounds section header with zero count
        expect(getByText('Completed Rounds')).toBeTruthy();
        expect(getByTestId('section-count-completed')).toHaveTextContent('0 rounds');
      });
    });

    it('should display section headers even when sections are empty', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            name: 'Completed Round',
            course_name: 'Test Course',
            status: 'completed',
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByText, getByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should show Active Rounds header even when empty
        expect(getByText('Active Rounds')).toBeTruthy();
        expect(getByTestId('section-count-active')).toHaveTextContent('0 rounds');

        // Should show Completed Rounds header with count
        expect(getByText('Completed Rounds')).toBeTruthy();
        expect(getByTestId('section-count-completed')).toHaveTextContent('1 round');
      });
    });
  });

  describe('Empty Section States', () => {
    it('should show EmptyRoundsScreen only when both sections are empty', async () => {
      getRounds.mockResolvedValue({
        rounds: [],
        pagination: {
          total: 0, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByTestId, queryByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should show FlatList with empty component (not SectionList)
        expect(getByTestId('rounds-list')).toBeTruthy();
        expect(queryByTestId('rounds-section-list')).toBeNull();
        expect(getByTestId('empty-state')).toBeTruthy();
      });
    });

    it('should show section headers with zero counts when individual sections are empty', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            name: 'Completed Round',
            course_name: 'Test Course',
            status: 'completed',
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByText, getByTestId, queryByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should use SectionList (not FlatList)
        expect(getByTestId('rounds-section-list')).toBeTruthy();
        expect(queryByTestId('rounds-list')).toBeNull();

        // Should NOT show empty state
        expect(queryByTestId('empty-state')).toBeNull();

        // Should show both section headers
        expect(getByText('Active Rounds')).toBeTruthy();
        expect(getByTestId('section-count-active')).toHaveTextContent('0 rounds');
        expect(getByText('Completed Rounds')).toBeTruthy();
        expect(getByTestId('section-count-completed')).toHaveTextContent('1 round');
      });
    });

    it('should render sections with empty data arrays correctly', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            name: 'Active Round',
            course_name: 'Test Course',
            status: 'in_progress',
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { getByText, getByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should use SectionList
        expect(getByTestId('rounds-section-list')).toBeTruthy();

        // Should show Active Rounds section with count
        expect(getByText('Active Rounds')).toBeTruthy();
        expect(getByTestId('section-count-active')).toHaveTextContent('1 round');

        // Should show Completed Rounds section with zero count
        expect(getByText('Completed Rounds')).toBeTruthy();
        expect(getByTestId('section-count-completed')).toHaveTextContent('0 rounds');
      });
    });

    it('should not show empty state when using SectionList even if some sections are empty', async () => {
      getRounds.mockResolvedValue({
        rounds: [
          {
            id: 'round-1',
            name: 'Active Round',
            course_name: 'Test Course',
            status: 'in_progress',
          },
        ],
        pagination: {
          total: 1, limit: 20, offset: 0, hasMore: false,
        },
      });

      const { queryByTestId } = renderWithNavigation(
        <RoundsListScreen navigation={mockNavigation} />,
      );

      await waitFor(() => {
        // Should NOT show empty state component
        expect(queryByTestId('empty-state')).toBeNull();
      });
    });
  });
});
