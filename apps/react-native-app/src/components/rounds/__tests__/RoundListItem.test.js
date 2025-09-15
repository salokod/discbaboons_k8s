import React from 'react';
import { render } from '@testing-library/react-native';
import RoundListItem from '../RoundListItem';

describe('RoundListItem', () => {
  it('should export a function', () => {
    expect(typeof RoundListItem).toBe('function');
  });

  it('should show status badge with correct color for active round', () => {
    const round = {
      id: 1,
      status: 'active',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
    const statusBadge = getByTestId('status-badge');

    expect(statusBadge).toBeTruthy();
    expect(statusBadge.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#22c55e'
      })
    );
  });

  it('should show status badge with correct color for completed round', () => {
    const round = {
      id: 1,
      status: 'completed',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
    const statusBadge = getByTestId('status-badge');

    expect(statusBadge.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#3b82f6'
      })
    );
  });

  it('should show status badge with correct color for cancelled round', () => {
    const round = {
      id: 1,
      status: 'cancelled',
      course_id: 1,
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
    const statusBadge = getByTestId('status-badge');

    expect(statusBadge.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#ef4444'
      })
    );
  });

  it('should display round name when provided', () => {
    const round = {
      id: 1,
      name: 'Morning Round',
      status: 'active',
      course_id: 'prospect-park',
      start_time: '2024-01-15T10:00:00Z',
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
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
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
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
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
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
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
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
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
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
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
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
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
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
      player_count: 3
    };

    const { getByTestId } = render(<RoundListItem round={round} />);
    const statusIcon = getByTestId('status-icon');

    expect(statusIcon).toBeTruthy();
    expect(statusIcon.props.name).toBe('close-circle');
  });
});