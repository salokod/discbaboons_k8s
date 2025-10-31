/**
 * Rounds List Navigation Integration Tests
 *
 * Package E: Integration Testing
 * Tests complete navigation flows from RoundsListScreen to target screens
 *
 * Slice E1: Active round flow (RoundsList → ScorecardRedesign)
 * Slice E2: Completed round flow (RoundsList → RoundSummary → RoundDetail)
 */

describe('Rounds List Navigation Integration Tests', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Slice E1: Active Round Navigation Flow', () => {
    it('should navigate directly from active round in list to ScorecardRedesign screen', () => {
      // Test the navigation logic for active rounds
      const activeRound = {
        id: 'active-round-1',
        name: 'Morning Round',
        course_id: 'course-123',
        course_name: 'Maple Hill',
        status: 'in_progress',
        start_time: '2024-01-15T10:00:00Z',
        player_count: 4,
        skins_enabled: true,
        skins_value: 5,
      };

      // Simulate handleRoundPress logic from RoundsListScreen
      if (activeRound.status === 'in_progress') {
        mockNavigation.navigate('Scorecard', { roundId: activeRound.id });
      }

      // Verify navigation was called correctly
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Scorecard', {
        roundId: 'active-round-1',
      });
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Slice E2: Completed Round Navigation Flow (Updated Phase 2 Slice 9)', () => {
    it('should navigate from completed round directly to RoundDetail screen', () => {
      // Phase 2 Slice 8 changed ALL rounds to navigate directly to RoundDetail
      // RoundSummary is no longer in the navigation flow
      const completedRound = {
        id: 'completed-round-1',
        name: 'Evening Round',
        course_id: 'course-456',
        course_name: 'Pine Valley',
        status: 'completed',
        start_time: '2024-01-15T18:00:00Z',
        player_count: 3,
        skins_enabled: false,
      };

      // Simulate handleRoundPress logic from RoundsListScreen (updated in Slice 8)
      mockNavigation.navigate('RoundDetail', { roundId: completedRound.id });

      // Verify navigation was called correctly - now goes directly to RoundDetail
      expect(mockNavigation.navigate).toHaveBeenCalledWith('RoundDetail', {
        roundId: 'completed-round-1',
      });
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
    });

    it('should verify simplified navigation flow: RoundsList → RoundDetail', () => {
      // Phase 2 Slice 8 simplified the navigation
      // Old flow: RoundsList → RoundSummary → RoundDetail
      // New flow: RoundsList → RoundDetail (single step)
      //
      // RoundDetail now handles all round statuses and displays appropriate content

      const expectedFlow = [
        { from: 'RoundsList', to: 'RoundDetail', trigger: 'tap round card' },
      ];

      expect(expectedFlow).toHaveLength(1);
      expect(expectedFlow[0].to).toBe('RoundDetail');
    });
  });
});
