/**
 * SideBetsCard Component Tests
 * Tests for the side bets display card in Round Details
 */

import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import SideBetsCard from '../../../src/components/rounds/SideBetsCard';

// Test wrapper component with theme
function TestWrapper({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('SideBetsCard', () => {
  describe('Component Existence', () => {
    it('should export a function', () => {
      expect(typeof SideBetsCard).toBe('function');
    });

    it('should render without crashing', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={[]}
            loading={false}
          />
        </TestWrapper>,
      );

      expect(getByTestId('side-bets-card')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when loading is true', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={[]}
            loading
          />
        </TestWrapper>,
      );

      expect(getByTestId('side-bets-loading')).toBeTruthy();
    });

    it('should not display loading indicator when loading is false', () => {
      const { queryByTestId } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={[]}
            loading={false}
          />
        </TestWrapper>,
      );

      expect(queryByTestId('side-bets-loading')).toBeNull();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no side bets exist', () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={[]}
            loading={false}
          />
        </TestWrapper>,
      );

      expect(getByText('No side bets yet')).toBeTruthy();
      expect(getByTestId('add-side-bet-button')).toBeTruthy();
    });
  });

  describe('Bets List Display', () => {
    const mockSideBets = [
      {
        id: 'bet-1',
        name: 'Closest to Pin Hole 7',
        description: 'Closest to the pin on hole 7',
        amount: '10.00',
        bet_type: 'hole',
        hole_number: 7,
        winner_id: null,
        participants: [
          { id: 'p1', username: 'player1' },
          { id: 'p2', username: 'player2' },
        ],
      },
      {
        id: 'bet-2',
        name: 'Most Birdies',
        description: 'Most birdies in the round',
        amount: '20.00',
        bet_type: 'round',
        hole_number: null,
        winner_id: 'p1',
        participants: [
          { id: 'p1', username: 'player1' },
          { id: 'p2', username: 'player2' },
          { id: 'p3', username: 'player3' },
        ],
      },
    ];

    it('should display list of side bets', () => {
      const { getByText, getAllByTestId } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={mockSideBets}
            loading={false}
          />
        </TestWrapper>,
      );

      expect(getByText('Closest to Pin Hole 7')).toBeTruthy();
      expect(getByText('Most Birdies')).toBeTruthy();
      expect(getAllByTestId(/^bet-item-/).length).toBe(2);
    });

    it('should display bet amount as currency', () => {
      const { getByText } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={mockSideBets}
            loading={false}
          />
        </TestWrapper>,
      );

      expect(getByText('$10.00')).toBeTruthy();
      expect(getByText('$20.00')).toBeTruthy();
    });

    it('should display participant count', () => {
      const { getByText } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={mockSideBets}
            loading={false}
          />
        </TestWrapper>,
      );

      expect(getByText('2 players')).toBeTruthy();
      expect(getByText('3 players')).toBeTruthy();
    });

    it('should show winner if bet is settled', () => {
      const { getByText } = render(
        <TestWrapper>
          <SideBetsCard
            testID="side-bets-card"
            sideBets={mockSideBets}
            loading={false}
          />
        </TestWrapper>,
      );

      expect(getByText(/Won by player1/i)).toBeTruthy();
    });
  });
});
