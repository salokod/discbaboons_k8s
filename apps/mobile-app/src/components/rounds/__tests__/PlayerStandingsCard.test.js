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
});
