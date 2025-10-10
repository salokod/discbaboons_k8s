/**
 * ScoreSummaryCard Component Tests
 */

import { render, screen } from '@testing-library/react-native';
import ScoreSummaryCard from '../ScoreSummaryCard';

// Mock dependencies
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    surface: '#FFFFFF',
    border: '#E1E1E1',
    text: '#000000',
    textLight: '#666666',
    background: '#F5F5F5',
    primary: '#007AFF',
    success: '#28A745',
    error: '#DC3545',
  }),
}));

describe('ScoreSummaryCard', () => {
  const mockLeaderboard = [
    {
      id: 1,
      username: 'player1',
      display_name: 'Alice',
      position: 1,
      total_score: -3,
      hole_scores: {
        1: 3,
        2: 2,
        3: 4,
        4: 3,
        5: 5,
        6: 2,
      },
    },
    {
      id: 2,
      username: 'player2',
      display_name: 'Bob',
      position: 2,
      total_score: 1,
      hole_scores: {
        1: 4,
        2: 3,
        3: 5,
        4: 4,
        5: 6,
        6: 3,
      },
    },
  ];

  it('should export a component', () => {
    expect(ScoreSummaryCard).toBeDefined();
    expect(typeof ScoreSummaryCard).toBe('function');
  });

  it('should render summary card with stats', () => {
    render(<ScoreSummaryCard leaderboard={mockLeaderboard} />);

    const card = screen.getByTestId('score-summary-card');
    expect(card).toBeTruthy();
  });

  it('should display best hole stat', () => {
    render(<ScoreSummaryCard leaderboard={mockLeaderboard} />);

    const bestHole = screen.getByTestId('best-hole-stat');
    expect(bestHole).toBeTruthy();
  });

  it('should display worst hole stat', () => {
    render(<ScoreSummaryCard leaderboard={mockLeaderboard} />);

    const worstHole = screen.getByTestId('worst-hole-stat');
    expect(worstHole).toBeTruthy();
  });

  it('should display scoring average stat', () => {
    render(<ScoreSummaryCard leaderboard={mockLeaderboard} />);

    const average = screen.getByTestId('scoring-average-stat');
    expect(average).toBeTruthy();
  });

  it('should handle empty leaderboard', () => {
    render(<ScoreSummaryCard leaderboard={[]} />);

    const card = screen.getByTestId('score-summary-card');
    expect(card).toBeTruthy();
  });

  it('should handle missing hole_scores', () => {
    const leaderboardWithoutScores = [
      {
        id: 1,
        username: 'player1',
        display_name: 'Alice',
        position: 1,
        total_score: -3,
      },
    ];

    render(<ScoreSummaryCard leaderboard={leaderboardWithoutScores} />);

    const card = screen.getByTestId('score-summary-card');
    expect(card).toBeTruthy();
  });
});
