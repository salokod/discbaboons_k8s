/**
 * PlayerStandingsCard Component Tests
 * Tests for adaptive player display that responds to different player counts
 */

import { render, fireEvent } from '@testing-library/react-native';
import PlayerStandingsCard from '../PlayerStandingsCard';

// Mock dependencies
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    surface: '#FFFFFF',
    border: '#E1E1E1',
    text: '#000000',
    textLight: '#666666',
    background: '#F5F5F5',
  }),
}));

jest.mock('../../../design-system/components/RankIndicator', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function RankIndicator({ rank, totalPlayers }) {
    return React.createElement(
      View,
      { testID: 'rank-indicator' },
      React.createElement(Text, null, `Rank ${rank} of ${totalPlayers}`),
    );
  };
});

describe('PlayerStandingsCard', () => {
  const mockPlayers = [
    {
      id: 1,
      username: 'player1',
      display_name: 'Alice',
      position: 1,
      total_score: -3,
    },
    {
      id: 2,
      username: 'player2',
      display_name: 'Bob',
      position: 2,
      total_score: 1,
    },
  ];

  describe('Sub-slice 4.2: Adaptive Player Display', () => {
    it('should export a function', () => {
      expect(typeof PlayerStandingsCard).toBe('function');
    });

    it('should render with players data', () => {
      const { getByTestId } = render(<PlayerStandingsCard players={mockPlayers} />);
      expect(getByTestId('player-standings-card')).toBeTruthy();
    });

    it('should use compact layout for small player count (2-4 players)', () => {
      const { getByTestId } = render(<PlayerStandingsCard players={mockPlayers} />);
      expect(getByTestId('compact-layout')).toBeTruthy();
    });

    it('should use expanded layout for larger player count (5+ players)', () => {
      const largePlayers = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        username: `player${i + 1}`,
        display_name: `Player ${i + 1}`,
        position: i + 1,
        total_score: i - 2,
      }));

      const { getByTestId } = render(<PlayerStandingsCard players={largePlayers} />);
      expect(getByTestId('expanded-layout')).toBeTruthy();
    });

    it('should render rank indicators for each player', () => {
      const { getAllByTestId } = render(<PlayerStandingsCard players={mockPlayers} />);
      const rankIndicators = getAllByTestId('rank-indicator');
      expect(rankIndicators).toHaveLength(2);
    });

    it('should display player names and scores', () => {
      const { getByText } = render(<PlayerStandingsCard players={mockPlayers} />);
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('-3')).toBeTruthy();
      expect(getByText('+1')).toBeTruthy();
    });

    it('should have proper styling and theming', () => {
      const { getByTestId } = render(<PlayerStandingsCard players={mockPlayers} />);
      const card = getByTestId('player-standings-card');
      expect(card.props.style).toMatchObject({
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24, // spacing.lg
      });
    });
  });

  describe('Sub-slice 4.3: Score Context Display', () => {
    const mockPlayersWithContext = [
      {
        id: 1,
        username: 'player1',
        display_name: 'Alice',
        position: 1,
        total_score: -3,
        holes_completed: 18,
        round_par: 54,
      },
      {
        id: 2,
        username: 'player2',
        display_name: 'Bob',
        position: 2,
        total_score: 2,
        holes_completed: 18,
        round_par: 54,
      },
    ];

    it('should display score context with par information', () => {
      const { getByText } = render(
        <PlayerStandingsCard players={mockPlayersWithContext} showContext />,
      );
      expect(getByText('-3 (3 under par)')).toBeTruthy();
      expect(getByText('+2 (2 over par)')).toBeTruthy();
    });

    it('should show progress indicators for incomplete rounds', () => {
      const incompletePlayer = [{
        ...mockPlayersWithContext[0],
        holes_completed: 12,
      }];

      const { getByText } = render(<PlayerStandingsCard players={incompletePlayer} showContext />);
      expect(getByText('12/18 holes')).toBeTruthy();
    });

    it('should handle different par scenarios correctly', () => {
      const evenParPlayer = [{
        ...mockPlayersWithContext[0],
        total_score: 0,
      }];

      const { getByText } = render(<PlayerStandingsCard players={evenParPlayer} showContext />);
      expect(getByText('E (at par)')).toBeTruthy();
    });

    it('should not show context when showContext is false', () => {
      const { getByText, queryByText } = render(
        <PlayerStandingsCard players={mockPlayersWithContext} showContext={false} />,
      );
      expect(getByText('-3')).toBeTruthy();
      expect(queryByText('-3 (3 under par)')).toBeNull();
    });
  });

  describe('Sub-slice 4.4: Loading and Error States', () => {
    it('should show skeleton loading state when loading is true', () => {
      const { getByTestId } = render(<PlayerStandingsCard players={[]} loading />);
      expect(getByTestId('loading-skeleton')).toBeTruthy();
    });

    it('should show error state when error prop is provided', () => {
      const { getByTestId, getByText } = render(
        <PlayerStandingsCard players={[]} error="Failed to load standings" />,
      );
      expect(getByTestId('error-state')).toBeTruthy();
      expect(getByText('Failed to load standings')).toBeTruthy();
    });

    it('should show retry button in error state', () => {
      const mockRetry = jest.fn();
      const { getByTestId } = render(
        <PlayerStandingsCard players={[]} error="Network error" onRetry={mockRetry} />,
      );
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    it('should call onRetry when retry button is pressed', () => {
      const mockRetry = jest.fn();
      const { getByTestId } = render(
        <PlayerStandingsCard players={[]} error="Network error" onRetry={mockRetry} />,
      );

      const retryButton = getByTestId('retry-button');
      fireEvent.press(retryButton);
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sub-slice 4.5: Round State Management', () => {
    const mockPlayersWithRoundState = [
      {
        id: 1,
        username: 'player1',
        display_name: 'Alice',
        position: 1,
        total_score: -3,
        round_status: 'active',
      },
    ];

    it('should display LIVE indicator for active rounds', () => {
      const { getByTestId, getByText } = render(
        <PlayerStandingsCard players={mockPlayersWithRoundState} showRoundState />,
      );
      expect(getByTestId('round-status-indicator')).toBeTruthy();
      expect(getByText('LIVE')).toBeTruthy();
    });

    it('should display FINAL indicator for completed rounds', () => {
      const completedPlayers = [{
        ...mockPlayersWithRoundState[0],
        round_status: 'completed',
      }];

      const { getByText } = render(
        <PlayerStandingsCard players={completedPlayers} showRoundState />,
      );
      expect(getByText('FINAL')).toBeTruthy();
    });

    it('should show last updated timestamp when provided', () => {
      const playersWithTimestamp = [{
        ...mockPlayersWithRoundState[0],
        last_updated: '2024-01-01T12:00:00Z',
      }];

      const { getByText } = render(
        <PlayerStandingsCard players={playersWithTimestamp} showRoundState />,
      );
      expect(getByText(/Last updated/)).toBeTruthy();
    });

    it('should not show round state when showRoundState is false', () => {
      const { queryByTestId } = render(
        <PlayerStandingsCard players={mockPlayersWithRoundState} showRoundState={false} />,
      );
      expect(queryByTestId('round-status-indicator')).toBeNull();
    });
  });

  describe('Slice 13.6: Empty State', () => {
    it('should show empty state when players array is empty', () => {
      const { getByTestId } = render(<PlayerStandingsCard players={[]} />);
      expect(getByTestId('empty-state')).toBeTruthy();
    });

    it('should show empty state with correct title and subtitle', () => {
      const { getByText } = render(<PlayerStandingsCard players={[]} />);
      expect(getByText('Ready to Start Scoring?')).toBeTruthy();
      expect(getByText('Tap the button below to open the scorecard')).toBeTruthy();
    });

    it('should show CTA button with correct label', () => {
      const { getByText } = render(<PlayerStandingsCard players={[]} />);
      expect(getByText('Start Scoring')).toBeTruthy();
    });

    it('should call onEmptyAction when CTA button is pressed', () => {
      const mockOnEmptyAction = jest.fn();
      const { getByText } = render(
        <PlayerStandingsCard players={[]} onEmptyAction={mockOnEmptyAction} />,
      );

      const button = getByText('Start Scoring');
      fireEvent.press(button);
      expect(mockOnEmptyAction).toHaveBeenCalledTimes(1);
    });

    it('should show icon in empty state', () => {
      const { getByTestId } = render(<PlayerStandingsCard players={[]} />);
      expect(getByTestId('empty-state-icon')).toBeTruthy();
    });

    it('should not show empty state when players array has items', () => {
      const playersWithData = [
        {
          id: 1,
          username: 'player1',
          display_name: 'Alice',
          position: 1,
          total_score: -3,
        },
      ];

      const { queryByTestId } = render(<PlayerStandingsCard players={playersWithData} />);
      expect(queryByTestId('empty-state')).toBeNull();
    });
  });

  describe('Phase 2 Slice 5: Status-Specific Empty States', () => {
    it('should display custom empty state message when provided', () => {
      const customMessage = 'Waiting for players to join';
      const { getByText } = render(
        <PlayerStandingsCard players={[]} emptyStateMessage={customMessage} />,
      );
      expect(getByText(customMessage)).toBeTruthy();
    });

    it('should use default message when emptyStateMessage is not provided', () => {
      const { getByText } = render(<PlayerStandingsCard players={[]} />);
      expect(getByText('Tap the button below to open the scorecard')).toBeTruthy();
    });

    it('should display pending status message', () => {
      const { getByText } = render(
        <PlayerStandingsCard players={[]} emptyStateMessage="Waiting for players to join" />,
      );
      expect(getByText('Waiting for players to join')).toBeTruthy();
    });

    it('should display confirmed status message', () => {
      const { getByText } = render(
        <PlayerStandingsCard players={[]} emptyStateMessage="Ready to start with confirmed players" />,
      );
      expect(getByText('Ready to start with confirmed players')).toBeTruthy();
    });

    it('should display in_progress status message', () => {
      const { getByText } = render(
        <PlayerStandingsCard players={[]} emptyStateMessage="Round in progress with no players" />,
      );
      expect(getByText('Round in progress with no players')).toBeTruthy();
    });

    it('should display completed status message', () => {
      const { getByText } = render(
        <PlayerStandingsCard players={[]} emptyStateMessage="Round completed with no players" />,
      );
      expect(getByText('Round completed with no players')).toBeTruthy();
    });

    it('should display cancelled status message', () => {
      const { getByText } = render(
        <PlayerStandingsCard players={[]} emptyStateMessage="This round was cancelled" />,
      );
      expect(getByText('This round was cancelled')).toBeTruthy();
    });

    it('should still show title and button with custom message', () => {
      const { getByText } = render(
        <PlayerStandingsCard
          players={[]}
          emptyStateMessage="Custom message"
        />,
      );
      expect(getByText('Ready to Start Scoring?')).toBeTruthy();
      expect(getByText('Custom message')).toBeTruthy();
      expect(getByText('Start Scoring')).toBeTruthy();
    });
  });

  describe('Slice 1: formatScore - Bug Fix: Handle null/undefined scores', () => {
    it('should render "—" when score is null', () => {
      const playerWithNullScore = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: null,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithNullScore]} />,
      );

      expect(getByText('—')).toBeTruthy();
    });

    it('should render "—" when score is undefined', () => {
      const playerWithUndefinedScore = {
        id: 1,
        username: 'testuser',
        position: 1,
        // total_score is intentionally omitted
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithUndefinedScore]} />,
      );

      expect(getByText('—')).toBeTruthy();
    });

    it('should return "E" when score is 0 (regression test)', () => {
      const playerWithZeroScore = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: 0,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithZeroScore]} />,
      );

      expect(getByText('E')).toBeTruthy();
    });

    it('should return "-3" when score is negative (regression test)', () => {
      const playerWithNegativeScore = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: -3,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithNegativeScore]} />,
      );

      expect(getByText('-3')).toBeTruthy();
    });

    it('should return "+2" when score is positive (regression test)', () => {
      const playerWithPositiveScore = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: 2,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithPositiveScore]} />,
      );

      expect(getByText('+2')).toBeTruthy();
    });

    it('should render "—" for player with null score even with context', () => {
      const playerWithNullScore = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: null,
        round_par: 54,
        holes_completed: 0,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithNullScore]} showContext />,
      );

      expect(getByText('—')).toBeTruthy();
    });
  });

  describe('Slice 2: Player name display - Bug Fix: Handle guest players', () => {
    it('should show guestName when isGuest is true', () => {
      const guestPlayer = {
        id: 1,
        isGuest: true,
        guestName: 'John Doe',
        username: null,
        position: 1,
        total_score: 0,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[guestPlayer]} />,
      );

      expect(getByText('John Doe')).toBeTruthy();
    });

    it('should show username when isGuest is false', () => {
      const registeredPlayer = {
        id: 1,
        isGuest: false,
        guestName: null,
        username: 'salokod',
        position: 1,
        total_score: 0,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[registeredPlayer]} />,
      );

      expect(getByText('salokod')).toBeTruthy();
    });

    it('should show "Unknown Player" when guest but guestName is null', () => {
      const guestNoName = {
        id: 1,
        isGuest: true,
        guestName: null,
        username: null,
        position: 1,
        total_score: 0,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[guestNoName]} />,
      );

      expect(getByText('Unknown Player')).toBeTruthy();
    });

    it('should prefer display_name over username for registered players', () => {
      const playerWithDisplayName = {
        id: 1,
        isGuest: false,
        username: 'salokod',
        display_name: 'Sal Okod',
        position: 1,
        total_score: 0,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithDisplayName]} />,
      );

      expect(getByText('Sal Okod')).toBeTruthy();
    });

    it('should show guestName even when display_name exists', () => {
      const guestWithDisplayName = {
        id: 1,
        isGuest: true,
        guestName: 'Guest Player',
        display_name: 'Should Not Show',
        username: null,
        position: 1,
        total_score: 0,
      };

      const { getByText, queryByText } = render(
        <PlayerStandingsCard players={[guestWithDisplayName]} />,
      );

      expect(getByText('Guest Player')).toBeTruthy();
      expect(queryByText('Should Not Show')).toBeNull();
    });
  });

  describe('Slice 3: Vertical alignment - Bug Fix', () => {
    it('should render component successfully with vertical alignment', () => {
      const player = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: 0,
      };

      const { getByText, getByTestId } = render(
        <PlayerStandingsCard players={[player]} />,
      );

      // Verify component renders with player name
      expect(getByText('testuser')).toBeTruthy();
      expect(getByTestId('player-standings-card')).toBeTruthy();
    });

    it('should render with progress text when showContext is true', () => {
      const playerWithProgress = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: -2,
        holes_completed: 12,
        round_par: 54,
      };

      const { getByText } = render(
        <PlayerStandingsCard players={[playerWithProgress]} showContext />,
      );

      // Verify player name and progress are both visible (requiring proper alignment)
      expect(getByText('testuser')).toBeTruthy();
      expect(getByText('12/18 holes')).toBeTruthy();
    });
  });

  describe('Slice 4: PropTypes - Bug Fix: Support guest fields', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should not throw PropTypes warnings with guest player', () => {
      const guestPlayer = {
        id: 1,
        isGuest: true,
        guestName: 'John Doe',
        username: null, // null is valid for guests
        position: 1,
        total_score: null, // null is valid when no scores yet
      };

      render(
        <PlayerStandingsCard players={[guestPlayer]} />,
      );

      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not throw PropTypes warnings with registered player', () => {
      const registeredPlayer = {
        id: 1,
        isGuest: false,
        username: 'salokod',
        position: 1,
        total_score: -3,
      };

      render(
        <PlayerStandingsCard players={[registeredPlayer]} />,
      );

      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not throw PropTypes warnings with null scores', () => {
      const playerWithNullScore = {
        id: 1,
        username: 'testuser',
        position: 1,
        total_score: null,
        holes_completed: 0,
      };

      render(
        <PlayerStandingsCard players={[playerWithNullScore]} />,
      );

      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should accept guestName and isGuest props without warnings', () => {
      const guestPlayerComplete = {
        id: 1,
        isGuest: true,
        guestName: 'Guest Player',
        username: null,
        position: 1,
        total_score: 0,
        holes_completed: 0,
        round_par: 54,
        round_status: 'active',
        last_updated: '2024-01-01T12:00:00Z',
      };

      render(
        <PlayerStandingsCard players={[guestPlayerComplete]} showRoundState />,
      );

      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
