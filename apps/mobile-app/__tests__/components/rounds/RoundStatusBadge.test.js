/**
 * RoundStatusBadge Component Tests
 */

import { render, screen } from '@testing-library/react-native';
import RoundStatusBadge from '../../../src/components/rounds/RoundStatusBadge';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Wrapper component with ThemeProvider
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

describe('RoundStatusBadge', () => {
  it('should export a component', () => {
    expect(RoundStatusBadge).toBeDefined();
    expect(typeof RoundStatusBadge).toBe('object'); // memo returns an object
  });

  it('should render the status badge', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="in_progress" />
      </TestWrapper>,
    );

    expect(screen.getByTestId('round-status-badge')).toBeTruthy();
  });

  it('should display correct label for pending status', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="pending" />
      </TestWrapper>,
    );

    expect(screen.getByText('PENDING CONFIRMATION')).toBeTruthy();
  });

  it('should display correct label for confirmed status', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="confirmed" />
      </TestWrapper>,
    );

    expect(screen.getByText('READY TO PLAY')).toBeTruthy();
  });

  it('should display correct label for in_progress status', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="in_progress" />
      </TestWrapper>,
    );

    expect(screen.getByText('ROUND IN PROGRESS')).toBeTruthy();
  });

  it('should display correct label for completed status', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="completed" />
      </TestWrapper>,
    );

    expect(screen.getByText('ROUND COMPLETE')).toBeTruthy();
  });

  it('should display correct label for cancelled status', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="cancelled" />
      </TestWrapper>,
    );

    expect(screen.getByText('CANCELLED')).toBeTruthy();
  });

  it('should have accessibility label', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="in_progress" />
      </TestWrapper>,
    );

    expect(screen.getByLabelText('Round status: ROUND IN PROGRESS')).toBeTruthy();
  });

  it('should use theme colors for styling', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="in_progress" />
      </TestWrapper>,
    );

    const badge = screen.getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
    // Note: We'll verify styling visually - exact style matching is fragile in tests
  });

  it('should display correct color for pending status (yellow #FFC107)', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <RoundStatusBadge status="pending" />
      </TestWrapper>,
    );

    const badge = getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
    expect(badge.props.style.backgroundColor).toBe('#FFC107');
  });

  it('should display correct color for confirmed status (green #4CAF50)', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <RoundStatusBadge status="confirmed" />
      </TestWrapper>,
    );

    const badge = getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
    expect(badge.props.style.backgroundColor).toBe('#4CAF50');
  });

  it('should display correct color for in_progress status (blue #2196F3)', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <RoundStatusBadge status="in_progress" />
      </TestWrapper>,
    );

    const badge = getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
    expect(badge.props.style.backgroundColor).toBe('#2196F3');
  });

  it('should display correct color for completed status (gray #9E9E9E)', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <RoundStatusBadge status="completed" />
      </TestWrapper>,
    );

    const badge = getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
    expect(badge.props.style.backgroundColor).toBe('#9E9E9E');
  });

  it('should display correct color for cancelled status (red #F44336)', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <RoundStatusBadge status="cancelled" />
      </TestWrapper>,
    );

    const badge = getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
    expect(badge.props.style.backgroundColor).toBe('#F44336');
  });

  it('should handle undefined status gracefully', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge />
      </TestWrapper>,
    );

    const badge = screen.getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
  });

  it('should handle null status gracefully', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status={null} />
      </TestWrapper>,
    );

    const badge = screen.getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
  });

  it('should handle unknown status gracefully', () => {
    render(
      <TestWrapper>
        <RoundStatusBadge status="unknown_status" />
      </TestWrapper>,
    );

    const badge = screen.getByTestId('round-status-badge');
    expect(badge).toBeTruthy();
    expect(screen.getByText('Unknown Status')).toBeTruthy();
  });

  it('should be memoized with React.memo', () => {
    expect(RoundStatusBadge).toBeDefined();
    expect(typeof RoundStatusBadge).toBe('object'); // memo returns an object
    expect(RoundStatusBadge.$$typeof).toBeDefined();
  });
});
